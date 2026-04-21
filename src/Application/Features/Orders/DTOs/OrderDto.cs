namespace UzMarket.Application.Features.Orders.DTOs;

public record OrderDto(
    Guid Id,
    string OrderNumber,
    string CustomerName,
    string CustomerPhone,
    string Status,
    string PaymentMethod,
    string PaymentStatus,
    decimal TotalAmount,
    int ItemCount,
    DateTime CreatedAt
);

public record OrderDetailDto(
    Guid Id,
    string OrderNumber,
    string CustomerName,
    string CustomerPhone,
    string DeliveryAddress,
    string Status,
    string PaymentMethod,
    string PaymentStatus,
    decimal TotalAmount,
    string? Notes,
    List<OrderItemDto> Items,
    PaymentProofDto? LatestProof,
    DateTime CreatedAt
);

public record OrderItemDto(
    Guid ProductId,
    string ProductName,
    string? ProductImageUrl,
    int Quantity,
    decimal UnitPrice,
    decimal Total
);

public record PaymentProofDto(
    Guid Id,
    string FileUrl,
    string FileType,
    string Status,
    string? AdminNote,
    DateTime CreatedAt
);

public record PlaceOrderItemRequest(
    Guid ProductId,
    int Quantity
);
