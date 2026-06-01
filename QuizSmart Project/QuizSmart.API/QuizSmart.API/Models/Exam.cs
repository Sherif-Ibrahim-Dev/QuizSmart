using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizSmart.API.Models
{
    public partial class Exam
    {
        [Key]
        public int ExamId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        [Required]
        public int CourseId { get; set; }

        public int DurationInMinutes { get; set; }

        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }

        public int TotalMarks { get; set; }
        public int PassingMark { get; set; }

        public bool IsRandom { get; set; }
        public int RandomQuestionsCount { get; set; }
        public bool ShuffleQuestions { get; set; }
        public bool ShuffleOptions { get; set; }
        public bool AllowReentry { get; set; } = false;

        public bool IsPublished { get; set; } = false;

        [NotMapped]
        public List<int>? QuestionIds { get; set; }

        [ForeignKey("CourseId")]
        public virtual Course? Course { get; set; }

        public virtual ICollection<ExamQuestion> ExamQuestions { get; set; } = new List<ExamQuestion>();
        public virtual ICollection<StudentAttempt> StudentAttempts { get; set; } = new List<StudentAttempt>();
    }
}
