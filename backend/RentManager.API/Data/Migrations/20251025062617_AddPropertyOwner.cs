using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentManager.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "property_owners",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    PropertyId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_property_owners", x => x.Id);
                    table.ForeignKey(
                        name: "FK_property_owners_properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "property_owner_companies",
                columns: table => new
                {
                    OwningCompaniesId = table.Column<string>(type: "text", nullable: false),
                    PropertyOwnerId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_property_owner_companies", x => new { x.OwningCompaniesId, x.PropertyOwnerId });
                    table.ForeignKey(
                        name: "FK_property_owner_companies_Companies_OwningCompaniesId",
                        column: x => x.OwningCompaniesId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_property_owner_companies_property_owners_PropertyOwnerId",
                        column: x => x.PropertyOwnerId,
                        principalTable: "property_owners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "property_owner_persons",
                columns: table => new
                {
                    PersonOwnersId = table.Column<string>(type: "text", nullable: false),
                    PropertyOwnerId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_property_owner_persons", x => new { x.PersonOwnersId, x.PropertyOwnerId });
                    table.ForeignKey(
                        name: "FK_property_owner_persons_Persons_PersonOwnersId",
                        column: x => x.PersonOwnersId,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_property_owner_persons_property_owners_PropertyOwnerId",
                        column: x => x.PropertyOwnerId,
                        principalTable: "property_owners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_property_owner_companies_PropertyOwnerId",
                table: "property_owner_companies",
                column: "PropertyOwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_property_owner_persons_PropertyOwnerId",
                table: "property_owner_persons",
                column: "PropertyOwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_property_owners_PropertyId",
                table: "property_owners",
                column: "PropertyId");

            migrationBuilder.AddForeignKey(
                name: "FK_tenants_properties_PropertyId",
                table: "tenants",
                column: "PropertyId",
                principalTable: "properties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tenants_properties_PropertyId",
                table: "tenants");

            migrationBuilder.DropTable(
                name: "property_owner_companies");

            migrationBuilder.DropTable(
                name: "property_owner_persons");

            migrationBuilder.DropTable(
                name: "property_owners");
        }
    }
}
