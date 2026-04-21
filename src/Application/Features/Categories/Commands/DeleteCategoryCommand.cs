using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Categories.Commands;

public record DeleteCategoryCommand(Guid Id) : IRequest;

public class DeleteCategoryCommandHandler(IAppDbContext db)
    : IRequestHandler<DeleteCategoryCommand>
{
    public async Task Handle(DeleteCategoryCommand request, CancellationToken ct)
    {
        var category = await db.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Category), request.Id);

        var hasChildren = await db.Categories.AnyAsync(c => c.ParentId == request.Id, ct);
        if (hasChildren)
            throw new ConflictException("Avval ichki kategoriyalarni o'chiring.");

        var hasProducts = await db.Products.AnyAsync(p => p.CategoryId == request.Id, ct);
        if (hasProducts)
            throw new ConflictException("Kategoriyada mahsulotlar mavjud. Avval ularni o'chiring yoki ko'chiring.");

        category.IsDeleted = true;
        category.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}
