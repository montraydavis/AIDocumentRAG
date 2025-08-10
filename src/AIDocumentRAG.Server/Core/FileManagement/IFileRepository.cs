namespace AIDocumentRAG.Server.Core.FileManagement
{
    using AIDocumentRAG.Server.Models;

    public interface IFileRepository
    {
        Task<IEnumerable<FileMetadata>> GetAllFilesAsync();
        Task<FileMetadata?> GetFileByNameAsync(string fileName);
        Task<string> GetFileContentAsync(string fileName);
        Task<bool> RemoveFileAsync(string fileName);
        Task<bool> AddFileAsync(FileMetadata file);
        Task<FileMetadata?> RenameFileAsync(string oldFileName, string newFileName);
        string GetDestinationDirectory();
    }
}
