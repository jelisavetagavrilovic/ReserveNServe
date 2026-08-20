namespace Payment.API.Enums
{
    public enum PaymentStatus
    {
        PaymentPending = 0,
        PaymentSucceeded = 1,
        PaymentFailed = 2,
        RefundPending = 3,
        RefundSucceeded = 4,
        RefundFailed = 5
    }
}
