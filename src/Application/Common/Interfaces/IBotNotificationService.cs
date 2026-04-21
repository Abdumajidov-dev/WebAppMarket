using UzMarket.Domain.Entities;

namespace UzMarket.Application.Common.Interfaces;

public interface IBotNotificationService
{
    Task NotifyNewOrderAsync(Order order, CancellationToken ct = default);
    Task NotifyPaymentProofAsync(Order order, PaymentProof proof, CancellationToken ct = default);
}
