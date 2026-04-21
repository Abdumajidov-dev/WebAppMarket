namespace UzMarket.Domain.Exceptions;

public class DomainException(string message) : Exception(message);

public class NotFoundException(string entity, object key)
    : DomainException($"{entity} with key '{key}' was not found.");

public class ForbiddenException(string message = "Access denied.")
    : DomainException(message);

public class ConflictException(string message) : DomainException(message);
