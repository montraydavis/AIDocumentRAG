import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { FileMetadataDto, FileManagementService } from '../../services/file-management.service';
import { AIChatService } from '../../services/ai-chat.service';
import { DocumentSummaryService, DocumentSummaryDto } from '../../services/document-summary.service';
import { DocumentSelection } from '../documents-quick-view/documents-quick-view.component';
import { Subject, takeUntil } from 'rxjs';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface DocumentConversation {
  conversationId: string;
  documentNames: string[];
  isMultiDocument: boolean;
  messages: ChatMessage[];
  lastUpdated: Date;
}

@Component({
  selector: 'app-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrl: './chat-view.component.css',
  standalone: false
})
export class ChatViewComponent implements OnChanges, AfterViewChecked, OnDestroy {
  @Input() selectedDocument: FileMetadataDto | null = null;
  @Input() documentSelection: DocumentSelection | null = null;
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;

  servicer: string = 'openai';
  servicers: string[] = ['openai', 'ollama'];
  model: string = 'gpt-4o-mini';
  ollamaModels: string[] = [];
  openAiModels: string[] = ['gpt-4', 'gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-nano'];
  isLoadingModels = false;

  // Summary-related properties
  documentSummaries: DocumentSummaryDto[] = [];
  summariesLoading = false;
  summariesExpanded = false;

  private readonly storageKey = 'document-conversations';
  private readonly summaryExpandedKey = 'summaries-expanded-state';
  private readonly servicerSettingsKey = 'chat-servicer-settings';
  private shouldScrollToBottom = false;
  private destroy$ = new Subject<void>();

  constructor(
    private aiChatService: AIChatService,
    private fileManagementService: FileManagementService,
    private summaryService: DocumentSummaryService
  ) {
    this.loadSummaryExpandedState();
    this.loadServicerSettings();
    this.loadOllamaModels();
  }

  get activeDocuments(): FileMetadataDto[] {
    return this.documentSelection?.selectedDocuments || [];
  }

  get isMultiDocumentMode(): boolean {
    return this.documentSelection?.isMultiSelect || false;
  }

  get displayTitle(): string {
    if (this.activeDocuments.length === 0) return 'Select Documents';
    if (this.activeDocuments.length === 1) return 'Chat with Document';
    return `Chat with ${this.activeDocuments.length} Documents`;
  }

  get displaySubtitle(): string {
    if (this.activeDocuments.length === 0) {
      return 'Choose documents from the sidebar to start chatting';
    }
    if (this.activeDocuments.length === 1) {
      return this.activeDocuments[0].fileName;
    }
    return this.activeDocuments.map(doc => doc.fileName).join(', ');
  }

