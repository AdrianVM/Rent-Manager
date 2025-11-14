using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RentManager.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPrivacyPolicyTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "privacy_policy_versions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Version = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    ContentHtml = table.Column<string>(type: "text", nullable: false),
                    ContentPlainText = table.Column<string>(type: "text", nullable: true),
                    EffectiveDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    IsCurrent = table.Column<bool>(type: "boolean", nullable: false),
                    RequiresReAcceptance = table.Column<bool>(type: "boolean", nullable: false),
                    ChangesSummary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_privacy_policy_versions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "user_privacy_policy_acceptances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PolicyVersionId = table.Column<int>(type: "integer", nullable: false),
                    AcceptedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AcceptanceMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    WasShownChangesSummary = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_privacy_policy_acceptances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_privacy_policy_acceptances_privacy_policy_versions_Pol~",
                        column: x => x.PolicyVersionId,
                        principalTable: "privacy_policy_versions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_privacy_policy_versions_EffectiveDate",
                table: "privacy_policy_versions",
                column: "EffectiveDate");

            migrationBuilder.CreateIndex(
                name: "IX_privacy_policy_versions_IsCurrent",
                table: "privacy_policy_versions",
                column: "IsCurrent");

            migrationBuilder.CreateIndex(
                name: "IX_privacy_policy_versions_Version",
                table: "privacy_policy_versions",
                column: "Version",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_privacy_policy_acceptances_PolicyVersionId",
                table: "user_privacy_policy_acceptances",
                column: "PolicyVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_user_privacy_policy_acceptances_UserId",
                table: "user_privacy_policy_acceptances",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_privacy_policy_acceptances_UserId_PolicyVersionId",
                table: "user_privacy_policy_acceptances",
                columns: new[] { "UserId", "PolicyVersionId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_privacy_policy_acceptances");

            migrationBuilder.DropTable(
                name: "privacy_policy_versions");
        }
    }
}
