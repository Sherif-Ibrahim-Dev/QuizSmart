using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizSmart.API.Models;

namespace QuizSmart.API.Controllers
{
    [Authorize(Roles = "Instructor")]
    [Route("api/[controller]")]
    [ApiController]
    public class InstructorDashboardController : ControllerBase
    {
        private readonly QuizSmartDbContext _context;

        public InstructorDashboardController(QuizSmartDbContext context)
        {
            _context = context;
        }


        [HttpGet("exam-stats/{examId}")]
        public async Task<IActionResult> GetExamGeneralStats(int examId)
        {
            var attempts = await _context.StudentAttempts
                .AsNoTracking()
                .Where(a => a.ExamId == examId && a.SubmitDate != null)
                .ToListAsync();

            if (!attempts.Any()) return NotFound("لا توجد محاولات مكتملة لهذا الامتحان بعد.");

            // Filter to only the best attempt per student
            var bestAttempts = attempts
                .GroupBy(a => a.StudentId)
                .Select(g => g.OrderByDescending(a => a.FinalScore).First())
                .ToList();

            var exam = await _context.Exams.AsNoTracking().FirstOrDefaultAsync(e => e.ExamId == examId);
            double totalMarks = exam?.TotalMarks ?? 100;

            var stats = new
            {
                TotalParticipants = bestAttempts.Count,
                AverageScore = Math.Round(bestAttempts.Average(a => a.FinalScore), 2),
                SuccessCount = bestAttempts.Count(a => a.FinalScore >= (totalMarks / 2)),
                FailureCount = bestAttempts.Count(a => a.FinalScore < (totalMarks / 2)),
                SuccessRate = Math.Round((double)bestAttempts.Count(a => a.FinalScore >= (totalMarks / 2)) / bestAttempts.Count * 100, 2)
            };

            return Ok(stats);
        }


        [HttpGet("leaderboard/{examId}")]
        public async Task<IActionResult> GetTopStudents(int examId)
        {
            // Fetch submitted attempts that have NO ungraded written answers into memory
            var attempts = await _context.StudentAttempts
                .AsNoTracking()
                .Where(a => a.ExamId == examId && a.SubmitDate != null)
                // Exclude students who still have ungraded written questions
                .Where(a => !_context.StudentAnswers
                    .Any(sa => sa.AttemptId == a.AttemptId
                            && sa.QIdNavigation.QType == "Written"
                            && sa.WrittenMark == null))
                .Include(a => a.Student)
                .ToListAsync();

            // Group by student and calculate time in C# memory (EF Core can't translate DateTime math in SQL)
            var topStudents = attempts
                .GroupBy(a => new { a.StudentId, StudentName = a.Student?.FullName ?? "Unknown" })
                .Select(g =>
                {
                    var bestAttempt = g.OrderByDescending(a => a.FinalScore).First();
                    return new
                    {
                        StudentName = g.Key.StudentName,
                        Score = bestAttempt.FinalScore,
                        TimeTaken = bestAttempt.SubmitDate.HasValue
                            ? Math.Round((bestAttempt.SubmitDate.Value - bestAttempt.StartTime).TotalMinutes, 2)
                            : 0
                    };
                })
                .OrderByDescending(s => s.Score)
                .ThenBy(s => s.TimeTaken)
                .Take(10)
                .ToList();

            return Ok(topStudents);
        }


        [HttpGet("questions-analysis/{examId}")]
        public async Task<IActionResult> GetQuestionsAnalysis(int examId)
        {
            var examQuestions = await _context.ExamQuestions
                .AsNoTracking()
                .Include(eq => eq.Question)
                .Where(eq => eq.ExamId == examId)
                .OrderBy(eq => eq.QId)
                .ToListAsync();

            var attempts = await _context.StudentAttempts
                .AsNoTracking()
                .Where(a => a.ExamId == examId && a.SubmitDate != null)
                .ToListAsync();

            // Filter to only the best attempt's AttemptId per student
            var bestAttemptIds = attempts
                .GroupBy(a => a.StudentId)
                .Select(g => g.OrderByDescending(a => a.FinalScore).First().AttemptId)
                .ToList();

            var answers = await _context.StudentAnswers
                .AsNoTracking()
                .Where(a => bestAttemptIds.Contains(a.AttemptId ?? 0))
                .ToListAsync();

            var analysis = examQuestions.Select(eq =>
            {
                var qAnswers = answers.Where(a => a.QId == eq.QId).ToList();
                int correctCount = qAnswers.Count(x => x.IsCorrect == true);
                int wrongCount = qAnswers.Count(x => x.IsCorrect != true);

                return new
                {
                    QuestionText = eq.Question?.QText ?? "Unknown Question",
                    CorrectCount = correctCount,
                    WrongCount = wrongCount,
                    DifficultyLevel = wrongCount > correctCount ? "صعب" : "سهل"
                };
            }).ToList();

            return Ok(analysis);
        }

        [HttpPost("grade-written-question")]
        public async Task<IActionResult> GradeWrittenQuestion(int answerId, decimal teacherScore)
        {

            var answer = await _context.StudentAnswers
                .Include(a => a.QIdNavigation)
                .Include(a => a.Attempt)
                .FirstOrDefaultAsync(a => a.AnsId == answerId);

            if (answer == null) return NotFound("Answer not found.");



            if (string.IsNullOrEmpty(answer.ChosenOption) && string.IsNullOrEmpty(answer.SolutionImagePath))
            {
                answer.WrittenMark = 0;
                answer.IsCorrect = false;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Question automatically graded as 0 because the answer is empty." });
            }


            if (!string.IsNullOrEmpty(answer.SolutionImagePath) && answer.QuestionStartTime.HasValue)
            {
                var timeSpent = (DateTime.Now - answer.QuestionStartTime.Value).TotalSeconds;
                if (timeSpent < 60)
                {
                    answer.WrittenMark = 0;
                    answer.IsCorrect = false;
                    await _context.SaveChangesAsync();
                    return BadRequest(new { message = "Question graded as 0 (suspected cheating): Image uploaded in less than 60 seconds." });
                }
            }




            if (teacherScore > answer.QIdNavigation.Marks)
            {
                return BadRequest($"The maximum mark for this question is {answer.QIdNavigation.Marks}");
            }

            answer.WrittenMark = teacherScore;
            answer.IsCorrect = teacherScore > 0;

            await _context.SaveChangesAsync();


            var totalScore = await _context.StudentAnswers
                .Where(s => s.AttemptId == answer.AttemptId)
                .SumAsync(s => (s.WrittenMark ?? 0) + (s.IsCorrect == true && (s.QIdNavigation.QType == "MCQ" || s.QIdNavigation.QType == "TrueFalse") ? s.QIdNavigation.Marks : 0));

            answer.Attempt.FinalScore = (double)totalScore;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Grade recorded and student's final score updated successfully." });
        }
    }
}
