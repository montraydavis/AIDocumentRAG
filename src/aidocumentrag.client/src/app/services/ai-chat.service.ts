import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

export interface AIChatRequest {
  prompt: string;
  servicer: string;
  model: string;
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
  private readonly ollamaUrl = 'http://localhost:11434';

  constructor(private http: HttpClient) { }

  getOllamaModels(): Observable<string[]> {
    return this.http.get<OllamaModelsResponse>(`${this.ollamaUrl}/api/tags`).pipe(
      map(response => response.models.map(model => model.name)),
      catchError(error => {
        console.error('Error fetching Ollama models:', error);
        // Return fallback models if API call fails
        return of(['phi4']);
      })
    );
  }

  sendMessage(prompt: string, servicer: string = 'openai', model: string = 'gpt-4o-mini'): Observable<ApiResponse<AIChatResponse>> {
    const request: AIChatRequest = { prompt, servicer, model };
    return this.http.post<ApiResponse<AIChatResponse>>(`${this.baseUrl}/chat`, request);
  }

  sendMessageStream(prompt: string, servicer: string = 'openai', model: string = 'gpt-4o-mini'): Observable<string> {
    return new Observable<string>(observer => {
      const request: AIChatRequest = { prompt, servicer, model };

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
