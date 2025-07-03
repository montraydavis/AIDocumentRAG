namespace AIDocumentRAG.Server.Services.FileManagement
{
    using AIDocumentRAG.Server.Core.FileManagement;
    using AIDocumentRAG.Server.Models;

    public class FileManagementService
    {
        private readonly IDirectoryCopier _directoryCopier;

        public FileManagementService(IDirectoryCopier directoryCopier)
        {
            this._directoryCopier = directoryCopier;
        }

        public async Task<IFileRepository> InitializeAsync(string sourcePath, string destinationPath)
        {
            IEnumerable<FileMetadata> files = await this._directoryCopier.CopyDirectoryAsync(sourcePath, destinationPath);
            return new FileRepository(files);
        }
    }
}
