namespace AIDocumentRAG.Server.Models.Requests
{
    public record InitializeRequest(
        string SourcePath,
        string? DestinationPath = null);
}