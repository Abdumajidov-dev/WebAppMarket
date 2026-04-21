using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Orders.Commands;
using UzMarket.Application.Features.Orders.DTOs;
using UzMarket.Application.Features.Orders.Queries;
using UzMarket.Domain.Enums;

namespace UzMarket.Api.Controllers;

[ApiController]
[Route("api/v1/orders")]
public class OrdersController(IMediator mediator, IAppDbContext db) : ControllerBase
{
    // Bot: get orders by customer phone
    [HttpGet("customer")]
    public async Task<IActionResult> GetCustomerOrders(
        [FromQuery] string? phone,
        [FromQuery] bool activeOnly = false,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return Ok(ApiResponse<object>.Ok(new { items = Array.Empty<object>(), total = 0 }));

        var query = db.Orders
            .AsNoTracking()
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

    // Bot: get shop contact for a given order (uses TenantId to look up Tenant)
    [HttpGet("{id:guid}/tenant-contact")]
    public async Task<IActionResult> GetTenantContact(Guid id, CancellationToken ct)
    {
        var order = await db.Orders
            .AsNoTracking()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order is null) return NotFound();

        var tenant = await db.Tenants
            .AsNoTracking()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == order.TenantId, ct);

        if (tenant is null) return NotFound();

        return Ok(ApiResponse<object>.Ok(new
        {
            shopName = tenant.ShopName,
            phone = tenant.Phone,
            telegramChatId = tenant.TelegramChatId
        }));
    }


    [HttpPost]
    public async Task<IActionResult> Place([FromBody] PlaceOrderCommand command, CancellationToken ct)
    {
        var orderNumber = await mediator.Send(command, ct);
        return Ok(ApiResponse<object>.Ok(new { orderNumber }, "Buyurtma qabul qilindi."));
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetOrdersQuery(page, pageSize, status, from, to, search), ct);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetOrderByIdQuery(id), ct);
        return Ok(ApiResponse<OrderDetailDto>.Ok(result));
    }

    [HttpGet("track/{orderNumber}")]
    public async Task<IActionResult> Track(string orderNumber, CancellationToken ct)
    {
        var result = await mediator.Send(new TrackOrderQuery(orderNumber), ct);
        return Ok(ApiResponse<OrderDetailDto>.Ok(result));
    }

    [Authorize]
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateStatusRequest body,
        CancellationToken ct)
    {
        await mediator.Send(new UpdateOrderStatusCommand(id, body.Status), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/payment-proof")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> SubmitProof(
        Guid id,
        IFormFile file,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("Fayl tanlanmagan."));

        var result = await mediator.Send(
            new SubmitPaymentProofCommand(id, file.OpenReadStream(), file.FileName, file.ContentType), ct);

        return Ok(ApiResponse<PaymentProofDto>.Ok(result));
    }

    [Authorize]
    [HttpPatch("{id:guid}/payment-proof/approve")]
    public async Task<IActionResult> ApproveProof(Guid id, CancellationToken ct)
    {
        await mediator.Send(new ApprovePaymentProofCommand(id), ct);
        return NoContent();
    }

    [Authorize]
    [HttpPatch("{id:guid}/payment-proof/reject")]
    public async Task<IActionResult> RejectProof(
        Guid id,
        [FromBody] RejectProofRequest body,
        CancellationToken ct)
    {
        await mediator.Send(new RejectPaymentProofCommand(id, body.AdminNote), ct);
        return NoContent();
    }
}

public record UpdateStatusRequest(OrderStatus Status);
public record RejectProofRequest(string? AdminNote);
