using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizSmart.API.Models;
using System.ComponentModel.DataAnnotations;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;

namespace QuizSmart.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly QuizSmartDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(QuizSmartDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

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
            if (user.OtpCode != model.Code) return BadRequest("Invalid verification code.");

            user.IsVerified = true;
            user.OtpCode = null;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Account verified successfully!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid email or password.");
            }

            if (!user.IsVerified) return BadRequest("Please verify your account before logging in.");

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
           new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
           new Claim(ClaimTypes.Role, user.Role),
           new Claim("FullName", user.FullName)
        }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);

            return Ok(new
            {
                Token = tokenHandler.WriteToken(token),
                UserId = user.UserId,
                FullName = user.FullName,
                Role = user.Role
            });
        }
    }


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
}
