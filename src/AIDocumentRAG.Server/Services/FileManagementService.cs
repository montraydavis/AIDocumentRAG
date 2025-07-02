namespace AIDocumentRAG.Server.Services
{

    public record FileMetadata(
        string OriginalPath,
        string CopiedPath,
        string FileName,
        DateTime CreationDate,
        DateTime ModifiedDate,
        long FileSize,
        int CharacterCount,
        string FileExtension);

    public interface IFileRepository
    {
        Task<IEnumerable<FileMetadata>> GetAllFilesAsync();
        Task<FileMetadata?> GetFileByNameAsync(string fileName);
        Task<string> GetFileContentAsync(string fileName);
    }

    public interface IFileProcessor
    {
        Task<FileMetadata> ProcessFileAsync(string sourcePath, string destinationPath);
    }

    public interface IDirectoryCopier
    {
        Task<IEnumerable<FileMetadata>> CopyDirectoryAsync(string sourcePath, string destinationPath);
    }

    public class FileProcessor : IFileProcessor
    {
        public async Task<FileMetadata> ProcessFileAsync(string sourcePath, string destinationPath)
        {
            FileInfo fileInfo = new FileInfo(sourcePath);
            string fileName = fileInfo.Name;
            string copiedPath = Path.Combine(destinationPath, fileName);

            File.Copy(sourcePath, copiedPath, overwrite: true);

            string content = await File.ReadAllTextAsync(copiedPath);

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
    }

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
            return file == null ? throw new FileNotFoundException($"File not found: {fileName}") : await File.ReadAllTextAsync(file.CopiedPath);
        }
    }

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
