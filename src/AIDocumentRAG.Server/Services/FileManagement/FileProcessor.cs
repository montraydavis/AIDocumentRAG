namespace AIDocumentRAG.Server.Services.FileManagement
{
    using AIDocumentRAG.Server.Core.ChatInference;
    using AIDocumentRAG.Server.Core.FileManagement;
    using AIDocumentRAG.Server.Models;

    public class FileProcessor : IFileProcessor
    {
        private readonly IDocumentSummaryService _summaryService;
        private readonly ILogger<FileProcessor> _logger;

        public FileProcessor(IDocumentSummaryService summaryService, ILogger<FileProcessor> logger)
        {
            this._summaryService = summaryService;
            this._logger = logger;
        }

        public async Task<FileMetadata> ProcessFileAsync(string sourcePath, string destinationPath)
        {
            FileInfo fileInfo = new FileInfo(sourcePath);
            string fileName = fileInfo.Name;
            string copiedPath = Path.Combine(destinationPath, fileName);

            File.Copy(sourcePath, copiedPath, overwrite: true);

            string content = await File.ReadAllTextAsync(copiedPath);

            // Auto-generate summary for supported file types (non-blocking)
            if (IsSupportedForSummary(fileInfo.Extension))
            {
                try
                {
                    this._summaryService.GenerateSummaryInBackground(content, fileName);
                    this._logger.LogInformation("Started background summary generation for {FileName}", fileName);
                }
                catch (Exception ex)
                {
                    this._logger.LogWarning(ex, "Failed to start background summary generation for {FileName}", fileName);
                }
            }

            return new FileMetadata(
                OriginalPath: sourcePath,
                CopiedPath: copiedPath,
                FileName: fileName,
                CreationDate: fileInfo.CreationTime,
                ModifiedDate: fileInfo.LastWriteTime,
                FileSize: fileInfo.Length,
                CharacterCount: content.Length,
                FileExtension: fileInfo.Extension);
        }

        private static bool IsSupportedForSummary(string extension) =>
            extension.ToLowerInvariant() switch
            {
                ".txt" or ".md" or ".doc" or ".docx" or ".pdf" => true,
                _ => false
            };
    }
}
