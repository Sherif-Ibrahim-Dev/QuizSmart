namespace QuizSmart.API.DTOs
{
    /// <summary>Returned by POST /auth/login</summary>
    public class LoginResponse
    {
        public string AccessToken { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = null!;
        public string Role { get; set; } = null!;
    }

    /// <summary>Returned by POST /auth/refresh</summary>
    public class RefreshResponse
    {
        public string AccessToken { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
    }
}
