using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizSmart.API.Models;
using ExcelDataReader;
using System.Data;

namespace QuizSmart.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class QuestionsController : ControllerBase
    {
        private readonly QuizSmartDbContext _context;
        private readonly IWebHostEnvironment _env;

        public QuestionsController(QuizSmartDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpPost("add")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> AddQuestion([FromForm] QuestionBank question, IFormFile? imageFile)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Validation failed", errors = errors });
            }

            try
            {
                if (imageFile != null && imageFile.Length > 0)
                {
                    var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "questions");
                    if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

                    var uniqueFileName = Guid.NewGuid().ToString() + "_" + imageFile.FileName;
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await imageFile.CopyToAsync(fileStream);
                    }

                    question.ImagePath = "/uploads/questions/" + uniqueFileName;
                }

                _context.QuestionBanks.Add(question);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Question added successfully!", questionId = question.QId });
            }
            catch (Exception ex)
            {
                var innerError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Error saving question: {innerError}");
            }
        }

        [HttpPost("upload-excel")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> UploadQuestions(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is null or empty." });

            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
            var questionsList = new List<QuestionBank>();

            try
            {
                using (var stream = file.OpenReadStream())
                {
                    using (var reader = file.FileName.EndsWith(".csv")
                           ? ExcelReaderFactory.CreateCsvReader(stream)
                           : ExcelReaderFactory.CreateReader(stream))
                    {
                        int currentRow = 0;
                        while (reader.Read())
                        {
                            currentRow++;
                            var cell0 = reader.GetValue(0)?.ToString()?.Trim();

                            if (string.IsNullOrEmpty(cell0) || cell0.StartsWith("sep=") || cell0.Equals("CourseId", StringComparison.OrdinalIgnoreCase))
                                continue;

                            if (!int.TryParse(cell0, out int cId))
                            {
                                return BadRequest(new { message = $"Row {currentRow}: CourseId must be a valid integer." });
                            }

                            var type = reader.GetValue(2)?.ToString()?.Trim() ?? "MCQ";
                            var correct = reader.GetValue(4)?.ToString()?.Trim() ?? "";

                            if (type.Equals("TrueFalse", StringComparison.OrdinalIgnoreCase))
                            {
                                if (correct.ToLower().StartsWith("t") || correct == "1" || correct.ToLower() == "true")
                                    correct = "True";
                                else
                                    correct = "False";
                            }

                            questionsList.Add(new QuestionBank
                            {
                                CourseId = cId,
                                QText = reader.GetValue(1)?.ToString() ?? "No Text Provided",
                                QType = type,
                                Difficulty = reader.GetValue(3)?.ToString() ?? "Medium",
                                CorrectAns = correct,

                                OptionA = type == "TrueFalse" ? "True" : (reader.FieldCount > 5 ? reader.GetValue(5)?.ToString() : null),
                                OptionB = type == "TrueFalse" ? "False" : (reader.FieldCount > 6 ? reader.GetValue(6)?.ToString() : null),

                                OptionC = (type == "TrueFalse" || type == "Written") ? null : (reader.FieldCount > 7 ? reader.GetValue(7)?.ToString() : null),
                                OptionD = (type == "TrueFalse" || type == "Written") ? null : (reader.FieldCount > 8 ? reader.GetValue(8)?.ToString() : null),

                                Marks = (reader.FieldCount > 9 && int.TryParse(reader.GetValue(9)?.ToString(), out int m)) ? m : 1
                            });
                        }
                    }
                }

                if (questionsList.Count == 0)
                    return BadRequest(new { message = "No valid questions found in the file." });

                _context.QuestionBanks.AddRange(questionsList);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Successfully uploaded {questionsList.Count} questions!" });
            }
            catch (Exception ex)
            {
                var innerError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, new { message = "Internal server error during upload.", details = innerError });
            }
        }

        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetQuestionsByCourse(int courseId)
        {
            var questions = await _context.QuestionBanks
                .Where(q => q.CourseId == courseId)
                .AsNoTracking()
                .ToListAsync();

            return Ok(questions);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> UpdateQuestion(int id, [FromForm] QuestionBank updatedQuestion, IFormFile? imageFile)
        {
            var question = await _context.QuestionBanks.FindAsync(id);
            if (question == null) return NotFound("Question not found.");

            question.QText = updatedQuestion.QText ?? question.QText;
            question.QType = updatedQuestion.QType ?? question.QType;
            question.Difficulty = updatedQuestion.Difficulty ?? question.Difficulty;
            question.OptionA = updatedQuestion.OptionA ?? question.OptionA;
            question.OptionB = updatedQuestion.OptionB ?? question.OptionB;
            question.OptionC = updatedQuestion.OptionC ?? question.OptionC;
            question.OptionD = updatedQuestion.OptionD ?? question.OptionD;
            question.CorrectAns = updatedQuestion.CorrectAns ?? question.CorrectAns;

            if (updatedQuestion.Marks > 0) question.Marks = updatedQuestion.Marks;

            if (imageFile != null && imageFile.Length > 0)
            {
                if (!string.IsNullOrEmpty(question.ImagePath))
                {
                    var oldPath = Path.Combine(_env.WebRootPath, question.ImagePath.TrimStart('/'));
                    if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
                }

                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "questions");
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = Guid.NewGuid().ToString() + "_" + imageFile.FileName;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await imageFile.CopyToAsync(fileStream);
                }
                question.ImagePath = "/uploads/questions/" + uniqueFileName;
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Question updated successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Database Error", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var question = await _context.QuestionBanks.FindAsync(id);
            if (question == null) return NotFound("Question not found.");

            if (!string.IsNullOrEmpty(question.ImagePath))
            {
                var fullPath = Path.Combine(_env.WebRootPath, question.ImagePath.TrimStart('/'));
                if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
            }

            _context.QuestionBanks.Remove(question);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Question deleted successfully." });
        }
    }
}
