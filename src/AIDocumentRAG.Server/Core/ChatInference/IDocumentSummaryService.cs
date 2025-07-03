namespace AIDocumentRAG.Server.Core.ChatInference
{
    using AIDocumentRAG.Server.Models.Responses;

    public interface IDocumentSummaryService
    {
        Task<string> GenerateSummaryAsync(string content, string fileName);
        Task<DocumentSummaryDto?> GetSummaryAsync(string fileName);
        Task<IEnumerable<DocumentSummaryDto>> GetMultipleSummariesAsync(IEnumerable<string> fileNames);
        void GenerateSummaryInBackground(string content, string fileName);
    }
}
