using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace QuizSmart.API.Models;

public partial class Course
{
    [Key]
    public int CourseId { get; set; }

    public string CourseCode { get; set; } = null!;

    public string CourseName { get; set; } = null!;


    public string? Description { get; set; }

    public int CreditHours { get; set; }

    public int AcademicYear { get; set; }

    public int Semester { get; set; }


    public int? InstructorId { get; set; }

    public virtual ICollection<Exam> Exams { get; set; } = new List<Exam>();

    public virtual User? Instructor { get; set; }

    public virtual ICollection<QuestionBank> QuestionBanks { get; set; } = new List<QuestionBank>();

    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}
