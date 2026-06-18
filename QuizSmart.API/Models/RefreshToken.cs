using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizSmart.API.Models
{
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        /// <summary>
        /// SHA-256 hash of the plain refresh token. The plain token is never stored.
        /// </summary>
        [Required]
        [MaxLength(64)]
        public string TokenHash { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; }

        /// <summary>Null = still active. Set when the token is consumed (rotated) or explicitly revoked.</summary>
        public DateTime? RevokedAt { get; set; }

        /// <summary>Hash of the new token that replaced this one during rotation.</summary>
        [MaxLength(64)]
        public string? ReplacedByToken { get; set; }

        [MaxLength(45)]
        public string? CreatedByIp { get; set; }

        [MaxLength(45)]
        public string? RevokedByIp { get; set; }

        // ── Computed helpers ─────────────────────────────────────────────────────
        [NotMapped]
        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;

        [NotMapped]
        public bool IsRevoked => RevokedAt.HasValue;

        [NotMapped]
        public bool IsActive => !IsRevoked && !IsExpired;

        // ── Navigation ────────────────────────────────────────────────────────────
        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
    }
}
