using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizSmart.API.Models;

namespace QuizSmart.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly QuizSmartDbContext _context;

        public UsersController(QuizSmartDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(User user)
        {
            if (await _context.Users.AnyAsync(u => u.Email == user.Email))
                return BadRequest("هذا البريد الإلكتروني مسجل بالفعل.");

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "تم تسجيل الحساب بنجاح!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] User loginData)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == loginData.Email && u.PasswordHash == loginData.PasswordHash);

            if (user == null) return Unauthorized("الإيميل أو كلمة المرور غير صحيحة.");

            return Ok(new { message = "تم تسجيل الدخول بنجاح!", user.FullName, user.Role });
        }
    }
}
