using UzMarket.Domain.Enums;

namespace UzMarket.Domain.Entities;

public class Order : TenantEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public PaymentMethod PaymentMethod { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }

    public ICollection<OrderItem> Items { get; set; } = [];
    public ICollection<PaymentProof> PaymentProofs { get; set; } = [];
}
