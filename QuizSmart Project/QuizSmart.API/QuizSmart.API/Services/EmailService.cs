using System.Net;
using System.Net.Mail;

namespace QuizSmart.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string message)
        {

            Console.WriteLine("\n***************************************************");
            Console.WriteLine($"[EMAIL SERVICE] جاري إرسال رسالة إلى: {toEmail}");
            Console.WriteLine($"[SUBJECT]: {subject}");
            Console.WriteLine($"[MESSAGE]: {message}");
            Console.WriteLine("***************************************************\n");


            await Task.CompletedTask;
        }
    }
}
