using QuizSmart.API.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizSmart.API.Models
{
    public partial class QuestionBank
    {
        [Key]
        public int QId { get; set; }

        [Required]
        public int CourseId { get; set; }

        [Required]
        public string? QText { get; set; }

        [Required]
        public string? QType { get; set; }

        public string? Difficulty { get; set; }

        public string? CorrectAns { get; set; }

        public int Marks { get; set; } = 1;

        public string? OptionA { get; set; }
        public string? OptionB { get; set; }
        public string? OptionC { get; set; }
        public string? OptionD { get; set; }

        public string? ImagePath { get; set; }

        [ForeignKey("CourseId")]
        public virtual Course? Course { get; set; }

        public virtual ICollection<ExamQuestion> ExamQuestions { get; set; } = new List<ExamQuestion>();
        public virtual ICollection<StudentAnswer> StudentAnswers { get; set; } = new List<StudentAnswer>();
    }
}
