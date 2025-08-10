namespace AIDocumentRAG.Server.Services.FileManagement
{
    using AIDocumentRAG.Server.Core.FileManagement;
    using AIDocumentRAG.Server.Core.NoteGeneration;
    using AIDocumentRAG.Server.Models;

    using Microsoft.AspNetCore.Http;

    public class FileManagementService
    {
        private readonly IDirectoryCopier _directoryCopier;
        private readonly INoteGenerationService _noteGenerationService;
        private static IFileRepository? _currentRepository;

        public FileManagementService(
            IDirectoryCopier directoryCopier,
            INoteGenerationService noteGenerationService)
        {
            _directoryCopier = directoryCopier;
            _noteGenerationService = noteGenerationService;
        }

        public async Task<IFileRepository> InitializeAsync(string sourcePath, string destinationPath)
        {
            IEnumerable<FileMetadata> files = await _directoryCopier.CopyDirectoryAsync(sourcePath, destinationPath);
            _currentRepository = new FileRepository(files, _noteGenerationService);
            return _currentRepository;
        }

        public async Task<FileMetadata> UploadFileAsync(IFormFile file)
        {
            if (_currentRepository == null)
            {
                throw new InvalidOperationException("File management system not initialized");
            }

            // Get the destination directory from the current repository
            string destinationPath = _currentRepository.GetDestinationDirectory();

            // Create unique filename to avoid conflicts
            string fileName = Path.GetFileNameWithoutExtension(file.FileName);
            string extension = Path.GetExtension(file.FileName);
            string uniqueFileName = $"{fileName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}{extension}";
            string filePath = Path.Combine(destinationPath, uniqueFileName);

            // Ensure directory exists
            Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

            // Save the uploaded file
            using (FileStream stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create file metadata
            var fileInfo = new FileInfo(filePath);
            var metadata = new FileMetadata(
                file.FileName,
                filePath,
                uniqueFileName,
                fileInfo.CreationTimeUtc,
                fileInfo.LastWriteTimeUtc,
                fileInfo.Length,
                0, // Will be calculated when content is first accessed
                extension
            );

            // Add to repository
            await _currentRepository.AddFileAsync(metadata);

            return metadata;
        }

        public async Task<FileMetadata?> RenameFileAsync(string oldFileName, string newFileName)
        {
            return _currentRepository == null
                ? throw new InvalidOperationException("File management system not initialized")
                : await _currentRepository.RenameFileAsync(oldFileName, newFileName);
        }

        public async Task<bool> RemoveFileAsync(string fileName)
        {
            try
            {
                // Clean up associated notes first
                await _noteGenerationService.DeleteNotesForDocumentAsync(fileName);

                // Remove from repository if available
                if (_currentRepository != null)
                {
                    await _currentRepository.RemoveFileAsync(fileName);
                }

                return true;
            }
            catch (Exception ex)
            {
                // Log error but don't fail the operation
                Console.WriteLine($"Error cleaning up notes for file {fileName}: {ex.Message}");
                return false;
            }
        }
    }
}
