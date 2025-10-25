using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentManager.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemovePropertyIdsFromUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PropertyIds",
                table: "users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "PropertyIds",
                table: "users",
                type: "jsonb",
                nullable: false);
        }
    }
}
