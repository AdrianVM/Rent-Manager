using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RentManager.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class Phase3_DataRetentionAndLegalHolds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "data_retention_schedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DataCategory = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RetentionMonths = table.Column<int>(type: "integer", nullable: false),
                    LegalBasis = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ReviewedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_data_retention_schedules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "legal_holds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    DataCategory = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    PlacedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    PlacedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ReleasedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ReleasedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ReleaseReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CaseReference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ReviewDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_legal_holds", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "data_retention_schedules",
                columns: new[] { "Id", "Action", "CreatedAt", "DataCategory", "Description", "IsActive", "LastReviewedAt", "LegalBasis", "RetentionMonths", "ReviewedBy" },
                values: new object[,]
                {
                    { 1, "Archive", new DateTimeOffset(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "financial_records", "Payment records, invoices, and financial transactions", true, null, "Tax compliance requirements (IRS/HMRC 7-year retention)", 84, null },
                    { 2, "Delete", new DateTimeOffset(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "audit_logs", "System logs, access logs, security logs", true, null, "Security best practice and GDPR Article 5(2)", 3, null },
                    { 3, "Delete", new DateTimeOffset(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "cookie_consent", "Cookie consent records", true, null, "GDPR Article 7 - proof of consent requirement", 24, null },
                    { 4, "Archive", new DateTimeOffset(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "lease_agreements", "Lease contracts and related documentation", true, null, "Legal obligation - contract law and tax compliance", 84, null },
                    { 5, "Delete", new DateTimeOffset(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "email_notifications", "Sent email notifications (rent reminders, lease warnings)", true, null, "Legitimate interest - proof of notification delivery", 24, null },
                    { 6, "Delete", new DateTimeOffset(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "inactive_accounts", "User accounts inactive for extended periods", true, null, "Legitimate interest - reduce data storage and security risk", 36, null },
                    { 7, "Archive", new DateTimeOffset(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "privacy_policy_acceptances", "Privacy policy acceptance records", true, null, "GDPR Article 7(1) - demonstrable consent requirement", 84, null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_data_retention_schedules_DataCategory",
                table: "data_retention_schedules",
                column: "DataCategory",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_data_retention_schedules_IsActive",
                table: "data_retention_schedules",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_legal_holds_IsActive",
                table: "legal_holds",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_legal_holds_PlacedAt",
                table: "legal_holds",
                column: "PlacedAt");

            migrationBuilder.CreateIndex(
                name: "IX_legal_holds_UserId",
                table: "legal_holds",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_legal_holds_UserId_IsActive",
                table: "legal_holds",
                columns: new[] { "UserId", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "data_retention_schedules");

            migrationBuilder.DropTable(
                name: "legal_holds");
        }
    }
}
