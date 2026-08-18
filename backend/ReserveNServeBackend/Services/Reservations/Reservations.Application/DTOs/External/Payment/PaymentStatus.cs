namespace Reservations.Application.DTOs.External.Payment;

public enum PaymentStatus
{
    PaymentPending,
    PaymentSucceeded,
    PaymentFailed,
    RefundPending,
    RefundSucceeded,
    RefundFailed
}