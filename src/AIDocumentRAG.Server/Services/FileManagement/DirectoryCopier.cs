namespace AIDocumentRAG.Server.Services.FileManagement
{
    using AIDocumentRAG.Server.Core.FileManagement;
    using AIDocumentRAG.Server.Models;

    public class DirectoryCopier : IDirectoryCopier
    {
        private readonly IFileProcessor _fileProcessor;

        public DirectoryCopier(IFileProcessor fileProcessor)
        {
            this._fileProcessor = fileProcessor;
        }

        public async Task<IEnumerable<FileMetadata>> CopyDirectoryAsync(string sourcePath, string destinationPath)
        {
            if (!Directory.Exists(sourcePath))
            {
                throw new DirectoryNotFoundException($"Source directory not found: {sourcePath}");
            }

            Directory.CreateDirectory(destinationPath);

            string[] files = Directory.GetFiles(sourcePath, "*", SearchOption.AllDirectories);
            IEnumerable<Task<FileMetadata>> tasks = files.Select(async file =>
            {
                string relativePath = Path.GetRelativePath(sourcePath, file);
                string destPath = Path.Combine(destinationPath, Path.GetDirectoryName(relativePath) ?? "");
                Directory.CreateDirectory(destPath);

                return await this._fileProcessor.ProcessFileAsync(file, destPath);
            });

            return await Task.WhenAll(tasks);
        }
    }
}
