



namespace AIDocumentRAG.Server.Models.Responses
{
    public record MultipleSummariesResponse(
        IEnumerable<DocumentSummaryDto> Summaries,
        int TotalDocuments);
}