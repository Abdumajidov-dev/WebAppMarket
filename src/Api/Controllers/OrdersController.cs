using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Orders.Commands;
using UzMarket.Application.Features.Orders.DTOs;
using UzMarket.Application.Features.Orders.Queries;
using UzMarket.Domain.Enums;

namespace UzMarket.Api.Controllers;

[ApiController]
[Route("api/v1/orders")]
public class OrdersController(IMediator mediator) : ControllerBase
{
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
