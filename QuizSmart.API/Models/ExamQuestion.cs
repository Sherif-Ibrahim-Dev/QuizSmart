using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace QuizSmart.API.Models
{
    [Table("Exam_Questions")]
    public partial class ExamQuestion
    {
        [Column("exam_id")]
        public int ExamId { get; set; }

        [Column("q_id")]
        public int QId { get; set; }


        [ValidateNever]
        public virtual Exam? Exam { get; set; }

        [ValidateNever]
        public virtual QuestionBank? Question { get; set; }
    }
}
