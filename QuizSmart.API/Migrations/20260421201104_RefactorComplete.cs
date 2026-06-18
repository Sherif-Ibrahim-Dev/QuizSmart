using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizSmart.API.Migrations
{
    /// <inheritdoc />
    public partial class RefactorComplete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK__Exams__course_co__403A8C7D",
                table: "Exams");

            migrationBuilder.DropForeignKey(
                name: "FK__Question___cours__3D5E1FD2",
                table: "Question_Bank");

            migrationBuilder.DropIndex(
                name: "IX_Question_Bank_course_code",
                table: "Question_Bank");

            migrationBuilder.DropIndex(
                name: "IX_Exams_course_code",
                table: "Exams");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Courses_course_code",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "course_code",
                table: "Question_Bank");

            migrationBuilder.DropColumn(
                name: "course_code",
                table: "Exams");

            migrationBuilder.RenameColumn(
                name: "AllowedSubmissionType",
                table: "Question_Bank",
                newName: "course_id");

            migrationBuilder.AlterColumn<string>(
                name: "q_type",
                table: "Question_Bank",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldUnicode: false,
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "q_text",
                table: "Question_Bank",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "correct_ans",
                table: "Question_Bank",
                type: "varchar(255)",
                unicode: false,
                maxLength: 255,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldUnicode: false,
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "course_id",
                table: "Exams",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Question_Bank_course_id",
                table: "Question_Bank",
                column: "course_id");

            migrationBuilder.CreateIndex(
                name: "IX_Exams_course_id",
                table: "Exams",
                column: "course_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Exams_Courses",
                table: "Exams",
                column: "course_id",
                principalTable: "Courses",
                principalColumn: "CourseId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Question_Bank_Courses",
                table: "Question_Bank",
                column: "course_id",
                principalTable: "Courses",
                principalColumn: "CourseId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exams_Courses",
                table: "Exams");

            migrationBuilder.DropForeignKey(
                name: "FK_Question_Bank_Courses",
                table: "Question_Bank");

            migrationBuilder.DropIndex(
                name: "IX_Question_Bank_course_id",
                table: "Question_Bank");

            migrationBuilder.DropIndex(
                name: "IX_Exams_course_id",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "course_id",
                table: "Exams");

            migrationBuilder.RenameColumn(
                name: "course_id",
                table: "Question_Bank",
                newName: "AllowedSubmissionType");

            migrationBuilder.AlterColumn<string>(
                name: "q_type",
                table: "Question_Bank",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldUnicode: false,
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "q_text",
                table: "Question_Bank",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "correct_ans",
                table: "Question_Bank",
                type: "varchar(255)",
                unicode: false,
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldUnicode: false,
                oldMaxLength: 255);

            migrationBuilder.AddColumn<string>(
                name: "course_code",
                table: "Question_Bank",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "course_code",
                table: "Exams",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Courses_course_code",
                table: "Courses",
                column: "course_code");

            migrationBuilder.CreateIndex(
                name: "IX_Question_Bank_course_code",
                table: "Question_Bank",
                column: "course_code");

            migrationBuilder.CreateIndex(
                name: "IX_Exams_course_code",
                table: "Exams",
                column: "course_code");

            migrationBuilder.AddForeignKey(
                name: "FK__Exams__course_co__403A8C7D",
                table: "Exams",
                column: "course_code",
                principalTable: "Courses",
                principalColumn: "course_code");

            migrationBuilder.AddForeignKey(
                name: "FK__Question___cours__3D5E1FD2",
                table: "Question_Bank",
                column: "course_code",
                principalTable: "Courses",
                principalColumn: "course_code");
        }
    }
}
