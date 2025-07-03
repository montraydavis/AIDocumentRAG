import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface DocumentSummaryDto {
  fileName: string;
  summary: string;
  generatedAt: string;
  tokenCount: number;
}

export interface SummaryResponse {
  fileName: string;
  summary: string;
  generatedAt: string;
}

export interface MultipleSummariesResponse {
  summaries: DocumentSummaryDto[];
  totalDocuments: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface SummaryState {
  summaries: Map<string, DocumentSummaryDto>;
  isLoading: boolean;
  lastUpdated?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentSummaryService {
  private readonly baseUrl = `${environment.apiUrl}/api/documentsummary`;
  private summaryState$ = new BehaviorSubject<SummaryState>({
    summaries: new Map(),
    isLoading: false
  });

  constructor(private http: HttpClient) { }

  // Public observable for components to subscribe to
  get summaries$(): Observable<SummaryState> {
    return this.summaryState$.asObservable();
  }

  // Get summary for a single document
  getSummary(fileName: string): Observable<ApiResponse<SummaryResponse>> {
    return this.http.get<ApiResponse<SummaryResponse>>(
      `${this.baseUrl}/${encodeURIComponent(fileName)}`
    );
  }

  // Get summaries for multiple documents
  getMultipleSummaries(fileNames: string[]): Observable<ApiResponse<MultipleSummariesResponse>> {
    return this.http.post<ApiResponse<MultipleSummariesResponse>>(
      `${this.baseUrl}/multiple`,
      fileNames
    );
  }

  // Load summaries for given file names and update state
  loadSummariesForFiles(fileNames: string[]): Observable<DocumentSummaryDto[]> {
    if (fileNames.length === 0) {
      this.updateSummaryState(new Map(), false);
      return of([]);
    }

    this.updateSummaryState(this.summaryState$.value.summaries, true);

    // Check which summaries we already have cached
    const currentSummaries = this.summaryState$.value.summaries;
    const uncachedFiles = fileNames.filter(fileName => !currentSummaries.has(fileName));

    if (uncachedFiles.length === 0) {
      // All summaries are cached
      const cachedSummaries = fileNames
        .map(fileName => currentSummaries.get(fileName))
        .filter((summary): summary is DocumentSummaryDto => summary !== undefined);

      this.updateSummaryState(currentSummaries, false);
      return of(cachedSummaries);
    }

    // Load uncached summaries
    return this.getMultipleSummaries(uncachedFiles).pipe(
      map(response => {
        const updatedSummaries = new Map(currentSummaries);
        const allSummaries: DocumentSummaryDto[] = [];

        if (response.success && response.data?.summaries) {
          // Add new summaries to cache
          response.data.summaries.forEach(summary => {
            updatedSummaries.set(summary.fileName, summary);
          });
        }

        // Collect all requested summaries (cached + new)
        fileNames.forEach(fileName => {
          const summary = updatedSummaries.get(fileName);
          if (summary) {
            allSummaries.push(summary);
          }
        });

        this.updateSummaryState(updatedSummaries, false);
        return allSummaries;
      }),
      catchError(error => {
        console.error('Error loading summaries:', error);
        this.updateSummaryState(currentSummaries, false);

        // Return cached summaries even if API call failed
        const cachedSummaries = fileNames
          .map(fileName => currentSummaries.get(fileName))
          .filter((summary): summary is DocumentSummaryDto => summary !== undefined);

        return of(cachedSummaries);
      })
    );
  }

  // Get current cached summaries for specific files
  getCachedSummaries(fileNames: string[]): DocumentSummaryDto[] {
    const currentSummaries = this.summaryState$.value.summaries;
    return fileNames
      .map(fileName => currentSummaries.get(fileName))
      .filter((summary): summary is DocumentSummaryDto => summary !== undefined);
  }

  // Clear all cached summaries
  clearCache(): void {
    this.updateSummaryState(new Map(), false);
  }

  private updateSummaryState(summaries: Map<string, DocumentSummaryDto>, isLoading: boolean): void {
    this.summaryState$.next({
      summaries,
      isLoading,
      lastUpdated: new Date()
    });
  }
}
