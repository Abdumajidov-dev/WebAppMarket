using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Auth.Commands;

public record RefreshTokenCommand(string RefreshToken) : IRequest<string>;

public class RefreshTokenCommandHandler(IAppDbContext db, IJwtService jwt, IPasswordHasher hasher)
    : IRequestHandler<RefreshTokenCommand, string>
{
    public async Task<string> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        var candidates = await db.RefreshTokens
            .Include(t => t.User)
            .Where(t => t.ExpiresAt > DateTime.UtcNow && t.RevokedAt == null)
            .ToListAsync(ct);

        var stored = candidates.FirstOrDefault(t =>
            hasher.Verify(request.RefreshToken, t.TokenHash))
            ?? throw new ForbiddenException("Refresh token yaroqsiz.");

        stored.RevokedAt = DateTime.UtcNow;

        var newRaw = jwt.GenerateRefreshToken();
        db.RefreshTokens.Add(new Domain.Entities.RefreshToken
        {
            UserId = stored.UserId,
            TokenHash = hasher.Hash(newRaw),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await db.SaveChangesAsync(ct);

        return jwt.GenerateAccessToken(stored.User);
    }
}
