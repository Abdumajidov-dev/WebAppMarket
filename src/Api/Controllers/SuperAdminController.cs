using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Common.Models;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Enums;
using UzMarket.Infrastructure.Persistence;

namespace UzMarket.Api.Controllers;

[ApiController]
[Route("api/v1/superadmin")]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminController(AppDbContext db, IPasswordHasher hasher) : ControllerBase
{
    // ── Auth: superadmin login handled via /auth/login with X-Tenant-Slug: platform

    // ── Stats ──────────────────────────────────────────────────────────────
    [HttpGet("stats")]
    public async Task<IActionResult> Stats(CancellationToken ct)
    {
        var tenants = await db.Tenants.IgnoreQueryFilters()
            .Where(t => t.Slug != "platform" && !t.IsDeleted)
            .ToListAsync(ct);

        var stats = new
        {
            totalTenants = tenants.Count,
            activeTenants = tenants.Count(t => t.IsActive),
            trialTenants = tenants.Count(t => t.SubscriptionStatus == SubscriptionStatus.Trial),
            activeSubs = tenants.Count(t => t.SubscriptionStatus == SubscriptionStatus.Active),
            suspended = tenants.Count(t => t.SubscriptionStatus == SubscriptionStatus.Suspended),
        };

        return Ok(ApiResponse<object>.Ok(stats));
    }

    // ── Tenants list ───────────────────────────────────────────────────────
    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var query = db.Tenants.IgnoreQueryFilters()
            .Where(t => t.Slug != "platform" && !t.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(t =>
                t.ShopName.Contains(search) ||
                t.Phone.Contains(search) ||
                t.Slug.Contains(search));

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                t.Id, t.Slug, t.ShopName, t.OwnerName, t.Phone,
                t.IsActive, t.SubscriptionStatus, t.SubscriptionEndsAt,
                t.CreatedAt,
            })
            .ToListAsync(ct);

        return Ok(PagedResponse<object>.Ok(items!, page, pageSize, total));
    }

    // ── Create tenant + owner ──────────────────────────────────────────────
    [HttpPost("tenants")]
    public async Task<IActionResult> CreateTenant(
        [FromBody] CreateTenantRequest req,
        CancellationToken ct)
    {
        var slugExists = await db.Tenants.IgnoreQueryFilters()
            .AnyAsync(t => t.Slug == req.Slug, ct);
        if (slugExists)
            return BadRequest(ApiResponse<string>.Fail("Bu slug band."));

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Slug = req.Slug.ToLower().Trim(),
            ShopName = req.ShopName,
            OwnerName = req.OwnerName,
            Phone = req.Phone,
            PrimaryColor = req.PrimaryColor ?? "#2563EB",
            SubscriptionStatus = SubscriptionStatus.Trial,
            SubscriptionEndsAt = DateTime.UtcNow.AddDays(req.TrialDays),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Phone = req.Phone,
            PasswordHash = hasher.Hash(req.Password),
            Role = UserRole.Owner,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        db.Tenants.Add(tenant);
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { tenant.Id, tenant.Slug, tenant.ShopName }));
    }

    // ── Toggle active ──────────────────────────────────────────────────────
    [HttpPatch("tenants/{id:guid}/toggle")]
    public async Task<IActionResult> ToggleTenant(Guid id, CancellationToken ct)
    {
        var tenant = await db.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == id, ct);
        if (tenant is null) return NotFound();

        tenant.IsActive = !tenant.IsActive;
        tenant.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { tenant.Id, tenant.IsActive }));
    }

    // ── Update subscription ────────────────────────────────────────────────
    [HttpPatch("tenants/{id:guid}/subscription")]
    public async Task<IActionResult> UpdateSubscription(
        Guid id,
        [FromBody] UpdateSubscriptionRequest req,
        CancellationToken ct)
    {
        var tenant = await db.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == id, ct);
        if (tenant is null) return NotFound();

        tenant.SubscriptionStatus = req.Status;
        tenant.SubscriptionEndsAt = req.EndsAt;
        tenant.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(ApiResponse<string>.Ok("Yangilandi."));
    }

    // ── Delete (soft) ──────────────────────────────────────────────────────
    [HttpDelete("tenants/{id:guid}")]
    public async Task<IActionResult> DeleteTenant(Guid id, CancellationToken ct)
    {
        var tenant = await db.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == id, ct);
        if (tenant is null) return NotFound();

        tenant.IsDeleted = true;
        tenant.IsActive = false;
        tenant.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(ApiResponse<string>.Ok("O'chirildi."));
    }
}

public record CreateTenantRequest(
    string Slug,
    string ShopName,
    string OwnerName,
    string Phone,
    string Password,
    string? PrimaryColor,
    int TrialDays = 30);

public record UpdateSubscriptionRequest(
    SubscriptionStatus Status,
    DateTime? EndsAt);
