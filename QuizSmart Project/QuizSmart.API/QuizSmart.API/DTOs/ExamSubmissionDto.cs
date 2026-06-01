using System;
using System.Collections.Generic;

namespace QuizSmart.API.DTOs
{
    public class ExamSubmissionDto
    {
        public int ExamId { get; set; }
        public DateTime StartTime { get; set; }
        public List<StudentAnswerDto> Answers { get; set; } = new List<StudentAnswerDto>();
    }

    public class StudentAnswerDto
    {
        public int QuestionId { get; set; }

        public string? SelectedAnswer { get; set; }
    }
}
