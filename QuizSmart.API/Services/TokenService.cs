using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuizSmart.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace QuizSmart.API.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;
        private readonly QuizSmartDbContext _context;

        public TokenService(IConfiguration config, QuizSmartDbContext context)
        {
            _config = config;
            _context = context;
        }

        // ── Access Token ──────────────────────────────────────────────────────────

        public (string Token, DateTime ExpiresAt) GenerateAccessToken(User user)
        {
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);
            var expiryMinutes = int.Parse(_config["Jwt:AccessTokenExpiryMinutes"] ?? "15");
            var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Role, user.Role),
                    new Claim("FullName", user.FullName)
                }),
                Expires = expiresAt,
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var handler = new JwtSecurityTokenHandler();
            var token = handler.CreateToken(tokenDescriptor);
            return (handler.WriteToken(token), expiresAt);
        }

        // ── Refresh Token Generation ───────────────────────────────────────────────

        public (string PlainToken, string TokenHash) GenerateRefreshToken()
        {
            // 64 cryptographically-random bytes → Base64 URL-safe string
            var randomBytes = RandomNumberGenerator.GetBytes(64);
            var plainToken = Convert.ToBase64String(randomBytes);
            var tokenHash = HashToken(plainToken);
            return (plainToken, tokenHash);
        }

        // ── Validate & Rotate ─────────────────────────────────────────────────────

        public async Task<(User User, string NewPlainToken)> ValidateAndRotateRefreshTokenAsync(
            string plainToken, string ipAddress)
        {
            var tokenHash = HashToken(plainToken);

            var storedToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

            if (storedToken == null)
                throw new SecurityTokenException("Invalid refresh token.");

            // ── Reuse-attack detection ────────────────────────────────────────────
            // A revoked token being presented again means the token was stolen.
            // Revoke the entire family (all active tokens for this user).
            if (storedToken.IsRevoked)
            {
                await RevokeAllUserTokensAsync(storedToken.UserId, ipAddress);
                await _context.SaveChangesAsync();
                throw new SecurityTokenException("Refresh token reuse detected. All sessions have been revoked.");
            }

            if (storedToken.IsExpired)
                throw new SecurityTokenException("Refresh token has expired.");

            // ── Rotate: revoke old, issue new ─────────────────────────────────────
            var (newPlainToken, newTokenHash) = GenerateRefreshToken();
            var expiryDays = int.Parse(_config["Jwt:RefreshTokenExpiryDays"] ?? "7");

            // Soft-revoke old token, record what replaced it
            storedToken.RevokedAt = DateTime.UtcNow;
            storedToken.RevokedByIp = ipAddress;
            storedToken.ReplacedByToken = newTokenHash;

            // Create the new token
            var newToken = new RefreshToken
            {
                UserId = storedToken.UserId,
                TokenHash = newTokenHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(expiryDays),
                CreatedByIp = ipAddress
            };

            _context.RefreshTokens.Add(newToken);
            await _context.SaveChangesAsync();

            return (storedToken.User, newPlainToken);
        }

        // ── Revoke Single Token ───────────────────────────────────────────────────

        public async Task RevokeRefreshTokenAsync(string plainToken, string ipAddress)
        {
            var tokenHash = HashToken(plainToken);

            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

            if (storedToken == null || !storedToken.IsActive)
                return; // Already revoked or not found — idempotent

            storedToken.RevokedAt = DateTime.UtcNow;
            storedToken.RevokedByIp = ipAddress;
            await _context.SaveChangesAsync();
        }

        // ── Revoke All User Tokens ────────────────────────────────────────────────

        public async Task RevokeAllUserTokensAsync(int userId, string ipAddress)
        {
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
                token.RevokedByIp = ipAddress;
            }

            // Note: SaveChangesAsync() is called by the caller (to allow batching)
        }

        // ── Private Helpers ───────────────────────────────────────────────────────

        /// <summary>Computes a SHA-256 hash of the plain token and returns it as hex string.</summary>
        private static string HashToken(string plainToken)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(plainToken));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }
    }
}
