using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizSmart.API.Models
{
    [Table("Student_Attempts")]
    public partial class StudentAttempt
    {
        [Key]
        [Column("attempt_id")]
        public int AttemptId { get; set; }

        [Column("student_id")]
        public int StudentId { get; set; }

        [Column("exam_id")]
        public int ExamId { get; set; }

        [Column("final_score")]
        public double FinalScore { get; set; }

        [Column("start_time")]
        public DateTime StartTime { get; set; }

        [Column("submit_date")]
        public DateTime? SubmitDate { get; set; }

        [Column("is_completed")]
        public bool IsCompleted { get; set; } = false;

        [Column("status")]
        public string Status { get; set; } = "Started";

        [Column("is_passed")]
        public bool IsPassed { get; set; }

        public virtual Exam? Exam { get; set; }
        public virtual User? Student { get; set; }
        public virtual ICollection<StudentAnswer> StudentAnswers { get; set; } = new List<StudentAnswer>();
    }
}
