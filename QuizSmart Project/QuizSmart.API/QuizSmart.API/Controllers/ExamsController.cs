using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizSmart.API.Models;
using QuizSmart.API.DTOs;
using System.Security.Claims;

namespace QuizSmart.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ExamsController : ControllerBase
    {
        private readonly QuizSmartDbContext _context;

        public ExamsController(QuizSmartDbContext context)
        {
            _context = context;
        }

        [HttpGet("my-exams")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> GetMyExams()
        {
            var instructorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(instructorIdClaim)) return Unauthorized();

            var exams = await _context.Exams
                .Include(e => e.Course)
                .Where(e => e.Course.InstructorId == int.Parse(instructorIdClaim))
                .Select(e => new {
                    e.ExamId,
                    e.Title,
                    CourseName = e.Course.CourseName,
                    e.StartTime,
                    e.EndTime,
                    e.DurationInMinutes,
                    e.IsPublished,
                    AttemptsCount = e.StudentAttempts.Count(),

                    HasPendingCorrections = _context.StudentAnswers
                        .Any(sa => sa.Attempt.ExamId == e.ExamId &&
                                   sa.QIdNavigation.QType == "Written" &&
                                   sa.WrittenMark == null)
                })
                .OrderByDescending(e => e.StartTime)
                .ToListAsync();

            return Ok(exams);
        }

        [HttpGet("{id}/export-results")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> GetExamResultsForExport(int id)
        {
            var results = await _context.StudentAttempts
                .Where(a => a.ExamId == id)
                .Include(a => a.Student)
                .Include(a => a.Exam)
                .Select(a => new
                {
                    StudentName = a.Student.FullName,
                    Email = a.Student.Email,
                    Score = a.FinalScore,
                    TotalMarks = a.Exam.TotalMarks,
                    Percentage = a.Exam.TotalMarks > 0 ? (Math.Round((double)a.FinalScore / a.Exam.TotalMarks * 100, 2)) : 0,
                    Status = a.IsPassed ? "Passed" : "Failed",
                    Date = a.SubmitDate.HasValue ? a.SubmitDate.Value.ToString("yyyy-MM-dd HH:mm") : "Not Submitted"
                })
                .OrderByDescending(a => a.Score)
                .ToListAsync();

            if (results == null || !results.Any())
            {
                return NotFound(new { message = "No student attempts found for this exam." });
            }

            return Ok(results);
        }
        [HttpPost("create")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> CreateExam([FromBody] Exam exam)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Exams.Add(exam);
                await _context.SaveChangesAsync();

                if (exam.IsRandom && exam.RandomQuestionsCount > 0)
                {
                    var randomQuestions = await _context.QuestionBanks
                        .Where(q => q.CourseId == exam.CourseId)
                        .OrderBy(q => Guid.NewGuid())
                        .Take(exam.RandomQuestionsCount)
                        .Select(q => new ExamQuestion { ExamId = exam.ExamId, QId = q.QId })
                        .ToListAsync();
                    _context.ExamQuestions.AddRange(randomQuestions);
                }
                else if (!exam.IsRandom && exam.QuestionIds != null && exam.QuestionIds.Any())
                {
                    var manualQuestions = exam.QuestionIds.Select(qId => new ExamQuestion { ExamId = exam.ExamId, QId = qId }).ToList();
                    _context.ExamQuestions.AddRange(manualQuestions);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Exam published successfully!", examId = exam.ExamId });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                var realError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Database Error: {realError}");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> UpdateExam(int id, [FromBody] Exam updated)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null) return NotFound(new { message = "Exam not found." });

            exam.Title = updated.Title;
            exam.DurationInMinutes = updated.DurationInMinutes;
            exam.StartTime = updated.StartTime;
            exam.EndTime = updated.EndTime;
            exam.TotalMarks = updated.TotalMarks;
            exam.PassingMark = updated.PassingMark;
            exam.IsRandom = updated.IsRandom;
            exam.RandomQuestionsCount = updated.RandomQuestionsCount;
            exam.ShuffleQuestions = updated.ShuffleQuestions;
            exam.ShuffleOptions = updated.ShuffleOptions;
            exam.AllowReentry = updated.AllowReentry;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Exam updated successfully!" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> DeleteExam(int id)
        {
            var exam = await _context.Exams
                .Include(e => e.ExamQuestions)
                .FirstOrDefaultAsync(e => e.ExamId == id);

            if (exam == null)
                return NotFound(new { message = "Exam not found." });

            try
            {
                if (exam.ExamQuestions.Any())
                    _context.ExamQuestions.RemoveRange(exam.ExamQuestions);

                _context.Exams.Remove(exam);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Exam has been deleted successfully. Questions remain in your bank." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error occurred during deletion.", error = ex.Message });
            }
        }

        [HttpGet("{examId}/questions-for-student")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetQuestionsForStudent(int examId)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized(new { message = "Login required." });
            int userId = int.Parse(userIdString);

            var attempt = await _context.StudentAttempts
                .FirstOrDefaultAsync(a => a.ExamId == examId && a.StudentId == userId && !a.IsCompleted);

            if (attempt == null)
            {
                return BadRequest(new { message = "You must start the exam attempt first." });
            }

            var examQuestions = await _context.ExamQuestions
                .Include(eq => eq.Question)
                .Where(eq => eq.ExamId == examId)
                .ToListAsync();

            if (!examQuestions.Any())
            {
                return NotFound(new { message = "No questions found for this exam." });
            }

            var studentAnswers = await _context.StudentAnswers
                .Where(sa => sa.AttemptId == attempt.AttemptId)
                .ToListAsync();

            var updatedAnswers = new List<StudentAnswer>();
            foreach (var eq in examQuestions)
            {
                var answer = studentAnswers.FirstOrDefault(sa => sa.QId == eq.QId);
                if (answer == null)
                {
                    answer = new StudentAnswer
                    {
                        AttemptId = attempt.AttemptId,
                        QId = eq.QId,
                        ChosenOption = null,
                        IsCorrect = null,
                        IsFlagged = false,
                        WrittenMark = null,
                        SolutionImagePath = null,
                        QuestionStartTime = null
                    };
                    _context.StudentAnswers.Add(answer);
                    updatedAnswers.Add(answer);
                }
            }

            if (updatedAnswers.Any())
            {
                await _context.SaveChangesAsync();
            }

            var allAnswers = await _context.StudentAnswers
                .Where(sa => sa.AttemptId == attempt.AttemptId)
                .ToListAsync();

            var exam = await _context.Exams.FindAsync(examId);
            bool shuffleQuestions = exam?.ShuffleQuestions ?? false;
            bool shuffleOptions = exam?.ShuffleOptions ?? false;

            var questionsList = examQuestions.Select(eq => {
                var answer = allAnswers.First(sa => sa.QId == eq.QId);
                var q = eq.Question;

                var options = new List<string?>();
                if (q != null)
                {
                    options.Add(q.OptionA);
                    options.Add(q.OptionB);
                    options.Add(q.OptionC);
                    options.Add(q.OptionD);
                }

                if (shuffleOptions && q != null && q.QType == "MCQ")
                {
                    var validOptions = options.Where(o => !string.IsNullOrEmpty(o)).ToList();
                    var rnd = new Random();
                    validOptions = validOptions.OrderBy(x => rnd.Next()).ToList();

                    while (validOptions.Count < 4) validOptions.Add(null);

                    return new QuestionForStudentDto
                    {
                        QId = eq.QId,
                        QText = q.QText,
                        QType = q.QType,
                        ImagePath = q.ImagePath,
                        Marks = q.Marks,
                        OptionA = validOptions[0],
                        OptionB = validOptions[1],
                        OptionC = validOptions[2],
                        OptionD = validOptions[3],
                        AnsId = answer.AnsId,
                        ChosenOption = answer.ChosenOption,
                        IsFlagged = answer.IsFlagged,
                        QuestionStartTime = answer.QuestionStartTime
                    };
                }

                return new QuestionForStudentDto
                {
                    QId = eq.QId,
                    QText = q?.QText,
                    QType = q?.QType,
                    ImagePath = q?.ImagePath,
                    Marks = q?.Marks ?? 0,
                    OptionA = q?.OptionA,
                    OptionB = q?.OptionB,
                    OptionC = q?.OptionC,
                    OptionD = q?.OptionD,
                    AnsId = answer.AnsId,
                    ChosenOption = answer.ChosenOption,
                    IsFlagged = answer.IsFlagged,
                    QuestionStartTime = answer.QuestionStartTime
                };
            }).ToList();

            if (shuffleQuestions)
            {
                var rnd = new Random();
                questionsList = questionsList.OrderBy(x => rnd.Next()).ToList();
            }

            return Ok(questionsList);
        }
    }
}
