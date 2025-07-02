import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FileManagementService, FileMetadataDto } from '../../services/file-management.service';
import { Subject, takeUntil } from 'rxjs';

export interface DocumentSelection {
  selectedDocuments: FileMetadataDto[];
  isMultiSelect: boolean;
}

@Component({
  selector: 'app-documents-quick-view',
  templateUrl: './documents-quick-view.component.html',
  styleUrl: './documents-quick-view.component.css',
  standalone: false
})
export class DocumentsQuickViewComponent implements OnInit, OnDestroy {
  @Output() documentSelected = new EventEmitter<FileMetadataDto>();
  @Output() selectionChanged = new EventEmitter<DocumentSelection>();

  files: FileMetadataDto[] = [];
  allFiles: FileMetadataDto[] = []; // Keep reference to all files
  filteredFiles: FileMetadataDto[] = []; // Files after search filtering
  displayFiles: FileMetadataDto[] = []; // Files currently shown in UI

  selectedFile: FileMetadataDto | null = null;
  selectedDocuments: Set<string> = new Set();
  isMultiSelectMode = false;
  isLoading = true;
  isSearchActive = false;

  private readonly storageKey = 'document-selection-state';
  private destroy$ = new Subject<void>();

  constructor(private fileManagementService: FileManagementService) { }

  ngOnInit() {
    this.loadSelectionState();
    this.loadDocuments();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSelectionState() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const state = JSON.parse(stored);
        this.isMultiSelectMode = state.isMultiSelectMode || false;
        this.selectedDocuments = new Set(state.selectedDocuments || []);
      }
    } catch (error) {
      console.error('Error loading selection state:', error);
    }
  }

  private saveSelectionState() {
    try {
      const state = {
        isMultiSelectMode: this.isMultiSelectMode,
        selectedDocuments: Array.from(this.selectedDocuments)
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving selection state:', error);
    }
  }

  private loadDocuments() {
    this.isLoading = true;
    this.fileManagementService.getAllFiles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.allFiles = response.data;
            this.files = [...this.allFiles];
            this.updateDisplayFiles();
            this.emitCurrentSelection();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading documents:', error);
          this.isLoading = false;
        }
      });
  }

  // Public method to refresh documents - called by parent component
  async refreshDocuments(): Promise<void> {
    return new Promise((resolve) => {
      this.isLoading = true;
      this.fileManagementService.getAllFiles()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.allFiles = response.data;
              this.files = [...this.allFiles];
              this.updateDisplayFiles();
              this.emitCurrentSelection();
              console.log(`Refreshed documents list: ${this.allFiles.length} documents found`);
            }
            this.isLoading = false;
            resolve();
          },
          error: (error) => {
            console.error('Error refreshing documents:', error);
            this.isLoading = false;
            resolve();
          }
        });
    });
  }

  // Public method called by parent to set filtered files from search
  setFilteredFiles(filteredFiles: FileMetadataDto[], isSearchActive: boolean): void {
    this.filteredFiles = filteredFiles;
    this.isSearchActive = isSearchActive;
    this.updateDisplayFiles();
  }

  // Get all files (used by parent for search service)
  getAllFiles(): FileMetadataDto[] {
    return this.allFiles;
  }

  private updateDisplayFiles(): void {
    if (this.isSearchActive) {
      this.displayFiles = this.filteredFiles;
    } else {
      this.displayFiles = this.files;
    }
  }

  get sectionTitle(): string {
    if (this.isSearchActive) {
      return `Search Results (${this.displayFiles.length})`;
    }
    return `Documents (${this.displayFiles.length})`;
  }

  onFileClick(file: FileMetadataDto) {
    if (this.isMultiSelectMode) {
      this.toggleDocumentSelection(file);
    } else {
      this.selectedFile = file;
      this.documentSelected.emit(file);
      this.emitCurrentSelection();
    }
  }

  onCheckboxChange(file: FileMetadataDto, event: Event) {
    event.stopPropagation();
    this.toggleDocumentSelection(file);
  }

  private toggleDocumentSelection(file: FileMetadataDto) {
    const fileKey = this.getFileKey(file);

    if (this.selectedDocuments.has(fileKey)) {
      this.selectedDocuments.delete(fileKey);
    } else {
      this.selectedDocuments.add(fileKey);
    }

    this.saveSelectionState();
    this.emitCurrentSelection();
  }

  onMultiSelectToggle(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.isMultiSelectMode = checkbox.checked;

    if (!this.isMultiSelectMode) {
      // Clear multi-selection when switching to single mode
      this.selectedDocuments.clear();
      if (this.selectedFile) {
        this.documentSelected.emit(this.selectedFile);
      }
    } else {
      // Clear single selection when switching to multi mode
      this.selectedFile = null;
    }

    this.saveSelectionState();
    this.emitCurrentSelection();
  }

  private emitCurrentSelection() {
    const selectedFiles = this.getSelectedFiles();
    const selection: DocumentSelection = {
      selectedDocuments: selectedFiles,
      isMultiSelect: this.isMultiSelectMode
    };
    this.selectionChanged.emit(selection);
  }

  private getSelectedFiles(): FileMetadataDto[] {
    if (this.isMultiSelectMode) {
      return this.allFiles.filter(file =>
        this.selectedDocuments.has(this.getFileKey(file))
      );
    } else {
      return this.selectedFile ? [this.selectedFile] : [];
    }
  }

  getFileKey(file: FileMetadataDto): string {
    return `${file.fileName}_${file.fileSize}_${file.creationDate}`;
  }

  isDocumentSelected(file: FileMetadataDto): boolean {
    if (this.isMultiSelectMode) {
      return this.selectedDocuments.has(this.getFileKey(file));
    } else {
      return this.selectedFile === file;
    }
  }

  trackByFileName(index: number, file: FileMetadataDto): string {
    return file.fileName;
  }

  getFileIcon(fileExtension: string): string {
    switch (fileExtension.toLowerCase()) {
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

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
