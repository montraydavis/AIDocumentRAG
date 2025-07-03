



namespace AIDocumentRAG.Server.Models.Responses
{
    public record DocumentSummaryDto(
        string FileName,
        string Summary,
        DateTime GeneratedAt,
        int TokenCount);
}