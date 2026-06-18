using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuizSmart.API.DTOs;
using QuizSmart.API.Models;
using QuizSmart.API.Services;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace QuizSmart.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly QuizSmartDbContext _context;
        private readonly IConfiguration _config;
        private readonly ITokenService _tokenService;

        // Cookie name for the HttpOnly refresh token
        private const string RefreshTokenCookieName = "quizsmart_rt";

        public AuthController(
            QuizSmartDbContext context,
            IConfiguration config,
            ITokenService tokenService)
        {
            _context = context;
            _config = config;
            _tokenService = tokenService;
        }

        // ══════════════════════════════════════════════════════════════════════════
        // EXISTING ENDPOINTS — No breaking changes
        // ══════════════════════════════════════════════════════════════════════════

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto model)
        {
            if (!model.Email.ToLower().EndsWith("@fci.zu.edu.eg"))
            {
                return BadRequest("Registration is only available for Faculty of Computers and Information, Zagazig University members.");
            }

            if (model.Role == "Student" && model.Level == null)
            {
                return BadRequest("Academic level selection is required for student registration.");
            }

            var emailPrefix = model.Email.Split('@')[0];
            bool isNumericEmail = long.TryParse(emailPrefix, out _);

            if (isNumericEmail && model.Role == "Instructor")
            {
                return BadRequest("Numeric emails are reserved for students. You cannot register as an instructor.");
            }

            if (!isNumericEmail && model.Role == "Student")
            {
                return BadRequest("Staff emails cannot be used to register as a student.");
            }

            if (_context.Users.Any(u => u.Email == model.Email))
            {
                return BadRequest("This email address is already registered.");
            }

            var user = new User
            {
                Email = model.Email,
                FullName = model.FullName,
                Level = model.Role == "Student" ? model.Level : null,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password),
                Role = model.Role,
                IsVerified = false,
                OtpCode = new Random().Next(1000, 9999).ToString()
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            Console.WriteLine($"OTP for {user.Email} is: {user.OtpCode}");

            return Ok(new { message = "Registration successful. Please use the verification code shown in the console." });
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyRequest model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null) return NotFound("User not found.");
            if (user.IsVerified) return BadRequest("This account is already verified.");
            var cleanDbCode = user.OtpCode?.Replace(" ", "").Trim();
            var cleanInputCode = model.Code?.Replace(" ", "").Trim();
            if (cleanDbCode != cleanInputCode) return BadRequest("Invalid verification code.");

            user.IsVerified = true;
            user.OtpCode = null;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Account verified successfully!" });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest model)
        {
            var email = model.Email?.Trim().ToLower();
            if (string.IsNullOrEmpty(email) || !email.EndsWith("@fci.zu.edu.eg"))
            {
                return BadRequest("Please use your official university email (@fci.zu.edu.eg).");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
                return NotFound("No account found with this email address.");

            if (!user.IsVerified)
                return BadRequest("This account has not been verified yet. Please verify your email first.");

            user.OtpCode = new Random().Next(1000, 9999).ToString();
            await _context.SaveChangesAsync();

            Console.WriteLine($"[Password Reset] OTP for {user.Email} is: {user.OtpCode}");

            return Ok(new { message = "A reset code has been sent. Check the console for your OTP." });
        }

        [HttpPost("verify-reset-code")]
        public async Task<IActionResult> VerifyResetCode([FromBody] VerifyResetCodeRequest model)
        {
            var email = model.Email?.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
                return NotFound("User not found.");

            if (string.IsNullOrEmpty(user.OtpCode))
                return BadRequest("No reset code was requested for this account.");

            var cleanDbCode = user.OtpCode?.Replace(" ", "").Trim();
            var cleanInputCode = model.Code?.Replace(" ", "").Trim();
            if (cleanDbCode != cleanInputCode)
                return BadRequest("Invalid reset code. Please try again.");

            return Ok(new { message = "Code verified successfully. You can now set a new password." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest model)
        {
            var email = model.Email?.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
                return NotFound("User not found.");

            var cleanDbCode = user.OtpCode?.Replace(" ", "").Trim();
            var cleanInputCode = model.Code?.Replace(" ", "").Trim();
            if (string.IsNullOrEmpty(cleanDbCode) || cleanDbCode != cleanInputCode)
                return BadRequest("Invalid or expired reset code.");

            if (string.IsNullOrEmpty(model.NewPassword) || model.NewPassword.Length < 6)
                return BadRequest("Password must be at least 6 characters long.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
            user.OtpCode = null;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password has been reset successfully! You can now sign in with your new password." });
        }

        // ══════════════════════════════════════════════════════════════════════════
        // NEW / UPDATED ENDPOINTS — Refresh Token Architecture
        // ══════════════════════════════════════════════════════════════════════════

        /// <summary>
        /// POST /api/auth/login
        /// Returns a short-lived access token in JSON and a rotating refresh token
        /// in a secure HttpOnly cookie.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash))
                return Unauthorized("Invalid email or password.");

            if (!user.IsVerified)
                return BadRequest("Please verify your account before logging in.");

            // Generate access token (15 min)
            var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user);

            // Generate refresh token and store its hash in DB
            var (plainRefreshToken, tokenHash) = _tokenService.GenerateRefreshToken();
            var expiryDays = int.Parse(_config["Jwt:RefreshTokenExpiryDays"] ?? "7");

            _context.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.UserId,
                TokenHash = tokenHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(expiryDays),
                CreatedByIp = GetClientIp()
            });
            await _context.SaveChangesAsync();

            // Set refresh token as HttpOnly secure cookie
            SetRefreshTokenCookie(plainRefreshToken, expiryDays);

            return Ok(new LoginResponse
            {
                AccessToken = accessToken,
                ExpiresAt = expiresAt,
                UserId = user.UserId,
                FullName = user.FullName,
                Role = user.Role
            });
        }

        /// <summary>
        /// POST /api/auth/refresh
        /// Reads the refresh token from the HttpOnly cookie, validates it,
        /// rotates it, and returns a new access token.
        /// </summary>
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            var plainToken = Request.Cookies[RefreshTokenCookieName];
            if (string.IsNullOrEmpty(plainToken))
                return Unauthorized("No refresh token provided.");

            try
            {
                var (user, newPlainToken) = await _tokenService.ValidateAndRotateRefreshTokenAsync(
                    plainToken, GetClientIp());

                var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user);
                var expiryDays = int.Parse(_config["Jwt:RefreshTokenExpiryDays"] ?? "7");

                SetRefreshTokenCookie(newPlainToken, expiryDays);

                return Ok(new RefreshResponse
                {
                    AccessToken = accessToken,
                    ExpiresAt = expiresAt
                });
            }
            catch (SecurityTokenException ex)
            {
                // Clear the cookie on any token error (invalid / reuse attack)
                ClearRefreshTokenCookie();
                return Unauthorized(ex.Message);
            }
        }

        /// <summary>
        /// POST /api/auth/logout
        /// Revokes the current device's refresh token and clears the cookie.
        /// </summary>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var plainToken = Request.Cookies[RefreshTokenCookieName];
            if (!string.IsNullOrEmpty(plainToken))
            {
                await _tokenService.RevokeRefreshTokenAsync(plainToken, GetClientIp());
            }

            ClearRefreshTokenCookie();
            return Ok(new { message = "Logged out successfully." });
        }

        /// <summary>
        /// POST /api/auth/revoke-all
        /// Revokes ALL active sessions for the authenticated user (logout from all devices).
        /// Requires a valid access token.
        /// </summary>
        [Authorize]
        [HttpPost("revoke-all")]
        public async Task<IActionResult> RevokeAll()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            await _tokenService.RevokeAllUserTokensAsync(userId, GetClientIp());
            await _context.SaveChangesAsync();

            ClearRefreshTokenCookie();
            return Ok(new { message = "All sessions have been revoked." });
        }

        // ── Private Helpers ────────────────────────────────────────────────────────

        private void SetRefreshTokenCookie(string plainToken, int expiryDays)
        {
            Response.Cookies.Append(RefreshTokenCookieName, plainToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(expiryDays),
                Path = "/api/auth" // Scope cookie only to auth endpoints
            });
        }

        private void ClearRefreshTokenCookie()
        {
            Response.Cookies.Append(RefreshTokenCookieName, "", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(-1),
                Path = "/api/auth"
            });
        }

        private string GetClientIp()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // DTOs & Enums — Kept here for backward compatibility with existing code
    // ══════════════════════════════════════════════════════════════════════════════

    public enum AcademicLevel
    {
        FirstYear = 1,
        SecondYear = 2,
        ThirdYear = 3,
        FourthYear = 4
    }

    public class RegisterDto
    {
        [Required(ErrorMessage = "Full Name is required.")]
        public string FullName { get; set; } = null!;

        [Required, EmailAddress]
        public string Email { get; set; } = null!;

        [Required, StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "Role (Student or Instructor) selection is required.")]
        public string Role { get; set; } = "Student";

        public AcademicLevel? Level { get; set; }
    }

    public class VerifyRequest
    {
        [Required] public string Email { get; set; } = null!;
        [Required] public string Code { get; set; } = null!;
    }

    public class LoginRequest
    {
        [Required] public string Email { get; set; } = null!;
        [Required] public string Password { get; set; } = null!;
    }

    public class ForgotPasswordRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = null!;
    }

    public class VerifyResetCodeRequest
    {
        [Required] public string Email { get; set; } = null!;
        [Required] public string Code { get; set; } = null!;
    }

    public class ResetPasswordRequest
    {
        [Required] public string Email { get; set; } = null!;
        [Required] public string Code { get; set; } = null!;
        [Required, StringLength(100, MinimumLength = 6)]
        public string NewPassword { get; set; } = null!;
    }
}
