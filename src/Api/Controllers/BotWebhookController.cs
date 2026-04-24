using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Orders.Commands;
using UzMarket.Domain.Enums;

namespace UzMarket.Api.Controllers;

[ApiController]
[Route("internal")]
public class BotWebhookController(IMediator mediator, IConfiguration config, IAppDbContext db) : ControllerBase
{
    private bool ValidateSecret() =>
        Request.Headers.TryGetValue("X-Bot-Secret", out var val) &&
        val == config["BotSecret"];

    [HttpGet("orders/customer")]
    public async Task<IActionResult> GetCustomerOrders(
        [FromQuery] string? phone,
        [FromQuery] bool activeOnly = false,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        if (!ValidateSecret())
            return Unauthorized(ApiResponse<string>.Fail("Ruxsat yo'q."));

        if (string.IsNullOrWhiteSpace(phone))
            return Ok(ApiResponse<object>.Ok(new { items = Array.Empty<object>(), total = 0 }));

        var query = db.Orders
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(o => o.CustomerPhone == phone && !o.IsDeleted);

        if (activeOnly)
            query = query.Where(o =>
                o.Status != OrderStatus.Delivered && o.Status != OrderStatus.Cancelled);

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Take(pageSize)
            .Select(o => new
            {
                o.Id, o.OrderNumber, o.Status, o.TotalAmount,
                o.PaymentMethod, o.CreatedAt,
                itemCount = o.Items.Count
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { items, total = items.Count }));
    }

    [HttpGet("tenants/by-chat-id/{chatId:long}")]
    public async Task<IActionResult> GetTenantByChatId(long chatId, CancellationToken ct)
    {
        if (!ValidateSecret())
            return Unauthorized(ApiResponse<string>.Fail("Ruxsat yo'q."));

        var tenant = await db.Tenants
            .AsNoTracking()
            .Where(t => t.TelegramChatId == chatId && t.IsActive && !t.IsDeleted)
            .Select(t => new { t.Slug })
            .FirstOrDefaultAsync(ct);

        if (tenant is null)
            return NotFound(ApiResponse<string>.Fail("Topilmadi."));

        return Ok(ApiResponse<object>.Ok(new { slug = tenant.Slug }));
    }

    [HttpPatch("orders/{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] BotStatusUpdateRequest body,
        CancellationToken ct)
    {
        if (!ValidateSecret())
            return Unauthorized(ApiResponse<string>.Fail("Ruxsat yo'q."));

        await mediator.Send(new UpdateOrderStatusCommand(id, body.Status), ct);
        return NoContent();
    }

    [HttpPatch("orders/{id:guid}/payment-proof/approve")]
    public async Task<IActionResult> ApproveProof(Guid id, CancellationToken ct)
    {
        if (!ValidateSecret())
            return Unauthorized(ApiResponse<string>.Fail("Ruxsat yo'q."));

        await mediator.Send(new ApprovePaymentProofCommand(id), ct);
        return NoContent();
    }

    [HttpPatch("orders/{id:guid}/payment-proof/reject")]
    public async Task<IActionResult> RejectProof(
        Guid id,
        [FromBody] BotRejectRequest body,
        CancellationToken ct)
    {
        if (!ValidateSecret())
            return Unauthorized(ApiResponse<string>.Fail("Ruxsat yo'q."));

        await mediator.Send(new RejectPaymentProofCommand(id, body.AdminNote), ct);
        return NoContent();
    }
}

public record BotStatusUpdateRequest(OrderStatus Status);
public record BotRejectRequest(string? AdminNote);
