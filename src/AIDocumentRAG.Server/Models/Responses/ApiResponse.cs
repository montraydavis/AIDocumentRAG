



namespace AIDocumentRAG.Server.Models.Responses
{
    public record ApiResponse<T>(
        bool Success,
        T? Data = default,
        string? Message = null,
        IEnumerable<string>? Errors = null);
}