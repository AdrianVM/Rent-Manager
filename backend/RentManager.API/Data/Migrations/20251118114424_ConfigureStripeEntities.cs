using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentManager.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class ConfigureStripeEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "ProcessingFee",
                table: "payments",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformFee",
                table: "payments",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeConnectAccountId",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeTransferId",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TransferAmount",
                table: "payments",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TransferCompleted",
                table: "payments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "TransferredAt",
                table: "payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "stripe_connect_accounts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    PropertyOwnerId = table.Column<string>(type: "text", nullable: false),
                    StripeAccountId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    AccountType = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    OnboardingCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    OnboardingCompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    OnboardingUrl = table.Column<string>(type: "text", nullable: true),
                    OnboardingUrlExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CanAcceptPayments = table.Column<bool>(type: "boolean", nullable: false),
                    CanCreatePayouts = table.Column<bool>(type: "boolean", nullable: false),
                    DisabledReason = table.Column<string>(type: "text", nullable: true),
                    IdentityVerified = table.Column<bool>(type: "boolean", nullable: false),
                    DocumentsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    RequiredDocuments = table.Column<string>(type: "text", nullable: true),
                    VerifiedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    DefaultPayoutSchedule = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    InstantPayoutsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    BankAccountLast4 = table.Column<string>(type: "text", nullable: true),
                    BankName = table.Column<string>(type: "text", nullable: true),
                    BankCountry = table.Column<string>(type: "text", nullable: true),
                    StripeEmail = table.Column<string>(type: "text", nullable: true),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DeactivationReason = table.Column<string>(type: "text", nullable: true),
                    DeactivatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stripe_connect_accounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_stripe_connect_accounts_property_owners_PropertyOwnerId",
                        column: x => x.PropertyOwnerId,
                        principalTable: "property_owners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stripe_platform_fees",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    FeeType = table.Column<string>(type: "text", nullable: false),
                    PercentageFee = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    FixedFee = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MinimumFee = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MaximumFee = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ApplicableToOwnerType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    MinPaymentAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    MaxPaymentAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    PropertyId = table.Column<string>(type: "text", nullable: true),
                    ValidFrom = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ValidTo = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsPromotional = table.Column<bool>(type: "boolean", nullable: false),
                    FreePaymentsCount = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stripe_platform_fees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_stripe_platform_fees_properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "stripe_transfers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    PaymentId = table.Column<string>(type: "text", nullable: false),
                    StripeConnectAccountId = table.Column<string>(type: "text", nullable: false),
                    StripeTransferId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    GrossAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PlatformFee = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    StripeFee = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    NetAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    FailureReason = table.Column<string>(type: "text", nullable: true),
                    FailureCode = table.Column<string>(type: "text", nullable: true),
                    TransferredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ExpectedArrivalDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ActualArrivalDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    StripePayoutId = table.Column<string>(type: "text", nullable: true),
                    PayoutCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    PayoutCompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsReversed = table.Column<bool>(type: "boolean", nullable: false),
                    ReversalId = table.Column<string>(type: "text", nullable: true),
                    ReversedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ReversalReason = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    IdempotencyKey = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stripe_transfers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_stripe_transfers_payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stripe_transfers_stripe_connect_accounts_StripeConnectAccou~",
                        column: x => x.StripeConnectAccountId,
                        principalTable: "stripe_connect_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_payments_StripeConnectAccountId",
                table: "payments",
                column: "StripeConnectAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_stripe_connect_accounts_PropertyOwnerId",
                table: "stripe_connect_accounts",
                column: "PropertyOwnerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stripe_connect_accounts_Status",
                table: "stripe_connect_accounts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_stripe_connect_accounts_StripeAccountId",
                table: "stripe_connect_accounts",
                column: "StripeAccountId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stripe_platform_fees_IsActive",
                table: "stripe_platform_fees",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_stripe_platform_fees_IsDefault",
                table: "stripe_platform_fees",
                column: "IsDefault");

            migrationBuilder.CreateIndex(
                name: "IX_stripe_platform_fees_PropertyId",
                table: "stripe_platform_fees",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_stripe_transfers_PaymentId",
                table: "stripe_transfers",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_stripe_transfers_Status",
                table: "stripe_transfers",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_stripe_transfers_StripeConnectAccountId",
                table: "stripe_transfers",
                column: "StripeConnectAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_stripe_transfers_StripeTransferId",
                table: "stripe_transfers",
                column: "StripeTransferId");

            migrationBuilder.AddForeignKey(
                name: "FK_payments_stripe_connect_accounts_StripeConnectAccountId",
                table: "payments",
                column: "StripeConnectAccountId",
                principalTable: "stripe_connect_accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_payments_stripe_connect_accounts_StripeConnectAccountId",
                table: "payments");

            migrationBuilder.DropTable(
                name: "stripe_platform_fees");

            migrationBuilder.DropTable(
                name: "stripe_transfers");

            migrationBuilder.DropTable(
                name: "stripe_connect_accounts");

            migrationBuilder.DropIndex(
                name: "IX_payments_StripeConnectAccountId",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "PlatformFee",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "StripeConnectAccountId",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "StripeTransferId",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "TransferAmount",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "TransferCompleted",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "TransferredAt",
                table: "payments");

            migrationBuilder.AlterColumn<decimal>(
                name: "ProcessingFee",
                table: "payments",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2,
                oldNullable: true);
        }
    }
}
