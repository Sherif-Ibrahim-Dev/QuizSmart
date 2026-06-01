using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizSmart.API.Models;
using System.Security.Claims;

namespace QuizSmart.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CoursesController : ControllerBase
    {
        private readonly QuizSmartDbContext _context;

        public CoursesController(QuizSmartDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCourses()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? userId = string.IsNullOrEmpty(userIdString) ? null : int.Parse(userIdString);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (userRole == "Student" && userId.HasValue)
            {
                var enrolledIds = await _context.Enrollments
                    .Where(e => e.StudentId == userId.Value)
                    .Select(e => e.CourseId)
                    .ToListAsync();

                var courses = await _context.Courses
                    .AsNoTracking()
                    .Select(c => new {
                        c.CourseId,
                        c.CourseCode,
                        c.CourseName,
                        c.Description,
                        c.CreditHours,
                        c.AcademicYear,
                        c.Semester,
                        IsEnrolled = enrolledIds.Contains(c.CourseId)
                    })
                    .ToListAsync();
                return Ok(courses);
            }
            else
            {
                var courses = await _context.Courses.AsNoTracking().ToListAsync();
                return Ok(courses);
            }
        }

        [HttpGet("my-teaching-courses")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> GetInstructorCourses()
        {
            var instructorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(instructorIdClaim)) return Unauthorized("User ID not found in token.");

            int instructorId = int.Parse(instructorIdClaim);

            var courses = await _context.Courses
                .Where(c => c.InstructorId == instructorId)
                .Select(c => new {
                    c.CourseId,
                    c.CourseCode,
                    c.CourseName,
                    c.Description,
                    c.CreditHours,
                    c.AcademicYear,
                    c.Semester,
                    StudentCount = c.Enrollments.Count
                })
                .ToListAsync();

            return Ok(courses);
        }

        [HttpPost]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> CreateCourse([FromBody] Course courseData)
        {
            if (courseData == null) return BadRequest("Course data is incomplete.");

            var instructorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(instructorIdClaim)) return Unauthorized("User ID not found in token.");

            var newCourse = new Course
            {
                CourseName = courseData.CourseName,
                CourseCode = courseData.CourseCode,
                Description = courseData.Description,
                CreditHours = courseData.CreditHours,
                AcademicYear = courseData.AcademicYear,
                Semester = courseData.Semester,
                InstructorId = int.Parse(instructorIdClaim)
            };

            try
            {
                _context.Courses.Add(newCourse);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Course added successfully!", courseId = newCourse.CourseId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> UpdateCourse(int id, [FromBody] Course updatedCourse)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound("Course not found.");

            course.CourseName = updatedCourse.CourseName;
            course.CourseCode = updatedCourse.CourseCode;
            course.Description = updatedCourse.Description;
            course.CreditHours = updatedCourse.CreditHours;
            course.AcademicYear = updatedCourse.AcademicYear;
            course.Semester = updatedCourse.Semester;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Course updated successfully!" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound("Course not found.");

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Course deleted successfully!" });
        }

        public class EnrollmentRequest
        {
            public int CourseId { get; set; }
        }

        [HttpPost("enroll")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> EnrollInCourse([FromBody] EnrollmentRequest request)
        {
            if (request == null || request.CourseId <= 0) return BadRequest(new { message = "Invalid course id." });

            var courseId = request.CourseId;
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);

            if (await _context.Enrollments.AnyAsync(e => e.StudentId == userId && e.CourseId == courseId))
                return BadRequest(new { message = "You are already enrolled in this course." });

            _context.Enrollments.Add(new Enrollment { StudentId = userId, CourseId = courseId });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Enrolled successfully!" });
        }

        [HttpGet("my-enrolled-courses")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMyEnrolledCourses()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized("User ID not found in token.");
            int userId = int.Parse(userIdString);

            var enrolledCourses = await _context.Enrollments
                .Where(e => e.StudentId == userId)
                .Include(e => e.Course)
                .Select(e => new {
                    e.Course.CourseId,
                    e.Course.CourseCode,
                    e.Course.CourseName,
                    e.Course.Description,
                    e.Course.CreditHours,
                    e.Course.AcademicYear,
                    e.Course.Semester,
                    IsEnrolled = true
                })
                .ToListAsync();

            return Ok(enrolledCourses);
        }
    }
}
