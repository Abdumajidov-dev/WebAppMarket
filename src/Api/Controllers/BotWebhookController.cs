using MediatR;
using Microsoft.AspNetCore.Mvc;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Orders.Commands;
using UzMarket.Domain.Enums;

namespace UzMarket.Api.Controllers;

[ApiController]
[Route("internal")]
public class BotWebhookController(IMediator mediator, IConfiguration config) : ControllerBase
{
    private bool ValidateSecret() =>
        Request.Headers.TryGetValue("X-Bot-Secret", out var val) &&
        val == config["BotSecret"];

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