  get availableModels(): string[] {
    return this.servicer === 'openai' ? this.openAiModels : this.ollamaModels;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['documentSelection'] && this.documentSelection) {
      this.loadConversationForSelection();
      this.loadSummariesForCurrentSelection();
    } else if (changes['selectedDocument'] && this.selectedDocument && !this.documentSelection) {
      this.loadConversationForDocument();
      this.loadSummariesForCurrentSelection();
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSummaryExpandedState(): void {
    try {
      const stored = localStorage.getItem(this.summaryExpandedKey);
      this.summariesExpanded = stored ? JSON.parse(stored) : false;
    } catch (error) {
      console.error('Error loading summary expanded state:', error);
      this.summariesExpanded = false;
    }
  }

  private saveSummaryExpandedState(): void {
    try {
      localStorage.setItem(this.summaryExpandedKey, JSON.stringify(this.summariesExpanded));
    } catch (error) {
      console.error('Error saving summary expanded state:', error);
    }
  }

  private loadServicerSettings(): void {
    try {
      const stored = localStorage.getItem(this.servicerSettingsKey);
      if (stored) {
        const settings = JSON.parse(stored);
        this.servicer = settings.servicer || 'openai';
        this.model = settings.model || 'gpt-4o-mini';
      }
    } catch (error) {
      console.error('Error loading servicer settings:', error);
    }
  }

  private loadOllamaModels(): void {
    this.isLoadingModels = true;
    this.aiChatService.getOllamaModels()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (models) => {
          this.ollamaModels = models;
          this.isLoadingModels = false;

          // Validate model is available for the selected servicer after loading
          if (this.servicer === 'ollama' && !this.availableModels.includes(this.model)) {
            this.model = this.availableModels.length > 0 ? this.availableModels[0] : 'phi4';
            this.saveServicerSettings();
          }

          console.log(`Loaded ${models.length} Ollama models:`, models);
        },
        error: (error) => {
          console.error('Failed to load Ollama models:', error);
          this.ollamaModels = ['phi4']; // fallback
          this.isLoadingModels = false;
        }
      });
  }

  private saveServicerSettings(): void {
    try {
      const settings = {
        servicer: this.servicer,
        model: this.model
      };
      localStorage.setItem(this.servicerSettingsKey, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving servicer settings:', error);
    }
  }

  refreshOllamaModels(): void {
    if (this.servicer === 'ollama') {
      this.loadOllamaModels();
    }
  }

  onServicerChange(): void {
    // Reset model to first available when servicer changes
    this.model = this.availableModels.length > 0 ? this.availableModels[0] : '';

    // If switching to ollama and models aren't loaded yet, reload them
    if (this.servicer === 'ollama' && this.ollamaModels.length === 0) {
      this.loadOllamaModels();
    }

    this.saveServicerSettings();
  }

  onModelChange(): void {
    this.saveServicerSettings();
  }

  toggleSummariesExpanded(): void {
    this.summariesExpanded = !this.summariesExpanded;
    this.saveSummaryExpandedState();
  }

  private loadSummariesForCurrentSelection(): void {
    if (this.activeDocuments.length === 0) {
      this.documentSummaries = [];
      this.summariesLoading = false;
      return;
    }

    this.summariesLoading = true;
    const fileNames = this.activeDocuments.map(doc => doc.fileName);

    this.summaryService.loadSummariesForFiles(fileNames)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summaries) => {
          this.documentSummaries = summaries;
          this.summariesLoading = false;
          console.log(`Loaded ${summaries.length} summaries for ${fileNames.length} documents`);
        },
        error: (error) => {
          console.error('Error loading summaries:', error);
          this.documentSummaries = [];
          this.summariesLoading = false;
        }
      });
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;

      return date.toLocaleDateString();
    } catch (error) {
      return 'unknown';
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  }

  private triggerScrollToBottom(): void {
    this.shouldScrollToBottom = true;
  }

  private loadConversationForSelection() {
    if (!this.documentSelection || this.activeDocuments.length === 0) {
      this.messages = [];
      return;
    }

    const conversations = this.getStoredConversations();
    const conversationId = this.getConversationId();
    const existingConversation = conversations.find(c => c.conversationId === conversationId);

    if (existingConversation) {
      this.messages = existingConversation.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } else {
      this.initializeNewConversation();
    }

    setTimeout(() => this.triggerScrollToBottom(), 0);
  }

  private loadConversationForDocument() {
    if (!this.selectedDocument) return;

    const singleDocSelection: DocumentSelection = {
      selectedDocuments: [this.selectedDocument],
      isMultiSelect: false
    };
    this.documentSelection = singleDocSelection;
    this.loadConversationForSelection();
  }

  private initializeNewConversation() {
    if (this.activeDocuments.length === 0) return;

    let welcomeMessage: string;
    if (this.activeDocuments.length === 1) {
      welcomeMessage = `Hello! I'm ready to help you with "${this.activeDocuments[0].fileName}". What would you like to know about this document?`;
    } else {
      const docNames = this.activeDocuments.map(doc => `"${doc.fileName}"`).join(', ');
      welcomeMessage = `Hello! I'm ready to help you with these ${this.activeDocuments.length} documents: ${docNames}. What would you like to know about them?`;
    }

    this.messages = [{
      id: '1',
      content: welcomeMessage,
      isUser: false,
      timestamp: new Date()
    }];

    this.saveConversation();
    this.triggerScrollToBottom();
  }

  private getStoredConversations(): DocumentConversation[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading conversations from localStorage:', error);
      return [];
    }
  }

  private saveConversation() {
    if (this.activeDocuments.length === 0) return;

    try {
      const conversations = this.getStoredConversations();
      const conversationId = this.getConversationId();

      const conversationIndex = conversations.findIndex(c => c.conversationId === conversationId);
      const updatedConversation: DocumentConversation = {
        conversationId,
        documentNames: this.activeDocuments.map(doc => doc.fileName),
        isMultiDocument: this.isMultiDocumentMode,
        messages: this.messages,
        lastUpdated: new Date()
      };

      if (conversationIndex >= 0) {
        conversations[conversationIndex] = updatedConversation;
      } else {
        conversations.push(updatedConversation);
      }

      if (conversations.length > 50) {
        conversations.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        conversations.splice(50);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversation to localStorage:', error);
    }
  }

  private getConversationId(): string {
    if (this.isMultiDocumentMode) {
      const sortedNames = this.activeDocuments
        .map(doc => doc.fileName)
        .sort()
        .join('|');
      return `multi_${btoa(sortedNames)}`;
    } else if (this.activeDocuments.length === 1) {
      const doc = this.activeDocuments[0];
      return `single_${doc.fileName}_${doc.fileSize}_${doc.creationDate}`;
    }
    return 'empty';
  }

  private async buildContextualPrompt(userMessage: string): Promise<string> {
    try {
      if (this.activeDocuments.length === 0) {
        return userMessage;
      }

      // Build context with document information
      let contextualPrompt = `Context: The user is asking about the following document(s):\n\n`;

      for (const doc of this.activeDocuments) {
        contextualPrompt += `Document: ${doc.fileName}\n`;
        contextualPrompt += `Size: ${this.formatFileSize(doc.fileSize)}\n`;
        contextualPrompt += `Type: ${doc.fileExtension}\n`;
        contextualPrompt += `Created: ${new Date(doc.creationDate).toLocaleDateString()}\n`;

        // Try to get document content for better context
        try {
          const contentResponse = await this.fileManagementService.getFileContent(doc.fileName)
            .pipe(takeUntil(this.destroy$))
            .toPromise();

          if (contentResponse?.success && contentResponse.data?.content) {
            const content = contentResponse.data.content;
            // Limit content to prevent prompt overflow (adjust as needed)
            const truncatedContent = content.length > 2000
              ? content.substring(0, 2000) + '...'
              : content;
            contextualPrompt += `Content preview: ${truncatedContent}\n`;
          }
        } catch (error) {
          console.warn(`Could not load content for ${doc.fileName}:`, error);
          contextualPrompt += `Note: Content could not be loaded for analysis.\n`;
        }
        contextualPrompt += '\n';
      }

      contextualPrompt += `User Question: ${userMessage}\n\n`;
      contextualPrompt += `Please provide a helpful response based on the document(s) and user's question.`;

      return contextualPrompt;
    } catch (error) {
      console.error('Error building contextual prompt:', error);
      return userMessage;
    }
  }

  async sendMessage() {
    if (!this.currentMessage.trim() || this.activeDocuments.length === 0 || this.isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: this.currentMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.saveConversation();
    this.triggerScrollToBottom();

    const messageToSend = this.currentMessage;
    this.currentMessage = '';
    this.isLoading = true;

    try {
      // Build contextual prompt with document information
      const contextualPrompt = await this.buildContextualPrompt(messageToSend);

      // Send message to AI service with current servicer and model
      this.aiChatService.sendMessage(contextualPrompt, this.servicer, this.model)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && response.data?.response) {
              const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                content: response.data.response,
                isUser: false,
                timestamp: new Date()
              };

              this.messages.push(aiMessage);
              this.saveConversation();
              this.triggerScrollToBottom();
            } else {
              this.handleError('Failed to get response from AI service');
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error sending message:', error);
            this.handleError('Sorry, there was an error processing your message. Please try again.');
            this.isLoading = false;
          }
        });

    } catch (error) {
      console.error('Error preparing message:', error);
      this.handleError('Sorry, there was an error preparing your message. Please try again.');
      this.isLoading = false;
    }
  }

  private handleError(errorMessage: string) {
    const errorAiMessage: ChatMessage = {
      id: (Date.now() + 2).toString(),
      content: errorMessage,
      isUser: false,
      timestamp: new Date()
    };

    this.messages.push(errorAiMessage);
    this.saveConversation();
    this.triggerScrollToBottom();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  clearChat() {
    if (this.activeDocuments.length === 0) return;

    this.messages = [];
    this.initializeNewConversation();
  }

  exportChat() {
    if (this.activeDocuments.length === 0 || this.messages.length === 0) return;

    const chatData = {
      documents: this.activeDocuments.map(doc => doc.fileName),
      isMultiDocument: this.isMultiDocumentMode,
      exportDate: new Date().toISOString(),
      messages: this.messages,
      summaries: this.documentSummaries,
      servicer: this.servicer,
      model: this.model
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const filename = this.isMultiDocumentMode
      ? `multi-chat-${this.activeDocuments.length}-docs-${new Date().toISOString().split('T')[0]}.json`
      : `chat-${this.activeDocuments[0]?.fileName}-${new Date().toISOString().split('T')[0]}.json`;

    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isHtmlContent(content: string): boolean {
    return /<[a-z][\s\S]*>/i.test(content);
  }

  sanitizeHtml(html: string): string {
    // Basic HTML sanitization - remove script tags and event handlers
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '')
      .replace(/javascript:/gi, '');
  }
}
