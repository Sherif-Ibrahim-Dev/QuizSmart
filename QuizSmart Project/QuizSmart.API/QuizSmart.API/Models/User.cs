using QuizSmart.API.Controllers;
using QuizSmart.API.Models;
using System.ComponentModel.DataAnnotations;

public partial class User
{
    [Key]
    public int UserId { get; set; }

    [Required(ErrorMessage = "الاسم الكامل مطلوب")]
    public string FullName { get; set; } = null!;

    [Required(ErrorMessage = "الإيميل الجامعي مطلوب")]
    public string Email { get; set; } = null!;

    [Required]
    public string PasswordHash { get; set; } = null!;

    public string Role { get; set; } = "Student";


    public AcademicLevel? Level { get; set; }

    public int? UniversityId { get; set; }

    public bool IsVerified { get; set; } = false;

    public string? OtpCode { get; set; }

    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();
    public virtual ICollection<StudentAttempt> StudentAttempts { get; set; } = new List<StudentAttempt>();
    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
