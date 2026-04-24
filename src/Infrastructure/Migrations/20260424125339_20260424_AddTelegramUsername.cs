using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UzMarket.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class _20260424_AddTelegramUsername : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TelegramUsername",
                table: "Tenants",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TelegramUsername",
                table: "Tenants");
        }
    }
}
