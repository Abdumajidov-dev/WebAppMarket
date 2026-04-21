using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;
#pragma warning disable CS8618

namespace UzMarket.Application.Features.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult>;

public record LoginResult(string AccessToken, string RefreshToken, UserDto User);

public record UserDto(Guid Id, string Email, string Role, Guid TenantId);

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
    }
}

public class LoginCommandHandler(
    IAppDbContext db,
    IJwtService jwt,
    IPasswordHasher hasher)
    : IRequestHandler<LoginCommand, LoginResult>
{
    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower(), ct)
            ?? throw new NotFoundException(nameof(User), request.Email);

        if (!hasher.Verify(request.Password, user.PasswordHash))
            throw new ForbiddenException("Email yoki parol noto'g'ri.");

        var accessToken = jwt.GenerateAccessToken(user);
        var refreshTokenRaw = jwt.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hasher.Hash(refreshTokenRaw),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync(ct);

        return new LoginResult(
            accessToken,
            refreshTokenRaw,
            new UserDto(user.Id, user.Email, user.Role.ToString(), user.TenantId));
    }
}
