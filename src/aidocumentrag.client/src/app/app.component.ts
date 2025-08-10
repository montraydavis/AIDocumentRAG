import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FileManagementService, ApiResponse, InitializeResponse, FileMetadataDto, StatusResponse } from './services/file-management.service';
import { AIChatService } from './services/ai-chat.service';
import { NoteGenerationService } from './services/note-generation.service';
import { Subject, interval, switchMap, takeUntil, catchError, of } from 'rxjs';
import { FileUploadModalComponent } from './components/file-upload-modal/file-upload-modal.component';
import { DocumentsQuickViewComponent } from './components/documents-quick-view/documents-quick-view.component';
import { LoadingDialogComponent } from './components/loading-dialog/loading-dialog.component';

export interface DocumentSelection {
  selectedDocuments: FileMetadataDto[];
  isMultiSelect: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
  details?: string;
  progress?: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(DocumentsQuickViewComponent) documentsComponent!: DocumentsQuickViewComponent;
  @ViewChild(FileUploadModalComponent) uploadModal!: FileUploadModalComponent;

  title = 'aidocumentrag.client';
  selectedDocument: FileMetadataDto | null = null;
  documentSelection: DocumentSelection | null = null;

  loadingState: LoadingState = {
    isLoading: true,
    message: 'Initializing Document Management System',
    details: 'Please wait while we prepare your documents...'
  };

  private destroy$ = new Subject<void>();
  private stopPolling$ = new Subject<void>();
  private readonly POLL_INTERVAL = 5000; // 5 seconds
  private initializationAttempted = false;

  constructor(
    private fileManagementService: FileManagementService
  ) { }

  ngOnInit() {
    this.checkSystemStatus();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling$.next();
    this.stopPolling$.complete();
  }

  private checkSystemStatus() {
    this.updateLoadingState('Checking system status...', 'Verifying document management system...');

    // Check immediately on startup
    this.fileManagementService.getStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleStatusResponse(response),
        error: (error) => this.handleStatusError(error)
      });

    // Start polling for status (but only if not already successful)
    interval(this.POLL_INTERVAL)
      .pipe(
        switchMap(() => this.fileManagementService.getStatus()),
        takeUntil(this.destroy$),
        takeUntil(this.stopPolling$),
        catchError((error) => {
          console.error('Error checking status:', error);
          return of({ success: false, data: undefined, message: 'Error checking status' } as ApiResponse<StatusResponse>);
        })
      )
      .subscribe({
        next: (response) => this.handleStatusResponse(response),
        error: (error) => this.handleStatusError(error)
      });
  }

  private handleStatusResponse(response: ApiResponse<StatusResponse>) {
    console.log('Handling status response:', response);
    if (response.success && response.data) {
      const status = response.data;
      console.log('Status data:', status);

      if (status.isInitialized && status.fileCount > 0) {
        console.log('System ready with files, stopping polling');
        this.stopPolling$.next();
        this.updateLoadingState('Documents ready!', `Found ${status.fileCount} documents`);

        this.refreshDocuments().then(() => {
          setTimeout(() => {
            console.log('Setting loading to false after refresh');
            this.loadingState.isLoading = false;
          }, 800);
        });

      } else if (status.isInitialized && status.fileCount === 0) {
        console.log('System initialized but no files found');
        this.updateLoadingState('No documents found', 'The system is ready but no documents were found');

        if (!this.initializationAttempted) {
          this.initializationAttempted = true;
          this.initializeFileManagement();
        } else {
          this.stopPolling$.next();
          this.refreshDocuments().then(() => {
            setTimeout(() => {
              console.log('Setting loading to false after refresh (no files)');
              this.loadingState.isLoading = false;
            }, 2000);
          });
        }

      } else {
        console.log('System not initialized, attempting initialization');
        this.updateLoadingState('System not initialized', 'Attempting to initialize document management...');

        if (!this.initializationAttempted) {
          this.initializationAttempted = true;
          this.initializeFileManagement();
        }
      }
    } else {
      console.log('Status response not successful, attempting initialization');
      if (!this.initializationAttempted) {
        this.initializationAttempted = true;
        this.initializeFileManagement();
      }
    }
  }

  private handleStatusError(error: any) {
    console.error('Status check error:', error);
    this.updateLoadingState('Connection error', 'Unable to connect to the server. Retrying...');

    if (!this.initializationAttempted) {
      this.initializationAttempted = true;
      setTimeout(() => this.initializeFileManagement(), 2000);
    }
  }

  private initializeFileManagement() {
    console.log('Starting file management initialization...');
    this.updateLoadingState('Initializing system...', 'Setting up document management and processing files...');

    const initRequest = {
      sourcePath: "C:\\Users\\montr\\Downloads\\AIDocumentRAG\\Data",
      destinationPath: "C:\\Users\\montr\\Downloads\\AIDocumentRAG\\Data_Copy"
    };

    this.fileManagementService.initialize(initRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<InitializeResponse>) => {
          console.log('Initialization response:', response);
          if (response.success && response.data) {
            console.log('Initialization successful, updating loading state');
            this.updateLoadingState(
              'Initialization successful!',
              `Successfully processed ${response.data.fileCount} documents`
            );
          } else {
            console.log('Initialization failed, updating loading state');
            this.updateLoadingState(
              'Initialization failed',
              response.message || 'Failed to initialize the system'
            );

            setTimeout(() => {
              console.log('Setting loading to false after initialization failure');
              this.loadingState.isLoading = false;
            }, 3000);
          }
        },
        error: (error: Error) => {
          console.error('Error initializing file management:', error);
          this.updateLoadingState(
            'Initialization error',
            'An error occurred while initializing the system. Please refresh the page.'
          );

          setTimeout(() => {
            console.log('Setting loading to false after initialization error');
            this.loadingState.isLoading = false;
          }, 3000);
        }
      });
  }

  private async refreshDocuments(): Promise<void> {
    try {
      if (this.documentsComponent) {
        await this.documentsComponent.refreshDocuments();
      }
    } catch (error) {
      console.error('Error refreshing documents:', error);
    }
  }

  private updateLoadingState(message: string, details?: string, progress?: number) {
    console.log('Updating loading state:', { message, details, progress });
    this.loadingState = {
      isLoading: true,
      message,
      details,
      progress
    };
  }

  onDocumentSelected(document: FileMetadataDto) {
    this.selectedDocument = document;
    console.log('Document selected in app:', document.fileName);
  }

  onSelectionChanged(selection: DocumentSelection) {
    this.documentSelection = selection;
    console.log('Selection changed:', {
      count: selection.selectedDocuments.length,
      isMultiSelect: selection.isMultiSelect,
      documents: selection.selectedDocuments.map(d => d.fileName)
    });
  }

  onFileUploaded(fileMetadata: FileMetadataDto) {
    console.log('File uploaded successfully:', fileMetadata.fileName);
    
    // Refresh the documents list to show the new file
    this.refreshDocuments().then(() => {
      // Update search service with new files
      if (this.documentsComponent) {
      }
    });
  }

  onUploadError(errorMessage: string) {
    console.error('File upload error:', errorMessage);
    // You could show a toast notification here
    alert(`Upload failed: ${errorMessage}`);
  }

  onUploadModalClosed() {
    console.log('Upload modal closed');
    // Refresh documents when modal is closed
    this.refreshDocuments();
  }

  openUploadModal() {
    this.uploadModal.show();
  }

  // Test method for debugging
  setLoadingFalse() {
    console.log('Manually setting loading to false for testing');
    this.loadingState.isLoading = false;
  }
}
