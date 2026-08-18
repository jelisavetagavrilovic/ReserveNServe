namespace Payment.API.Data
{
    public interface IPaymentsContext
    {
        IEnumerable<Entities.Payment> Payments { get; }
    }
}
