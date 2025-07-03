namespace AIDocumentRAG.Server.Core.FileManagement
{
    using AIDocumentRAG.Server.Models;

    public interface IDirectoryCopier
    {
        Task<IEnumerable<FileMetadata>> CopyDirectoryAsync(string sourcePath, string destinationPath);
    }
}
