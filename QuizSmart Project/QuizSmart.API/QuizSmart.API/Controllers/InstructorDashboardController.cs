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

            var exam = await _context.Exams.AsNoTracking().FirstOrDefaultAsync(e => e.ExamId == examId);
            double totalMarks = exam?.TotalMarks ?? 100;

            var stats = new
            {
                TotalParticipants = attempts.Count,
                AverageScore = Math.Round(attempts.Average(a => a.FinalScore), 2),
                SuccessCount = attempts.Count(a => a.FinalScore >= (totalMarks / 2)),
                FailureCount = attempts.Count(a => a.FinalScore < (totalMarks / 2)),
                SuccessRate = Math.Round((double)attempts.Count(a => a.FinalScore >= (totalMarks / 2)) / attempts.Count * 100, 2)
            };

            return Ok(stats);
        }


        [HttpGet("leaderboard/{examId}")]
        public async Task<IActionResult> GetTopStudents(int examId)
        {
            var topStudents = await _context.StudentAttempts
                .AsNoTracking()
                .Where(a => a.ExamId == examId && a.SubmitDate != null)
                .Include(a => a.Student)
                .OrderByDescending(a => a.FinalScore)
                .Take(10)
                .Select(a => new
                {
                    StudentName = a.Student.FullName,
                    Score = a.FinalScore,
                    TimeTaken = Math.Round((a.SubmitDate.Value - a.StartTime).TotalMinutes, 2)
                })
                .ToListAsync();

            return Ok(topStudents);
        }


        [HttpGet("questions-analysis/{examId}")]
        public async Task<IActionResult> GetQuestionsAnalysis(int examId)
        {
            var analysis = await _context.StudentAnswers
                .AsNoTracking()
                .Include(a => a.Attempt)
                .Include(a => a.QIdNavigation)
                .Where(a => a.Attempt.ExamId == examId && a.QIdNavigation.QType == "MCQ")
                .GroupBy(a => a.QIdNavigation.QText)
                .Select(g => new
                {
                    QuestionText = g.Key,
                    CorrectCount = g.Count(x => x.IsCorrect == true),
                    WrongCount = g.Count(x => x.IsCorrect == false),
                    DifficultyLevel = g.Count(x => x.IsCorrect == false) > g.Count(x => x.IsCorrect == true) ? "صعب" : "سهل"
                })
                .ToListAsync();

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
