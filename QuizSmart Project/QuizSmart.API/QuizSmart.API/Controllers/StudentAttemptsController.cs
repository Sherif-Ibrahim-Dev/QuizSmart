using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizSmart.API.Models;
using System.Security.Claims;

namespace QuizSmart.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StudentAttemptsController : ControllerBase
    {
        private readonly QuizSmartDbContext _context;
        private readonly Microsoft.AspNetCore.Hosting.IWebHostEnvironment _env;

        public StudentAttemptsController(QuizSmartDbContext context, Microsoft.AspNetCore.Hosting.IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpPost("start")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Student")]
        public async Task<IActionResult> StartAttempt([FromBody] StudentAttempt request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized(new { message = "Login required." });

            int userId = int.Parse(userIdString);

            var alreadyAttempted = await _context.StudentAttempts
                .AnyAsync(a => a.ExamId == request.ExamId && a.StudentId == userId);

            if (alreadyAttempted)
                return BadRequest(new { message = "Sorry, you have already entered this exam." });

            request.StudentId = userId;
            request.StartTime = System.DateTime.Now;
            request.FinalScore = 0;
            request.Status = "Started";

            _context.StudentAttempts.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Good luck!", attemptId = request.AttemptId });
        }

        [HttpPost("submit-answer")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Student")]
        public async Task<IActionResult> SubmitAnswer([FromBody] StudentAnswer answer)
        {
            var question = await _context.QuestionBanks.FindAsync(answer.QId);
            var attempt = await _context.StudentAttempts.FindAsync(answer.AttemptId);

            if (question == null || attempt == null) return NotFound(new { message = "Data not found." });

            var existingAnswer = await _context.StudentAnswers
                .FirstOrDefaultAsync(a => a.AttemptId == answer.AttemptId && a.QId == answer.QId);

            bool? isCorrectNow = null;
            if (question.QType == "MCQ" || question.QType == "TrueFalse")
            {
                isCorrectNow = (question.CorrectAns?.Trim().ToLower() == answer.ChosenOption?.Trim().ToLower());
            }

            if (existingAnswer != null)
            {
                if (question.QType == "MCQ" || question.QType == "TrueFalse")
                {
                    if (existingAnswer.IsCorrect == true && isCorrectNow != true)
                    {
                        attempt.FinalScore -= question.Marks;
                    }
                    else if (existingAnswer.IsCorrect != true && isCorrectNow == true)
                    {
                        attempt.FinalScore += question.Marks;
                    }
                }

                existingAnswer.ChosenOption = answer.ChosenOption;
                existingAnswer.IsCorrect = isCorrectNow;
            }
            else
            {
                answer.IsCorrect = isCorrectNow;
                if (isCorrectNow == true)
                {
                    attempt.FinalScore += question.Marks;
                }
                _context.StudentAnswers.Add(answer);
            }

            await _context.SaveChangesAsync();

            return Ok(new { status = (question.QType == "MCQ" || question.QType == "TrueFalse") ? "Done" : "Pending", currentScore = attempt.FinalScore });
        }

        [HttpPost("submit-written/{answerId}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Student")]
        public async Task<IActionResult> SubmitWritten(int answerId, [FromForm] string? textAnswer, Microsoft.AspNetCore.Http.IFormFile? imageFile)
        {
            var answer = await _context.StudentAnswers
                .Include(a => a.Attempt)
                .FirstOrDefaultAsync(a => a.AnsId == answerId);

            if (answer == null) return NotFound(new { message = "Answer record not found." });

            bool isCheatSuspected = false;

            if (string.IsNullOrWhiteSpace(textAnswer) && (imageFile == null || imageFile.Length == 0))
            {
                answer.IsCorrect = false;
                answer.ChosenOption = "No answer submitted";
            }
            else
            {
                if (imageFile != null && imageFile.Length > 0)
                {
                    if (answer.QuestionStartTime.HasValue && (System.DateTime.Now - answer.QuestionStartTime.Value).TotalMinutes < 1.0)
                    {
                        answer.IsCorrect = false;
                        answer.ChosenOption = "Rejected: Zero score (Suspected cheating - Image uploaded in less than a minute)";
                        isCheatSuspected = true;
                    }
                    else
                    {
                        var uploadsFolder = System.IO.Path.Combine(_env.WebRootPath, "uploads", "solutions");
                        if (!System.IO.Directory.Exists(uploadsFolder)) System.IO.Directory.CreateDirectory(uploadsFolder);

                        var fileName = System.Guid.NewGuid().ToString() + System.IO.Path.GetExtension(imageFile.FileName);
                        var filePath = System.IO.Path.Combine(uploadsFolder, fileName);

                        using (var stream = new System.IO.FileStream(filePath, System.IO.FileMode.Create))
                        {
                            await imageFile.CopyToAsync(stream);
                        }
                        answer.SolutionImagePath = "/uploads/solutions/" + fileName;
                    }
                }

                if (!string.IsNullOrWhiteSpace(textAnswer) && !isCheatSuspected)
                {
                    answer.ChosenOption = textAnswer;
                }
            }

            await _context.SaveChangesAsync();

            if (answer.IsCorrect == false)
                return Ok(new { message = "Answer automatically evaluated as zero (either empty or suspected cheating)." });

            return Ok(new { message = "Answer saved successfully and is awaiting instructor evaluation." });
        }

        [HttpPost("toggle-flag")]
        public async Task<IActionResult> ToggleFlag(int answerId, bool flagStatus)
        {
            var answer = await _context.StudentAnswers.FindAsync(answerId);
            if (answer == null) return NotFound(new { message = "Answer record not found." });

            answer.IsFlagged = flagStatus;
            await _context.SaveChangesAsync();

            return Ok(new { isFlagged = answer.IsFlagged });
        }

        [HttpPost("start-question/{answerId}")]
        public async Task<IActionResult> RecordStartTime(int answerId)
        {
            var answer = await _context.StudentAnswers.FindAsync(answerId);
            if (answer == null) return NotFound(new { message = "Record not found." });

            if (answer.QuestionStartTime == null)
            {
                answer.QuestionStartTime = System.DateTime.Now;
                await _context.SaveChangesAsync();
            }
            return Ok(new { startTime = answer.QuestionStartTime });
        }

        [HttpPost("finish/{attemptId}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Student")]
        public async Task<IActionResult> FinishAttempt(int attemptId)
        {
            var attempt = await _context.StudentAttempts.FindAsync(attemptId);
            if (attempt == null) return NotFound(new { message = "Attempt not found." });

            attempt.SubmitDate = System.DateTime.Now;
            attempt.Status = "Submitted";
            attempt.IsCompleted = true;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Submission successful.", score = attempt.FinalScore });
        }

        [HttpGet("review/{attemptId}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Student")]
        public async Task<IActionResult> GetAttemptReview(int attemptId)
        {
            var attempt = await _context.StudentAttempts
                .Include(a => a.StudentAnswers).ThenInclude(sa => sa.QIdNavigation)
                .FirstOrDefaultAsync(a => a.AttemptId == attemptId);

            if (attempt == null) return NotFound(new { message = "Attempt not found." });

            return Ok(new
            {
                FinalScore = attempt.FinalScore,
                Answers = attempt.StudentAnswers.Select(sa => new {
                    QuestionText = sa.QIdNavigation?.QText,
                    StudentAnswer = sa.ChosenOption,
                    sa.IsCorrect,
                    sa.WrittenMark,
                    MaxMarks = sa.QIdNavigation != null ? sa.QIdNavigation.Marks : 0,
                    QType = sa.QIdNavigation != null ? sa.QIdNavigation.QType : ""
                })
            });
        }

        [HttpGet("pending-written/{examId}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Instructor")]
        public async Task<IActionResult> GetPendingWrittenAnswers(int examId)
        {
            var pending = await _context.StudentAnswers
                .Include(a => a.Attempt).ThenInclude(at => at.Student)
                .Include(a => a.QIdNavigation)
                .Where(a => a.Attempt.ExamId == examId && a.QIdNavigation.QType == "Written" && a.IsCorrect == null)
                .Select(a => new {
                    a.AnsId,
                    StudentName = a.Attempt.Student.FullName,
                    a.ChosenOption,
                    a.SolutionImagePath,
                    QuestionText = a.QIdNavigation.QText,
                    MaxMarks = a.QIdNavigation.Marks
                }).ToListAsync();

            return Ok(pending);
        }

        [HttpPost("grade-written")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Instructor")]
        public async Task<IActionResult> GradeWrittenAnswer(int answerId, int teacherMarks)
        {
            var answer = await _context.StudentAnswers
                .Include(a => a.Attempt)
                .Include(a => a.QIdNavigation)
                .FirstOrDefaultAsync(a => a.AnsId == answerId);

            if (answer == null) return NotFound(new { message = "Answer record not found." });

            answer.IsCorrect = teacherMarks > 0;
            answer.WrittenMark = teacherMarks;
            if (answer.Attempt != null) answer.Attempt.FinalScore += teacherMarks;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Grade recorded successfully!" });
        }

        [HttpGet("results/{examId}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Instructor")]
        public async Task<IActionResult> GetExamResults(int examId)
        {
            var results = await _context.StudentAttempts
                .Where(a => a.ExamId == examId && a.SubmitDate != null)
                .Select(a => new {
                    StudentName = a.Student != null ? a.Student.FullName : "Unknown",
                    Score = a.FinalScore,
                    Date = a.SubmitDate
                }).ToListAsync();

            return Ok(results);
        }
    }
}
