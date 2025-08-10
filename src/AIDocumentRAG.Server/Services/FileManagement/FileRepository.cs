namespace AIDocumentRAG.Server.Services.FileManagement
{
    using AIDocumentRAG.Server.Core.FileManagement;
    using AIDocumentRAG.Server.Core.NoteGeneration;
    using AIDocumentRAG.Server.Models;

    public class FileRepository : IFileRepository
    {
        private readonly Dictionary<string, FileMetadata> _files;
        private readonly INoteGenerationService _noteGenerationService;

        public FileRepository(IEnumerable<FileMetadata> files, INoteGenerationService noteGenerationService)
        {
            _files = files.ToDictionary(f => f.FileName, f => f);
            _noteGenerationService = noteGenerationService;
        }

        public Task<bool> AddFileAsync(FileMetadata file)
        {
            if (_files.ContainsKey(file.FileName))
            {
                return Task.FromResult(false); // File already exists
            }

            _files[file.FileName] = file;
            return Task.FromResult(true);
        }

        public Task<IEnumerable<FileMetadata>> GetAllFilesAsync()
        {
            return Task.FromResult(_files.Values.AsEnumerable());
        }

        public string GetDestinationDirectory()
        {
            // Return the directory path from the first file, or a default path
            if (_files.Any())
            {
                var firstFile = _files.Values.First();
                return Path.GetDirectoryName(firstFile.CopiedPath) ?? Path.GetTempPath();
            }
            
            return Path.Combine(Path.GetTempPath(), "AIDocumentRAG");
        }

        public Task<FileMetadata?> GetFileByNameAsync(string fileName)
        {
            _files.TryGetValue(fileName, out FileMetadata? file);
            return Task.FromResult(file);
        }

        public async Task<string> GetFileContentAsync(string fileName)
        {
            FileMetadata? file = await GetFileByNameAsync(fileName);
            return file == null
                ? throw new FileNotFoundException($"File not found: {fileName}")
                : await File.ReadAllTextAsync(file.CopiedPath);
        }

        public async Task<bool> RemoveFileAsync(string fileName)
        {
            if (_files.ContainsKey(fileName))
            {
                // Clean up associated notes
                await _noteGenerationService.DeleteNotesForDocumentAsync(fileName);

                // Remove from files dictionary
                _files.Remove(fileName);
                return true;
            }

            return false;
        }

        public Task<FileMetadata?> RenameFileAsync(string oldFileName, string newFileName)
        {
            if (!_files.ContainsKey(oldFileName))
            {
                return Task.FromResult<FileMetadata?>(null);
            }

            if (_files.ContainsKey(newFileName))
            {
                return Task.FromResult<FileMetadata?>(null); // New name already exists
            }

            var oldFile = _files[oldFileName];
            var newFile = new FileMetadata(
                oldFile.OriginalPath,
                oldFile.CopiedPath,
                newFileName,
                oldFile.CreationDate,
                oldFile.ModifiedDate,
                oldFile.FileSize,
                oldFile.CharacterCount,
                oldFile.FileExtension
            );

            _files.Remove(oldFileName);
            _files[newFileName] = newFile;

            return Task.FromResult<FileMetadata?>(newFile);
        }
    }
}
