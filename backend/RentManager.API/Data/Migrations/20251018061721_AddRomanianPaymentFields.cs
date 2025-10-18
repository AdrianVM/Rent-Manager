using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentManager.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRomanianPaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BankAccountHolder",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankIBAN",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConfirmationCode",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalTransactionId",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FailureReason",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdempotencyKey",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsRecurring",
                table: "payments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsRefunded",
                table: "payments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PaymentGatewayProvider",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentReference",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProcessedAt",
                table: "payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ProcessingFee",
                table: "payments",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RecurringForMonth",
                table: "payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundReason",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundedAt",
                table: "payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundedPaymentId",
                table: "payments",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BankAccountHolder",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "BankIBAN",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "ConfirmationCode",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "ExternalTransactionId",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "FailureReason",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "IdempotencyKey",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "IsRecurring",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "IsRefunded",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "PaymentGatewayProvider",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "PaymentReference",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "ProcessedAt",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "ProcessingFee",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "RecurringForMonth",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "RefundReason",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "RefundedAt",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "RefundedPaymentId",
                table: "payments");
        }
    }
}
