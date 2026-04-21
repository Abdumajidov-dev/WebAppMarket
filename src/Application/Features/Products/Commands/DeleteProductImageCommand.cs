using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Products.Commands;

public record DeleteProductImageCommand(Guid ProductId, Guid ImageId) : IRequest;

public class DeleteProductImageCommandHandler(IAppDbContext db, IFileStorageService storage)
    : IRequestHandler<DeleteProductImageCommand>
{
    public async Task Handle(DeleteProductImageCommand request, CancellationToken ct)
    {
        var image = await db.ProductImages
            .FirstOrDefaultAsync(i => i.Id == request.ImageId && i.ProductId == request.ProductId, ct)
            ?? throw new NotFoundException(nameof(ProductImage), request.ImageId);

        await storage.DeleteAsync(image.Url, ct);
        db.ProductImages.Remove(image);

        // If deleted image was primary, promote next image
        if (image.IsPrimary)
        {
            var next = await db.ProductImages
                .Where(i => i.ProductId == request.ProductId && i.Id != request.ImageId)
                .OrderBy(i => i.SortOrder)
                .FirstOrDefaultAsync(ct);

            if (next is not null)
                next.IsPrimary = true;
        }

        await db.SaveChangesAsync(ct);
    }
}
