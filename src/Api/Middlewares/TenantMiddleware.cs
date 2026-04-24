using Microsoft.EntityFrameworkCore;
using UzMarket.Infrastructure.Persistence;
using UzMarket.Infrastructure.Services;

namespace UzMarket.Api.Middlewares;

public class TenantMiddleware(RequestDelegate next)
{
    private static readonly string[] _skipPaths = ["/health", "/swagger", "/favicon.ico", "/api/v1/superadmin", "/internal"];

    public async Task InvokeAsync(HttpContext context, AppDbContext db, TenantContext tenantContext)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (_skipPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await next(context);
            return;
        }

        var host = context.Request.Host.Host;
        var slug = host.Split('.')[0];

        // Header override: dev (localhost/IP) or subdomain-less access
        var headerSlug = context.Request.Headers["X-Tenant-Slug"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(headerSlug))
            slug = headerSlug;

        var tenant = await db.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive);

        if (tenant is null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            await context.Response.WriteAsJsonAsync(new { error = "Do'kon topilmadi" });
            return;
        }

        tenantContext.Set(tenant);
        await next(context);
    }
}
