namespace AIDocumentRAG.Server.Services.FileManagement
{
    using AIDocumentRAG.Server.Core.FileManagement;
    using AIDocumentRAG.Server.Models;

    public class FileRepository : IFileRepository
    {
        private readonly Dictionary<string, FileMetadata> _files;

        public FileRepository(IEnumerable<FileMetadata> files)
        {
            this._files = files.ToDictionary(f => f.FileName, f => f);
        }

        public Task<IEnumerable<FileMetadata>> GetAllFilesAsync()
        {
            return Task.FromResult(this._files.Values.AsEnumerable());
        }

        public Task<FileMetadata?> GetFileByNameAsync(string fileName)
        {
            this._files.TryGetValue(fileName, out FileMetadata? file);
            return Task.FromResult(file);
        }

        public async Task<string> GetFileContentAsync(string fileName)
        {
            FileMetadata? file = await this.GetFileByNameAsync(fileName);
            return file == null
                ? throw new FileNotFoundException($"File not found: {fileName}")
                : await File.ReadAllTextAsync(file.CopiedPath);
        }
    }
}
