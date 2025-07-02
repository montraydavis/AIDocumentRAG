namespace AIDocumentRAG.Server.Models.Responses
{
    public record InitializeResponse(
        bool Success,
        int FileCount,
        string Message,
        IEnumerable<string>? Errors = null);
}