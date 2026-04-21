using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Payment.Commands;
using UzMarket.Application.Features.Payment.Queries;

namespace UzMarket.Api.Controllers;

[ApiController]
[Route("api/v1/payment-settings")]
public class PaymentController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var result = await mediator.Send(new GetPaymentSettingsQuery(), ct);
        return Ok(ApiResponse<PaymentSettingsDto?>.Ok(result));
    }

    [Authorize]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdatePaymentSettingsCommand command, CancellationToken ct)
    {
        await mediator.Send(command, ct);
        return NoContent();
    }
}
