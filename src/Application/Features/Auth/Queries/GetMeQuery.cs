using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Features.Auth.Commands;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Auth.Queries;

public record GetMeQuery : IRequest<UserDto>;

public class GetMeQueryHandler(IAppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetMeQuery, UserDto>
{
    public async Task<UserDto> Handle(GetMeQuery request, CancellationToken ct)
    {
        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == currentUser.UserId, ct)
            ?? throw new NotFoundException(nameof(User), currentUser.UserId);

        return new UserDto(user.Id, user.Phone, user.Role.ToString(), user.TenantId);
    }
}
