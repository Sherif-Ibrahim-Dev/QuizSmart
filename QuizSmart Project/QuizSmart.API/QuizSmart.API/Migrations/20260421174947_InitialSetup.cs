using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizSmart.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialSetup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    user_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    full_name = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    email = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    password = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    role = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    level = table.Column<int>(type: "int", unicode: false, maxLength: 50, nullable: true),
                    university_id = table.Column<int>(type: "int", unicode: false, maxLength: 50, nullable: true),
                    is_verified = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    otp_code = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Users__B9BE370F3E90BDB3", x => x.user_id);
                });

            migrationBuilder.CreateTable(
                name: "Courses",
                columns: table => new
                {
                    CourseId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    course_code = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    course_name = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    credit_hours = table.Column<int>(type: "int", nullable: false),
                    academic_year = table.Column<int>(type: "int", nullable: false),
                    semester = table.Column<int>(type: "int", nullable: false),
                    instructor_id = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Courses", x => x.CourseId);
                    table.UniqueConstraint("AK_Courses_course_code", x => x.course_code);
                    table.ForeignKey(
                        name: "FK__Courses__instruc__3A81B327",
                        column: x => x.instructor_id,
                        principalTable: "Users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "Enrollments",
                columns: table => new
                {
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    CourseId = table.Column<int>(type: "int", nullable: false),
                    EnrolledAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Enrollments", x => new { x.StudentId, x.CourseId });
                    table.ForeignKey(
                        name: "FK_Enrollments_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "CourseId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Enrollments_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Exams",
                columns: table => new
                {
                    exam_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    course_code = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    title = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    start_time = table.Column<DateTime>(type: "datetime", nullable: false),
                    end_time = table.Column<DateTime>(type: "datetime", nullable: false),
                    duration = table.Column<int>(type: "int", nullable: false),
                    TotalMarks = table.Column<int>(type: "int", nullable: false),
                    IsRandom = table.Column<bool>(type: "bit", nullable: false),
                    RandomQuestionsCount = table.Column<int>(type: "int", nullable: false),
                    ShuffleQuestions = table.Column<bool>(type: "bit", nullable: false),
                    ShuffleOptions = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Exams__9C8C7BE96973C2A1", x => x.exam_id);
                    table.ForeignKey(
                        name: "FK__Exams__course_co__403A8C7D",
                        column: x => x.course_code,
                        principalTable: "Courses",
                        principalColumn: "course_code");
                });

            migrationBuilder.CreateTable(
                name: "Question_Bank",
                columns: table => new
                {
                    q_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    course_code = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    q_text = table.Column<string>(type: "text", nullable: true),
                    q_type = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    difficulty = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    correct_ans = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    Marks = table.Column<int>(type: "int", nullable: false),
                    AllowedSubmissionType = table.Column<int>(type: "int", nullable: false),
                    OptionA = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OptionB = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OptionC = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OptionD = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImagePath = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Question__3D59B310892CB6F9", x => x.q_id);
                    table.ForeignKey(
                        name: "FK__Question___cours__3D5E1FD2",
                        column: x => x.course_code,
                        principalTable: "Courses",
                        principalColumn: "course_code");
                });

            migrationBuilder.CreateTable(
                name: "Student_Attempts",
                columns: table => new
                {
                    attempt_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    student_id = table.Column<int>(type: "int", nullable: false),
                    exam_id = table.Column<int>(type: "int", nullable: false),
                    final_score = table.Column<double>(type: "float", nullable: false, defaultValue: 0.0),
                    submit_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    start_time = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Student___5621F949EDA5E388", x => x.attempt_id);
                    table.ForeignKey(
                        name: "FK__Student_A__exam___47DBAE45",
                        column: x => x.exam_id,
                        principalTable: "Exams",
                        principalColumn: "exam_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__Student_A__stude__46E78A0C",
                        column: x => x.student_id,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Exam_Questions",
                columns: table => new
                {
                    exam_id = table.Column<int>(type: "int", nullable: false),
                    q_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exam_Questions", x => new { x.exam_id, x.q_id });
                    table.ForeignKey(
                        name: "FK_Exam_Questions_Exams_exam_id",
                        column: x => x.exam_id,
                        principalTable: "Exams",
                        principalColumn: "exam_id");
                    table.ForeignKey(
                        name: "FK_Exam_Questions_Question_Bank_q_id",
                        column: x => x.q_id,
                        principalTable: "Question_Bank",
                        principalColumn: "q_id");
                });

            migrationBuilder.CreateTable(
                name: "Student_Answers",
                columns: table => new
                {
                    ans_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    attempt_id = table.Column<int>(type: "int", nullable: true),
                    q_id = table.Column<int>(type: "int", nullable: true),
                    chosen_option = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    is_correct = table.Column<bool>(type: "bit", nullable: true),
                    IsFlagged = table.Column<bool>(type: "bit", nullable: false),
                    WrittenMark = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    SolutionImagePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    QuestionStartTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Student___24F9FB172779FADF", x => x.ans_id);
                    table.ForeignKey(
                        name: "FK__Student_A__attem__4CA06362",
                        column: x => x.attempt_id,
                        principalTable: "Student_Attempts",
                        principalColumn: "attempt_id");
                    table.ForeignKey(
                        name: "FK__Student_An__q_id__4D94879B",
                        column: x => x.q_id,
                        principalTable: "Question_Bank",
                        principalColumn: "q_id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Courses_instructor_id",
                table: "Courses",
                column: "instructor_id");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_CourseId",
                table: "Enrollments",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Questions_q_id",
                table: "Exam_Questions",
                column: "q_id");

            migrationBuilder.CreateIndex(
                name: "IX_Exams_course_code",
                table: "Exams",
                column: "course_code");

            migrationBuilder.CreateIndex(
                name: "IX_Question_Bank_course_code",
                table: "Question_Bank",
                column: "course_code");

            migrationBuilder.CreateIndex(
                name: "IX_Student_Answers_attempt_id",
                table: "Student_Answers",
                column: "attempt_id");

            migrationBuilder.CreateIndex(
                name: "IX_Student_Answers_q_id",
                table: "Student_Answers",
                column: "q_id");

            migrationBuilder.CreateIndex(
                name: "IX_Student_Attempts_exam_id",
                table: "Student_Attempts",
                column: "exam_id");

            migrationBuilder.CreateIndex(
                name: "IX_Student_Attempts_student_id",
                table: "Student_Attempts",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "UQ__Users__AB6E6164823CCB51",
                table: "Users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Enrollments");

            migrationBuilder.DropTable(
                name: "Exam_Questions");

            migrationBuilder.DropTable(
                name: "Student_Answers");

            migrationBuilder.DropTable(
                name: "Student_Attempts");

            migrationBuilder.DropTable(
                name: "Question_Bank");

            migrationBuilder.DropTable(
                name: "Exams");

            migrationBuilder.DropTable(
                name: "Courses");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
