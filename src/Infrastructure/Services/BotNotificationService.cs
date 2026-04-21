using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;

namespace UzMarket.Infrastructure.Services;

public class BotNotificationService(
    IHttpClientFactory httpClientFactory,
    IConfiguration config,
    ILogger<BotNotificationService> logger)
    : IBotNotificationService
{
    private readonly string _botBaseUrl = config["BotBaseUrl"] ?? "http://bot:8080";
    private readonly string _botSecret = config["BotSecret"] ?? string.Empty;

    public async Task NotifyNewOrderAsync(Order order, CancellationToken ct = default)
    {
        var payload = new
        {
            orderId = order.Id,
            orderNumber = order.OrderNumber,
            customerName = order.CustomerName,
            customerPhone = order.CustomerPhone,
            deliveryAddress = order.DeliveryAddress,
            paymentMethod = order.PaymentMethod.ToString(),
            totalAmount = order.TotalAmount,
            notes = order.Notes,
            items = order.Items.Select(i => new
            {
                productName = i.Product?.Name ?? "—",
                quantity = i.Quantity,
                unitPrice = i.UnitPrice,
                total = i.Total
            })
        };

        await PostAsync("/internal/orders/notify", payload, ct);
    }

    public async Task NotifyPaymentProofAsync(Order order, PaymentProof proof, CancellationToken ct = default)
    {
        var payload = new
        {
            orderId = order.Id,
            orderNumber = order.OrderNumber,
            customerName = order.CustomerName,
            totalAmount = order.TotalAmount,
            proofId = proof.Id,
            fileUrl = proof.FileUrl,
            fileType = proof.FileType.ToString()
        };

        await PostAsync("/internal/payment-proof/notify", payload, ct);
    }

    private async Task PostAsync(string path, object payload, CancellationToken ct)
    {
        try
        {
            var client = httpClientFactory.CreateClient("bot");
            var json = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");
            content.Headers.Add("X-Bot-Secret", _botSecret);

            var response = await client.PostAsync($"{_botBaseUrl}{path}", content, ct);
            if (!response.IsSuccessStatusCode)
                logger.LogWarning("Bot notification failed: {Path} → {Status}", path, response.StatusCode);
        }
        catch (Exception ex)
        {
            // Bot unavailable must not break the order flow
            logger.LogError(ex, "Bot notification error: {Path}", path);
        }
    }
}
