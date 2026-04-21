using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Payment.Commands;
using UzMarket.Application.Features.Payment.Queries;
using UzMarket.Application.Features.Shop.Commands;
using UzMarket.Application.Features.Shop.Queries;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace UzMarket.Api.Controllers;

[ApiController]
[Route("api/v1/shop")]
[Authorize]
public class ShopController(IMediator mediator, IAppDbContext db, ITenantContext tenant, IFileStorageService storage)
    : ControllerBase
{
    [HttpGet("settings")]
    [HttpGet("info")]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        var result = await mediator.Send(new GetShopSettingsQuery(), ct);
        return Ok(ApiResponse<ShopSettingsDto>.Ok(result));
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings(
        [FromBody] UpdateShopSettingsCommand command, CancellationToken ct)
    {
        await mediator.Send(command, ct);
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var result = await mediator.Send(new GetShopStatsQuery(), ct);
        return Ok(ApiResponse<ShopStatsDto>.Ok(result));
    }

    [HttpGet("payment-settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPaymentSettings(CancellationToken ct)
    {
        var result = await mediator.Send(new GetPaymentSettingsQuery(), ct);
        return Ok(ApiResponse<PaymentSettingsDto?>.Ok(result));
    }

    [HttpPut("payment-settings")]
    public async Task<IActionResult> UpdatePaymentSettings(
        [FromBody] UpdatePaymentSettingsCommand command, CancellationToken ct)
    {
        await mediator.Send(command, ct);
        return NoContent();
    }

    [HttpPost("logo")]
    [RequestSizeLimit(2 * 1024 * 1024)]
    public async Task<IActionResult> UploadLogo(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("Fayl tanlanmagan."));

        var allowed = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowed.Contains(file.ContentType))
            return BadRequest(ApiResponse<string>.Fail("Faqat JPG, PNG, WebP qabul qilinadi."));

        var shop = await db.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenant.TenantId, ct)
            ?? throw new NotFoundException(nameof(Tenant), tenant.TenantId);

        if (!string.IsNullOrEmpty(shop.LogoUrl))
            await storage.DeleteAsync(shop.LogoUrl, ct);

        var url = await storage.UploadAsync(file.OpenReadStream(), file.FileName, file.ContentType, tenant.Slug, "banner", ct);
        shop.LogoUrl = url;
        shop.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { logoUrl = url }));
    }
}
