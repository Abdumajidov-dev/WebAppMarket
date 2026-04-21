using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Categories.Commands;

public record UpdateCategoryCommand(
    Guid Id,
    string Name,
    Guid? ParentId,
    int SortOrder
) : IRequest;

public class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}

public class UpdateCategoryCommandHandler(IAppDbContext db)
    : IRequestHandler<UpdateCategoryCommand>
{
    public async Task Handle(UpdateCategoryCommand request, CancellationToken ct)
    {
        var category = await db.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Category), request.Id);

        if (request.ParentId.HasValue)
        {
            if (request.ParentId == request.Id)
                throw new ConflictException("Kategoriya o'ziga parent bo'la olmaydi.");

            var parentExists = await db.Categories.AnyAsync(c => c.Id == request.ParentId, ct);
            if (!parentExists) throw new NotFoundException(nameof(Category), request.ParentId);
        }

        category.Name = request.Name;
        category.ParentId = request.ParentId;
        category.SortOrder = request.SortOrder;
        category.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}
