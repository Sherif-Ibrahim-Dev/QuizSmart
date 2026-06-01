using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizSmart.API.Models;

namespace QuizSmart.API.Controllers
{
    [Authorize(Roles = "Student")]
    [Route("api/[controller]")]
    [ApiController]
    public class StudentDashboardController : ControllerBase
    {
        private readonly QuizSmartDbContext _context;

        public StudentDashboardController(QuizSmartDbContext context)
        {
            _context = context;
        }


        [HttpGet("available-exams/{studentId}")]
        public async Task<IActionResult> GetAvailableExams(int studentId)
        {
            var now = DateTime.Now;

            var enrolledCourseIds = await _context.Enrollments
                .Where(en => en.StudentId == studentId)
                .Select(en => en.CourseId)
                .ToListAsync();

            var exams = await _context.Exams
                .AsNoTracking()
                .Where(e => e.StartTime <= now && e.EndTime >= now && enrolledCourseIds.Contains(e.CourseId) && e.IsPublished)
                .Select(e => new
                {
                    e.ExamId,
                    e.Title,
                    e.CourseId,
                    e.DurationInMinutes,
                    e.EndTime,
                    HasStarted = _context.StudentAttempts.Any(a => a.ExamId == e.ExamId && a.StudentId == studentId && a.SubmitDate == null),
                    AttemptId = _context.StudentAttempts
                                .Where(a => a.ExamId == e.ExamId && a.StudentId == studentId && a.SubmitDate == null)
                                .Select(a => a.AttemptId)
                                .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(exams);
        }


        [HttpGet("my-history/{studentId}")]
        public async Task<IActionResult> GetStudentHistory(int studentId)
        {
            var history = await _context.StudentAttempts
                .AsNoTracking()
                .Where(a => a.StudentId == studentId && a.SubmitDate != null)
                .Include(a => a.Exam)
                .OrderByDescending(a => a.SubmitDate)
                .Select(a => new
                {
                    a.AttemptId,
                    ExamTitle = a.Exam.Title,
                    CourseCode = a.Exam.CourseId,
                    Date = a.SubmitDate,
                    Score = a.FinalScore,
                    Total = a.Exam.TotalMarks,
                    CanReview = DateTime.Now > a.Exam.EndTime
                })
                .ToListAsync();

            return Ok(history);
        }


        [HttpGet("my-stats/{studentId}")]
        public async Task<IActionResult> GetStudentStats(int studentId)
        {
            var attempts = await _context.StudentAttempts
                .AsNoTracking()
                .Where(a => a.StudentId == studentId && a.SubmitDate != null)
                .ToListAsync();

            if (!attempts.Any()) return Ok(new { message = "لا توجد بيانات." });

            var stats = new
            {
                TotalExamsTaken = attempts.Count,
                AverageScore = Math.Round(attempts.Average(a => a.FinalScore), 2),
                HighestScore = attempts.Max(a => a.FinalScore)
            };

            return Ok(stats);
        }
    }
}
