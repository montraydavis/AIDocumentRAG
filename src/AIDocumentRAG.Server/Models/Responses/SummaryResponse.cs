



namespace AIDocumentRAG.Server.Models.Responses
{
    public record SummaryResponse(
        string FileName,
        string Summary,
        DateTime GeneratedAt);
}