using QuizSmart.API.Models;

namespace QuizSmart.API.Services
{
    public interface ITokenService
    {
        /// <summary>
        /// Generates a short-lived JWT access token (15 minutes) for the given user.
        /// </summary>
        (string Token, DateTime ExpiresAt) GenerateAccessToken(User user);

        /// <summary>
        /// Generates a cryptographically-secure random refresh token.
        /// Returns the plain token (sent to client) and its SHA-256 hash (stored in DB).
        /// </summary>
        (string PlainToken, string TokenHash) GenerateRefreshToken();

        /// <summary>
        /// Validates the provided refresh token hash, performs reuse-attack detection,
        /// rotates the token, and returns the associated user and the new plain refresh token.
        /// Throws SecurityTokenException on any invalid state.
        /// </summary>
        Task<(User User, string NewPlainToken)> ValidateAndRotateRefreshTokenAsync(
            string plainToken, string ipAddress);

        /// <summary>
        /// Revokes a single refresh token by its plain value.
        /// </summary>
        Task RevokeRefreshTokenAsync(string plainToken, string ipAddress);

        /// <summary>
        /// Revokes ALL active refresh tokens for a user (logout from all devices).
        /// </summary>
        Task RevokeAllUserTokensAsync(int userId, string ipAddress);
    }
}
