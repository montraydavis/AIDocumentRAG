import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { FileManagementService, FileMetadataDto, StatusResponse } from '../../services/file-management.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
  standalone: false
})
export class FileUploadComponent implements OnInit, OnDestroy {
  @Output() fileUploaded = new EventEmitter<FileMetadataDto>();
  @Output() uploadError = new EventEmitter<string>();

  uploadForm: any; // Using any for now to avoid FormBuilder dependency
  isUploading = false;
  dragOver = false;
  selectedFiles: File[] = [];
  uploadProgress: { [key: string]: number } = {};
  isSystemInitialized = false;
  systemStatus: StatusResponse | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fileManagementService: FileManagementService
  ) {
    // Initialize form without FormBuilder for now
    this.uploadForm = { files: [] };
  }

  ngOnInit() {
    console.log('FileUploadComponent initialized');
    this.checkSystemStatus();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkSystemStatus() {
    console.log('Checking system status...');
    this.fileManagementService.getStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('System status response:', response);
          if (response.success && response.data) {
            this.systemStatus = response.data;
            this.isSystemInitialized = response.data.isInitialized;
            console.log('System initialized:', this.isSystemInitialized);
          } else {
            console.log('System status response not successful, setting as initialized for testing');
            this.isSystemInitialized = true; // Fallback for testing
          }
        },
        error: (error) => {
          console.error('Error checking system status:', error);
          console.log('Setting system as initialized for testing due to error');
          this.isSystemInitialized = true; // Fallback for testing
        }
      });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  private handleFiles(files: File[]) {
    // Filter out unsupported file types
    const supportedFiles = files.filter(file => this.isFileTypeSupported(file));
    const unsupportedFiles = files.filter(file => !this.isFileTypeSupported(file));
    
    if (unsupportedFiles.length > 0) {
      const unsupportedNames = unsupportedFiles.map(f => f.name).join(', ');
      this.uploadError.emit(`Unsupported file types: ${unsupportedNames}`);
    }
    
    this.selectedFiles = [...this.selectedFiles, ...supportedFiles];
    
    // Update form control
    this.uploadForm.files = this.selectedFiles;
  }

  private isFileTypeSupported(file: File): boolean {
    const supportedExtensions = ['.txt', '.md', '.doc', '.docx', '.pdf', '.xls', '.xlsx', '.ppt', '.pptx'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return supportedExtensions.includes(extension);
  }

  removeFile(file: File) {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
    this.uploadForm.files = this.selectedFiles;
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0) return;

    this.isUploading = true;
    this.uploadProgress = {};

    // Upload files one by one
    this.selectedFiles.forEach(file => {
      this.uploadProgress[file.name] = 0;
      
      this.fileManagementService.uploadFile(file)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.uploadProgress[file.name] = 100;
              this.fileUploaded.emit(response.data);
              
              // Remove from selected files after successful upload
              this.selectedFiles = this.selectedFiles.filter(f => f !== file);
              this.uploadForm.files = this.selectedFiles;
              
              // Refresh system status after successful upload
              this.checkSystemStatus();
            } else {
              this.uploadError.emit(response.message || 'Upload failed');
            }
          },
          error: (error) => {
            console.error('Upload error:', error);
            this.uploadError.emit('Upload failed: ' + error.message);
            this.uploadProgress[file.name] = -1; // Error state
          },
          complete: () => {
            if (this.selectedFiles.length === 0) {
              this.isUploading = false;
            }
          }
        });
    });
  }

  clearFiles() {
    this.selectedFiles = [];
    this.uploadForm.files = [];
    this.uploadProgress = {};
  }

  getFileSize(file: File): string {
    if (file.size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(file.size) / Math.log(k));
    return parseFloat((file.size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileIcon(fileName: string): string {
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case '.pdf':
        return '📄';
      case '.docx':
      case '.doc':
        return '📝';
      case '.xlsx':
      case '.xls':
        return '📊';
      case '.txt':
        return '📋';
      case '.pptx':
      case '.ppt':
        return '📊';
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
        return '🖼️';
      default:
        return '📁';
    }
  }

  trackByFileName(index: number, file: File): string {
    return file.name;
  }
} 