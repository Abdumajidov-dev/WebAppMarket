using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;

namespace UzMarket.Application.Features.Auth.Commands;

public record LogoutCommand(string RefreshToken) : IRequest;

public class LogoutCommandHandler(IAppDbContext db, IPasswordHasher hasher) : IRequestHandler<LogoutCommand>
{
    public async Task Handle(LogoutCommand request, CancellationToken ct)
    {
        var candidates = await db.RefreshTokens
            .Where(t => t.ExpiresAt > DateTime.UtcNow && t.RevokedAt == null)
            .ToListAsync(ct);

        var stored = candidates.FirstOrDefault(t =>
            hasher.Verify(request.RefreshToken, t.TokenHash));

        if (stored is null) return;

        stored.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
