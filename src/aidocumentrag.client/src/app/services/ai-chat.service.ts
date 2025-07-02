import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AIChatRequest {
  prompt: string;
}

export interface AIChatResponse {
  response: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AIChatService {
  private readonly baseUrl = `${environment.apiUrl}/api/aichat`;

  constructor(private http: HttpClient) { }

  sendMessage(prompt: string): Observable<ApiResponse<AIChatResponse>> {
    const request: AIChatRequest = { prompt };
    return this.http.post<ApiResponse<AIChatResponse>>(`${this.baseUrl}/chat`, request);
  }

  sendMessageStream(prompt: string): Observable<string> {
    return new Observable<string>(observer => {
      const request: AIChatRequest = { prompt };

      fetch(`${this.baseUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          if (!response.body) {
            throw new Error('No response body');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          const readStream = async (): Promise<void> => {
            try {
              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  observer.complete();
                  break;
                }

                const chunk = decoder.decode(value, { stream: true });
                if (chunk) {
                  observer.next(chunk);
                }
              }
            } catch (error) {
              observer.error(error);
            }
          };

          readStream();
        })
        .catch(error => {
          observer.error(error);
        });

      // Cleanup function
      return () => {
        // If we need to abort the request, we can implement it here
      };
    });
  }
}
