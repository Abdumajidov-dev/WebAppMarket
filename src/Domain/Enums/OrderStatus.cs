namespace UzMarket.Domain.Enums;

public enum OrderStatus
{
    Pending = 0,
    Confirmed = 1,
    Processing = 2,
    Shipped = 3,
    Delivered = 4,
    Cancelled = 5
}

public enum PaymentMethod
{
    Cash = 0,
    Payme = 1,
    Click = 2,
    CardTransfer = 3
}

public enum PaymentStatus
{
    Pending = 0,
    AwaitingProof = 1,
    ProofSubmitted = 2,
    Paid = 3,
    Failed = 4
}

public enum PaymentProofStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public enum PaymentProofFileType
{
    Image = 0,
    Pdf = 1
}
