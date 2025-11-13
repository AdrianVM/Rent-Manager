using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RentManager.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCookieConsent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cookie_consents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ConsentToken = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    StrictlyNecessary = table.Column<bool>(type: "boolean", nullable: false),
                    Functional = table.Column<bool>(type: "boolean", nullable: false),
                    Performance = table.Column<bool>(type: "boolean", nullable: false),
                    Marketing = table.Column<bool>(type: "boolean", nullable: false),
                    ConsentDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastUpdated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PolicyVersion = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    ExpiryDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cookie_consents", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cookie_consents_ConsentToken",
                table: "cookie_consents",
                column: "ConsentToken");

            migrationBuilder.CreateIndex(
                name: "IX_cookie_consents_ExpiryDate",
                table: "cookie_consents",
                column: "ExpiryDate");

            migrationBuilder.CreateIndex(
                name: "IX_cookie_consents_UserId",
                table: "cookie_consents",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cookie_consents");
        }
    }
}
