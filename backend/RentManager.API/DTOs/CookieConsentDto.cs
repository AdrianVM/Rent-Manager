namespace RentManager.API.DTOs;

public class CookieConsentDto
{
    public bool StrictlyNecessary { get; set; } = true;
    public bool Functional { get; set; }
    public bool Performance { get; set; }
    public bool Marketing { get; set; }
}

public class SaveCookieConsentRequest
{
    public bool Functional { get; set; }
    public bool Performance { get; set; }
    public bool Marketing { get; set; }
    public string? ConsentToken { get; set; }
}

public class CookieConsentResponse
{
    public bool StrictlyNecessary { get; set; }
    public bool Functional { get; set; }
    public bool Performance { get; set; }
    public bool Marketing { get; set; }
    public DateTimeOffset ConsentDate { get; set; }
    public DateTimeOffset ExpiryDate { get; set; }
    public string PolicyVersion { get; set; } = string.Empty;
}
