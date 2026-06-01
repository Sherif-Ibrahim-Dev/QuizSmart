using QuizSmart.API.Models;

public partial class StudentAnswer
{
    public int AnsId { get; set; }
    public int? AttemptId { get; set; }
    public int? QId { get; set; }
    public string? ChosenOption { get; set; }
    public bool? IsCorrect { get; set; }
    public bool IsFlagged { get; set; } = false;


    public decimal? WrittenMark { get; set; }
    public string? SolutionImagePath { get; set; }
    public DateTime? QuestionStartTime { get; set; }

    public virtual StudentAttempt? Attempt { get; set; }
    public virtual QuestionBank? QIdNavigation { get; set; }
}
