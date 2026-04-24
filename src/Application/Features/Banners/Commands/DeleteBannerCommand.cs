using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Banners.Commands;

public record DeleteBannerCommand(Guid Id) : IRequest;

public class DeleteBannerCommandHandler(IAppDbContext db, IFileStorageService storage)
    : IRequestHandler<DeleteBannerCommand>
{
    public async Task Handle(DeleteBannerCommand request, CancellationToken ct)
    {
        var banner = await db.Banners.FirstOrDefaultAsync(b => b.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Banner), request.Id);

        if (!string.IsNullOrEmpty(banner.ImageUrl))
            await storage.DeleteAsync(banner.ImageUrl, ct);

        banner.IsDeleted = true;
        banner.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
