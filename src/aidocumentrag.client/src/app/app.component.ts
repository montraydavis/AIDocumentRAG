import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FileManagementService, ApiResponse, InitializeResponse, FileMetadataDto, StatusResponse } from './services/file-management.service';
import { DocumentSelection } from './components/documents-quick-view/documents-quick-view.component';
import { DocumentsQuickViewComponent } from './components/documents-quick-view/documents-quick-view.component';
import { DocumentSearchService, SearchState } from './services/document-search.service';
import { LoadingState } from './components/loading-dialog/loading-dialog.component';
import { Subject, interval, switchMap, takeUntil, catchError, of, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(DocumentsQuickViewComponent) documentsComponent!: DocumentsQuickViewComponent;

  title = 'aidocumentrag.client';
  selectedDocument: FileMetadataDto | null = null;
  documentSelection: DocumentSelection | null = null;
  searchQuery = '';
  searchState: SearchState = {
    query: '',
    isActive: false,
    filteredFiles: [],
    totalResults: 0
  };

  loadingState: LoadingState = {
    isLoading: true,
    message: 'Initializing Document Management System',
    details: 'Please wait while we prepare your documents...'
  };

  private destroy$ = new Subject<void>();
  private stopPolling$ = new Subject<void>();
  private searchInput$ = new Subject<string>();
  private readonly POLL_INTERVAL = 5000; // 5 seconds
  private initializationAttempted = false;

  constructor(
    private fileManagementService: FileManagementService,
    private searchService: DocumentSearchService
  ) { }

  ngOnInit() {
    this.setupSearch();
    this.checkSystemStatus();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling$.next();
    this.stopPolling$.complete();
  }

  private setupSearch() {
    // Setup search input debouncing
    this.searchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchService.setSearchQuery(query);
    });

    // Subscribe to search state changes
    this.searchService.searchState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.searchState = state;
      // Update the documents component with filtered results
      if (this.documentsComponent) {
        this.documentsComponent.setFilteredFiles(state.filteredFiles, state.isActive);
      }
    });
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.searchInput$.next(input.value);
  }

  onSearchClear() {
    this.searchQuery = '';
    this.searchService.clearSearch();
  }

  onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.onSearchClear();
      (event.target as HTMLInputElement).blur();
    }
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
    if (response.success && response.data) {
      const status = response.data;

      if (status.isInitialized && status.fileCount > 0) {
        this.stopPolling$.next();
        this.updateLoadingState('Documents ready!', `Found ${status.fileCount} documents`);

        this.refreshDocuments().then(() => {
          setTimeout(() => {
            this.loadingState.isLoading = false;
          }, 800);
        });

      } else if (status.isInitialized && status.fileCount === 0) {
        this.updateLoadingState('No documents found', 'The system is ready but no documents were found');

        if (!this.initializationAttempted) {
          this.initializationAttempted = true;
          this.initializeFileManagement();
        } else {
          this.stopPolling$.next();
          this.refreshDocuments().then(() => {
            setTimeout(() => {
              this.loadingState.isLoading = false;
            }, 2000);
          });
        }

      } else {
        this.updateLoadingState('System not initialized', 'Attempting to initialize document management...');

        if (!this.initializationAttempted) {
          this.initializationAttempted = true;
          this.initializeFileManagement();
        }
      }
    } else {
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
    this.updateLoadingState('Initializing system...', 'Setting up document management and processing files...');

    const initRequest = {
      sourcePath: "C:\\Users\\montr\\Downloads\\AIDocumentRAG\\Data",
      destinationPath: "C:\\Users\\montr\\Downloads\\AIDocumentRAG\\Data_Copy"
    };

    this.fileManagementService.initialize(initRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<InitializeResponse>) => {
          if (response.success && response.data) {
            this.updateLoadingState(
              'Initialization successful!',
              `Successfully processed ${response.data.fileCount} documents`
            );
          } else {
            this.updateLoadingState(
              'Initialization failed',
              response.message || 'Failed to initialize the system'
            );

            setTimeout(() => {
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
            this.loadingState.isLoading = false;
          }, 3000);
        }
      });
  }

  private async refreshDocuments(): Promise<void> {
    try {
      if (this.documentsComponent) {
        await this.documentsComponent.refreshDocuments();

        // Update search service with new files
        const files = this.documentsComponent.getAllFiles();
        this.searchService.setFiles(files);
      }
    } catch (error) {
      console.error('Error refreshing documents:', error);
    }
  }

  private updateLoadingState(message: string, details?: string, progress?: number) {
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
}
