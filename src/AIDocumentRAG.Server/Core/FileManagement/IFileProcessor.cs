namespace AIDocumentRAG.Server.Core.FileManagement
{
    using AIDocumentRAG.Server.Models;

    public interface IFileProcessor
    {
        Task<FileMetadata> ProcessFileAsync(string sourcePath, string destinationPath);
    }
}
