namespace QuizSmart.API.DTOs
{
    public class QuestionForStudentDto
    {
        public int QId { get; set; }
        public string? QText { get; set; }
        public string? QType { get; set; }
        public string? ImagePath { get; set; }

        public int Marks { get; set; }

        public string? OptionA { get; set; }
        public string? OptionB { get; set; }
        public string? OptionC { get; set; }
        public string? OptionD { get; set; }

        public int AnsId { get; set; }
        public string? ChosenOption { get; set; }
        public bool IsFlagged { get; set; }
        public System.DateTime? QuestionStartTime { get; set; }
    }
}
