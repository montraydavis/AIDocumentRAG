


namespace AIDocumentRAG.Server.Models.Responses
{
    public record StatusResponse(
        bool IsInitialized,
        int FileCount,
        DateTime? LastInitialized,
        string? CurrentSourcePath = null,
        string? CurrentDestinationPath = null);
}
