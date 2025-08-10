namespace AIDocumentRAG.Server.Controllers
{
    using AIDocumentRAG.Server.Core.FileManagement;
    using AIDocumentRAG.Server.Models;
    using AIDocumentRAG.Server.Models.Requests;
    using AIDocumentRAG.Server.Models.Responses;
    using AIDocumentRAG.Server.Services.FileManagement;

    using Microsoft.AspNetCore.Mvc;

    [ApiController]
    [Route("api/[controller]")]
    public class FileManagementController : ControllerBase
    {
        private readonly FileManagementService _fileManagementService;
        private readonly ILogger<FileManagementController> _logger;
        private static IFileRepository? _currentRepository;
        private static DateTime? _lastInitialized;
        private static string? _currentSourcePath;
        private static string? _currentDestinationPath;

        public FileManagementController(
            FileManagementService fileManagementService,
            ILogger<FileManagementController> logger)
        {
            this._fileManagementService = fileManagementService;
            this._logger = logger;
        }

        [HttpPost("initialize")]
        public async Task<ActionResult<ApiResponse<InitializeResponse>>> InitializeAsync(
            [FromBody] InitializeRequest request)
        {
            try
            {
                string destinationPath = request.DestinationPath ??
                    Path.Combine(Path.GetTempPath(), "AIDocumentRAG", Guid.NewGuid().ToString());

                _currentRepository = await this._fileManagementService.InitializeAsync(
                    request.SourcePath, destinationPath);

                IEnumerable<FileMetadata> files = await _currentRepository.GetAllFilesAsync();
                int fileCount = files.Count();

                _lastInitialized = DateTime.UtcNow;
                _currentSourcePath = request.SourcePath;
                _currentDestinationPath = destinationPath;

                InitializeResponse response = new InitializeResponse(
                    Success: true,
                    FileCount: fileCount,
                    Message: $"Successfully initialized with {fileCount} files");

                return this.Ok(new ApiResponse<InitializeResponse>(true, response));
            }
            catch (DirectoryNotFoundException ex)
            {
                this._logger.LogWarning("Directory not found: {Message}", ex.Message);
                return this.NotFound(new ApiResponse<InitializeResponse>(
                    false, null, "Directory not found", new[] { ex.Message }));
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error initializing file management system");
                return this.StatusCode(500, new ApiResponse<InitializeResponse>(
                    false, null, "Internal server error", new[] { ex.Message }));
            }
        }

        [HttpPost("upload")]
        public async Task<ActionResult<ApiResponse<FileMetadataDto>>> UploadFileAsync(IFormFile file)
        {
            if (_currentRepository == null)
            {
                return this.BadRequest(new ApiResponse<FileMetadataDto>(
                    false, null, "System not initialized. Call /initialize first."));
            }

            if (file == null || file.Length == 0)
            {
                return this.BadRequest(new ApiResponse<FileMetadataDto>(
                    false, null, "No file provided"));
            }

            try
            {
                FileMetadata uploadedFile = await this._fileManagementService.UploadFileAsync(file);
                FileMetadataDto dto = MapToDto(uploadedFile);

                return this.Ok(new ApiResponse<FileMetadataDto>(true, dto));
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error uploading file: {FileName}", file.FileName);
                return this.StatusCode(500, new ApiResponse<FileMetadataDto>(
                    false, null, "Error uploading file", new[] { ex.Message }));
            }
        }

        [HttpDelete("files/{fileName}")]
        public async Task<ActionResult<ApiResponse<bool>>> RemoveFileAsync(string fileName)
        {
            if (_currentRepository == null)
            {
                return this.BadRequest(new ApiResponse<bool?>(
                    false, null, "System not initialized. Call /initialize first."));
            }

            try
            {
                bool success = await this._fileManagementService.RemoveFileAsync(fileName);

                return success
                    ? (ActionResult<ApiResponse<bool>>)this.Ok(new ApiResponse<bool>(true, true, "File removed successfully"))
                    : (ActionResult<ApiResponse<bool>>)this.BadRequest(new ApiResponse<bool>(
                        false, false, "Failed to remove file"));
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error removing file: {FileName}", fileName);
                return this.StatusCode(500, new ApiResponse<bool>(
                    false, false, "Error removing file", new[] { ex.Message }));
            }
        }

        [HttpPost("files/{fileName}/rename")]
        public async Task<ActionResult<ApiResponse<FileMetadataDto>>> RenameFileAsync(
            string fileName, [FromBody] RenameFileRequest request)
        {
            if (_currentRepository == null)
            {
                return this.BadRequest(new ApiResponse<FileMetadataDto>(
                    false, null, "System not initialized. Call /initialize first."));
            }

            if (string.IsNullOrWhiteSpace(request.NewFileName))
            {
                return this.BadRequest(new ApiResponse<FileMetadataDto>(
                    false, null, "New file name is required"));
            }

            try
            {
                FileMetadata? renamedFile = await this._fileManagementService.RenameFileAsync(fileName, request.NewFileName);
                
                if (renamedFile != null)
                {
                    FileMetadataDto dto = MapToDto(renamedFile);
                    return this.Ok(new ApiResponse<FileMetadataDto>(true, dto));
                }
                else
                {
                    return this.NotFound(new ApiResponse<FileMetadataDto>(
                        false, null, $"File '{fileName}' not found"));
                }
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error renaming file: {FileName} to {NewFileName}", fileName, request.NewFileName);
                return this.StatusCode(500, new ApiResponse<FileMetadataDto>(
                    false, null, "Error renaming file", new[] { ex.Message }));
            }
        }

        [HttpGet("files")]
        public async Task<ActionResult<ApiResponse<IEnumerable<FileMetadataDto>>>> GetAllFilesAsync()
        {
            if (_currentRepository == null)
            {
                return this.BadRequest(new ApiResponse<IEnumerable<FileMetadataDto>>(
                    false, null, "System not initialized. Call /initialize first."));
            }

            try
            {
                IEnumerable<FileMetadata> files = await _currentRepository.GetAllFilesAsync();
                IEnumerable<FileMetadataDto> dtos = files.Select(MapToDto);

                return this.Ok(new ApiResponse<IEnumerable<FileMetadataDto>>(true, dtos));
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error retrieving files");
                return this.StatusCode(500, new ApiResponse<IEnumerable<FileMetadataDto>>(
                    false, null, "Error retrieving files", new[] { ex.Message }));
            }
        }

        [HttpGet("files/{fileName}")]
        public async Task<ActionResult<ApiResponse<FileMetadataDto>>> GetFileAsync(string fileName)
        {
            if (_currentRepository == null)
            {
                return this.BadRequest(new ApiResponse<FileMetadataDto>(
                    false, null, "System not initialized. Call /initialize first."));
            }

            try
            {
                FileMetadata? file = await _currentRepository.GetFileByNameAsync(fileName);
                return file == null
                    ? (ActionResult<ApiResponse<FileMetadataDto>>)this.NotFound(new ApiResponse<FileMetadataDto>(
                        false, null, $"File '{fileName}' not found"))
                    : (ActionResult<ApiResponse<FileMetadataDto>>)this.Ok(new ApiResponse<FileMetadataDto>(true, MapToDto(file)));
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error retrieving file: {FileName}", fileName);
                return this.StatusCode(500, new ApiResponse<FileMetadataDto>(
                    false, null, "Error retrieving file", new[] { ex.Message }));
            }
        }

        [HttpGet("files/{fileName}/content")]
        public async Task<ActionResult<ApiResponse<FileContentResponse>>> GetFileContentAsync(string fileName)
        {
            if (_currentRepository == null)
            {
                return this.BadRequest(new ApiResponse<FileContentResponse>(
                    false, null, "System not initialized. Call /initialize first."));
            }

            try
            {
                FileMetadata? file = await _currentRepository.GetFileByNameAsync(fileName);
                if (file == null)
                {
                    return this.NotFound(new ApiResponse<FileContentResponse>(
                        false, null, $"File '{fileName}' not found"));
                }

                string content = await _currentRepository.GetFileContentAsync(fileName);
                FileContentResponse response = new FileContentResponse(fileName, content, MapToDto(file));

                return this.Ok(new ApiResponse<FileContentResponse>(true, response));
            }
            catch (FileNotFoundException)
            {
                return this.NotFound(new ApiResponse<FileContentResponse>(
                    false, null, $"File '{fileName}' not found"));
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error retrieving file content: {FileName}", fileName);
                return this.StatusCode(500, new ApiResponse<FileContentResponse>(
                    false, null, "Error retrieving file content", new[] { ex.Message }));
            }
        }

        [HttpGet("status")]
        public async Task<ActionResult<ApiResponse<StatusResponse>>> GetStatusAsync()
        {
            try
            {
                int fileCount = 0;
                if (_currentRepository != null)
                {
                    IEnumerable<FileMetadata> files = await _currentRepository.GetAllFilesAsync();
                    fileCount = files.Count();
                }

                StatusResponse status = new StatusResponse(
                    IsInitialized: _currentRepository != null,
                    FileCount: fileCount,
                    LastInitialized: _lastInitialized,
                    CurrentSourcePath: _currentSourcePath,
                    CurrentDestinationPath: _currentDestinationPath);

                return this.Ok(new ApiResponse<StatusResponse>(true, status));
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error retrieving status");
                return this.StatusCode(500, new ApiResponse<StatusResponse>(
                    false, null, "Error retrieving status", new[] { ex.Message }));
            }
        }

        private static FileMetadataDto MapToDto(FileMetadata metadata)
            => new(metadata.OriginalPath,
                metadata.CopiedPath,
                metadata.FileName,
                metadata.CreationDate,
                metadata.ModifiedDate,
                metadata.FileSize,
                metadata.CharacterCount,
                metadata.FileExtension);
    }
}