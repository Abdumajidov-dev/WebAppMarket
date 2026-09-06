namespace UzMarket.Application.Features.Notifications.DTOs;

public record NotificationDto(
    Guid Id,
    string Type,
    string Title,
    string Message,
    Guid? OrderId,
    bool IsRead,
    DateTime CreatedAt
);
