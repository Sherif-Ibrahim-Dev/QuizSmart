using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace QuizSmart.API.Models;

public partial class QuizSmartDbContext : DbContext
{
    public QuizSmartDbContext()
    {
    }

    public QuizSmartDbContext(DbContextOptions<QuizSmartDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Course> Courses { get; set; }
    public virtual DbSet<Exam> Exams { get; set; }
    public virtual DbSet<ExamQuestion> ExamQuestions { get; set; }
    public virtual DbSet<QuestionBank> QuestionBanks { get; set; }
    public virtual DbSet<StudentAnswer> StudentAnswers { get; set; }
    public virtual DbSet<StudentAttempt> StudentAttempts { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<Enrollment> Enrollments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.ToTable("Enrollments");
            entity.HasKey(e => new { e.StudentId, e.CourseId });

            entity.Property(e => e.EnrolledAt)
                  .HasDefaultValueSql("(getdate())")
                  .HasColumnType("datetime");

            entity.HasOne(d => d.Student)
                .WithMany(p => p.Enrollments)
                .HasForeignKey(d => d.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Course)
                .WithMany(p => p.Enrollments)
                .HasForeignKey(d => d.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ExamQuestion>(entity =>
        {
            entity.ToTable("Exam_Questions");
            entity.HasKey(eq => new { eq.ExamId, eq.QId });

            entity.Property(e => e.ExamId).HasColumnName("exam_id");
            entity.Property(e => e.QId).HasColumnName("q_id");

            entity.HasOne(d => d.Exam)
                .WithMany(p => p.ExamQuestions)
                .HasForeignKey(d => d.ExamId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Question)
                .WithMany(p => p.ExamQuestions)
                .HasForeignKey(d => d.QId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(e => e.CourseId);
            entity.ToTable("Courses");

            entity.Property(e => e.CourseCode).HasMaxLength(50).IsUnicode(false).HasColumnName("course_code");
            entity.Property(e => e.CourseName).HasMaxLength(255).IsUnicode(false).HasColumnName("course_name");
            entity.Property(e => e.Description).HasMaxLength(500).IsUnicode(false).HasColumnName("description");
            entity.Property(e => e.CreditHours).HasColumnName("credit_hours");
            entity.Property(e => e.AcademicYear).HasColumnName("academic_year");
            entity.Property(e => e.Semester).HasColumnName("semester");
            entity.Property(e => e.InstructorId).HasColumnName("instructor_id");

            entity.HasOne(d => d.Instructor).WithMany(p => p.Courses)
                .HasForeignKey(d => d.InstructorId)
                .HasConstraintName("FK__Courses__instruc__3A81B327");
        });

        modelBuilder.Entity<Exam>(entity =>
        {
            entity.HasKey(e => e.ExamId).HasName("PK__Exams__9C8C7BE96973C2A1");
            entity.ToTable("Exams");
            entity.Property(e => e.ExamId).HasColumnName("exam_id");
            entity.Property(e => e.CourseId).HasColumnName("course_id");
            entity.Property(e => e.DurationInMinutes).HasColumnName("duration");
            entity.Property(e => e.EndTime).HasColumnType("datetime").HasColumnName("end_time");
            entity.Property(e => e.StartTime).HasColumnType("datetime").HasColumnName("start_time");
            entity.Property(e => e.Title).HasMaxLength(255).IsUnicode(false).HasColumnName("title");

            entity.HasOne(d => d.Course)
                .WithMany(p => p.Exams)
                .HasForeignKey(d => d.CourseId)
                .HasConstraintName("FK_Exams_Courses");
        });

        modelBuilder.Entity<QuestionBank>(entity =>
        {
            entity.HasKey(e => e.QId).HasName("PK__Question__3D59B310892CB6F9");
            entity.ToTable("Question_Bank");
            entity.Property(e => e.QId).HasColumnName("q_id");
            entity.Property(e => e.CourseId).HasColumnName("course_id");
            entity.Property(e => e.CorrectAns).HasMaxLength(255).IsUnicode(false).HasColumnName("correct_ans");
            entity.Property(e => e.Difficulty).HasMaxLength(50).IsUnicode(false).HasColumnName("difficulty");
            entity.Property(e => e.QText).HasColumnType("text").HasColumnName("q_text");
            entity.Property(e => e.QType).HasMaxLength(50).IsUnicode(false).HasColumnName("q_type");

            entity.HasOne(d => d.Course)
                .WithMany(p => p.QuestionBanks)
                .HasForeignKey(d => d.CourseId)
                .HasConstraintName("FK_Question_Bank_Courses");
        });

        modelBuilder.Entity<StudentAnswer>(entity =>
        {
            entity.HasKey(e => e.AnsId).HasName("PK__Student___24F9FB172779FADF");
            entity.ToTable("Student_Answers");
            entity.Property(e => e.AnsId).HasColumnName("ans_id");
            entity.Property(e => e.AttemptId).HasColumnName("attempt_id");
            entity.Property(e => e.ChosenOption).HasMaxLength(255).IsUnicode(false).HasColumnName("chosen_option");
            entity.Property(e => e.IsCorrect).HasColumnName("is_correct");
            entity.Property(e => e.QId).HasColumnName("q_id");

            entity.HasOne(d => d.Attempt).WithMany(p => p.StudentAnswers)
                .HasForeignKey(d => d.AttemptId)
                .HasConstraintName("FK__Student_A__attem__4CA06362");

            entity.HasOne(d => d.QIdNavigation).WithMany(p => p.StudentAnswers)
                .HasForeignKey(d => d.QId)
                .HasConstraintName("FK__Student_An__q_id__4D94879B");
        });

        modelBuilder.Entity<StudentAttempt>(entity =>
        {
            entity.HasKey(e => e.AttemptId).HasName("PK__Student___5621F949EDA5E388");
            entity.ToTable("Student_Attempts");
            entity.Property(e => e.AttemptId).HasColumnName("attempt_id");
            entity.Property(e => e.ExamId).HasColumnName("exam_id");
            entity.Property(e => e.FinalScore).HasDefaultValue(0.0).HasColumnName("final_score");
            entity.Property(e => e.StudentId).HasColumnName("student_id");
            entity.Property(e => e.SubmitDate).HasDefaultValueSql("(getdate())").HasColumnType("datetime").HasColumnName("submit_date");
            entity.Property(e => e.StartTime).HasColumnType("datetime").HasColumnName("start_time");

            entity.HasOne(d => d.Exam).WithMany(p => p.StudentAttempts)
                .HasForeignKey(d => d.ExamId)
                .HasConstraintName("FK__Student_A__exam___47DBAE45");

            entity.HasOne(d => d.Student).WithMany(p => p.StudentAttempts)
                .HasForeignKey(d => d.StudentId)
                .HasConstraintName("FK__Student_A__stude__46E78A0C");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__B9BE370F3E90BDB3");
            entity.ToTable("Users");
            entity.HasIndex(e => e.Email, "UQ__Users__AB6E6164823CCB51").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Email).HasMaxLength(255).IsUnicode(false).HasColumnName("email");
            entity.Property(e => e.FullName).HasMaxLength(255).IsUnicode(false).HasColumnName("full_name");
            entity.Property(e => e.PasswordHash).HasMaxLength(255).IsUnicode(false).HasColumnName("password");
            entity.Property(e => e.Role).HasMaxLength(50).IsUnicode(false).HasColumnName("role");
            entity.Property(e => e.Level).HasMaxLength(50).IsUnicode(false).HasColumnName("level");
            entity.Property(e => e.UniversityId).HasMaxLength(50).IsUnicode(false).HasColumnName("university_id");
            entity.Property(e => e.IsVerified).HasColumnName("is_verified").HasDefaultValue(false);
            entity.Property(e => e.OtpCode).HasMaxLength(10).IsUnicode(false).HasColumnName("otp_code");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
