using Payment.API.Enums;

namespace Payment.API.Messaging;

public interface IPaymentStatusPublisher
{
    Task PublishAsync(string reservationId, PaymentStatus status, string? receiptUrl = null);
}