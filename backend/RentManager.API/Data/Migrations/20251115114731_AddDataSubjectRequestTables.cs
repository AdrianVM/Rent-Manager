using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RentManager.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDataSubjectRequestTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "data_deletion_logs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    DataCategory = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    RecordCount = table.Column<int>(type: "integer", nullable: true),
                    DeletionMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Reason = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LegalBasis = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeletedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    RelatedRequestId = table.Column<int>(type: "integer", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    IsReversible = table.Column<bool>(type: "boolean", nullable: false),
                    BackupLocation = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_data_deletion_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "data_subject_requests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    RequestType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeadlineAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AssignedToAdminId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    AdminNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ExportFilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ExportExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletionSummary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    RetentionSummary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IdentityVerified = table.Column<bool>(type: "boolean", nullable: false),
                    VerificationMethod = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    VerifiedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_data_subject_requests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "data_subject_request_histories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RequestId = table.Column<int>(type: "integer", nullable: false),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OldStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    NewStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Details = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    PerformedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PerformedByRole = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PerformedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_data_subject_request_histories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_data_subject_request_histories_data_subject_requests_Reques~",
                        column: x => x.RequestId,
                        principalTable: "data_subject_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_data_deletion_logs_DataCategory",
                table: "data_deletion_logs",
                column: "DataCategory");

            migrationBuilder.CreateIndex(
                name: "IX_data_deletion_logs_DeletedAt",
                table: "data_deletion_logs",
                column: "DeletedAt");

            migrationBuilder.CreateIndex(
                name: "IX_data_deletion_logs_Reason",
                table: "data_deletion_logs",
                column: "Reason");

            migrationBuilder.CreateIndex(
                name: "IX_data_deletion_logs_RelatedRequestId",
                table: "data_deletion_logs",
                column: "RelatedRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_data_deletion_logs_UserId",
                table: "data_deletion_logs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_data_subject_request_histories_PerformedAt",
                table: "data_subject_request_histories",
                column: "PerformedAt");

            migrationBuilder.CreateIndex(
                name: "IX_data_subject_request_histories_RequestId",
                table: "data_subject_request_histories",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_data_subject_requests_DeadlineAt",
                table: "data_subject_requests",
                column: "DeadlineAt");

            migrationBuilder.CreateIndex(
                name: "IX_data_subject_requests_RequestType",
                table: "data_subject_requests",
                column: "RequestType");

            migrationBuilder.CreateIndex(
                name: "IX_data_subject_requests_Status",
                table: "data_subject_requests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_data_subject_requests_SubmittedAt",
                table: "data_subject_requests",
                column: "SubmittedAt");

            migrationBuilder.CreateIndex(
                name: "IX_data_subject_requests_UserId",
                table: "data_subject_requests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_data_subject_requests_UserId_Status",
                table: "data_subject_requests",
                columns: new[] { "UserId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "data_deletion_logs");

            migrationBuilder.DropTable(
                name: "data_subject_request_histories");

            migrationBuilder.DropTable(
                name: "data_subject_requests");
        }
    }
}
