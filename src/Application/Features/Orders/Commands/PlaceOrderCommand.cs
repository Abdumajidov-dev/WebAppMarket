using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Features.Orders.DTOs;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Enums;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Orders.Commands;

public record PlaceOrderCommand(
    string CustomerName,
    string CustomerPhone,
    string DeliveryAddress,
    PaymentMethod PaymentMethod,
    string? Notes,
    List<PlaceOrderItemRequest> Items
) : IRequest<string>;

public class PlaceOrderCommandValidator : AbstractValidator<PlaceOrderCommand>
{
    public PlaceOrderCommandValidator()
    {
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.CustomerPhone)
            .NotEmpty()
            .Matches(@"^\+998\d{9}$")
            .WithMessage("Telefon raqam +998XXXXXXXXX formatida bo'lsin.");
        RuleFor(x => x.DeliveryAddress).NotEmpty();
        RuleFor(x => x.Items).NotEmpty().WithMessage("Kamida bitta mahsulot bo'lishi kerak.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.Quantity).GreaterThan(0);
            item.RuleFor(i => i.ProductId).NotEmpty();
        });
    }
}

public class PlaceOrderCommandHandler(
    IAppDbContext db,
    ITenantContext tenant,
    IBotNotificationService bot)
    : IRequestHandler<PlaceOrderCommand, string>
{
    public async Task<string> Handle(PlaceOrderCommand request, CancellationToken ct)
    {
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await db.Products
            .Where(p => productIds.Contains(p.Id) && p.IsActive)
            .ToListAsync(ct);

        if (products.Count != productIds.Count)
            throw new NotFoundException("Mahsulot", "bitta yoki bir nechta mahsulot topilmadi.");

        var orderItems = new List<OrderItem>();
        decimal total = 0;

        foreach (var req in request.Items)
        {
            var product = products.First(p => p.Id == req.ProductId);

            if (product.StockQuantity < req.Quantity)
                throw new ConflictException(
                    $"'{product.Name}' mahsulotidan faqat {product.StockQuantity} ta qolgan.");

            var unitPrice = product.DiscountPrice ?? product.Price;
            var lineTotal = unitPrice * req.Quantity;

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = req.Quantity,
                UnitPrice = unitPrice,
                Total = lineTotal
            });

            total += lineTotal;
            product.StockQuantity -= req.Quantity;
        }

        var orderNumber = await GenerateOrderNumberAsync(ct);
        var paymentStatus = request.PaymentMethod == PaymentMethod.CardTransfer
            ? PaymentStatus.AwaitingProof
            : PaymentStatus.Pending;

        var order = new Order
        {
            TenantId = tenant.TenantId,
            OrderNumber = orderNumber,
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            DeliveryAddress = request.DeliveryAddress,
            PaymentMethod = request.PaymentMethod,
            PaymentStatus = paymentStatus,
            TotalAmount = total,
            Notes = request.Notes,
            Items = orderItems
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        // Load navigation props for bot notification
        foreach (var item in order.Items)
            item.Product = products.First(p => p.Id == item.ProductId);

        await bot.NotifyNewOrderAsync(order, ct);

        return orderNumber;
    }

    private async Task<string> GenerateOrderNumberAsync(CancellationToken ct)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"ORD-{year}-";

        var last = await db.Orders
            .Where(o => o.OrderNumber.StartsWith(prefix))
            .OrderByDescending(o => o.OrderNumber)
            .Select(o => o.OrderNumber)
            .FirstOrDefaultAsync(ct);

        var next = 1;
        if (last is not null &&
            int.TryParse(last.Replace(prefix, ""), out var n))
            next = n + 1;

        return $"{prefix}{next:D5}";
    }
}
