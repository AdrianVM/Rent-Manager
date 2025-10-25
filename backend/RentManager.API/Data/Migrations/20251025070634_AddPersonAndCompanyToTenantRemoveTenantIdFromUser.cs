using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentManager.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonAndCompanyToTenantRemoveTenantIdFromUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "users");

            migrationBuilder.AddColumn<string>(
                name: "CompanyId",
                table: "tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonId",
                table: "tenants",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_tenants_CompanyId",
                table: "tenants",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_tenants_PersonId",
                table: "tenants",
                column: "PersonId");

            migrationBuilder.AddForeignKey(
                name: "FK_tenants_Companies_CompanyId",
                table: "tenants",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_tenants_Persons_PersonId",
                table: "tenants",
                column: "PersonId",
                principalTable: "Persons",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tenants_Companies_CompanyId",
                table: "tenants");

            migrationBuilder.DropForeignKey(
                name: "FK_tenants_Persons_PersonId",
                table: "tenants");

            migrationBuilder.DropIndex(
                name: "IX_tenants_CompanyId",
                table: "tenants");

            migrationBuilder.DropIndex(
                name: "IX_tenants_PersonId",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "PersonId",
                table: "tenants");

            migrationBuilder.AddColumn<string>(
                name: "TenantId",
                table: "users",
                type: "text",
                nullable: true);
        }
    }
}
