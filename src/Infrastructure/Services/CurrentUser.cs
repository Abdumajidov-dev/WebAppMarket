using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using UzMarket.Application.Common.Interfaces;

namespace UzMarket.Infrastructure.Services;

public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? User => accessor.HttpContext?.User;

    public Guid UserId =>
        Guid.TryParse(User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User?.FindFirstValue("sub"), out var id) ? id : Guid.Empty;

    public Guid TenantId =>
        Guid.TryParse(User?.FindFirstValue("tenantId"), out var id) ? id : Guid.Empty;

    public string Role => User?.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;
}
