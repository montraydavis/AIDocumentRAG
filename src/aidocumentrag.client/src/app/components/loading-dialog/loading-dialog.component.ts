import { Component, Input } from '@angular/core';

export interface LoadingState {
  isLoading: boolean;
  message: string;
  progress?: number;
  details?: string;
}

@Component({
  selector: 'app-loading-dialog',
  templateUrl: './loading-dialog.component.html',
  styleUrls: ['./loading-dialog.component.css'],
  standalone: false
})
export class LoadingDialogComponent {
  @Input() loadingState: LoadingState = {
    isLoading: false,
    message: 'Loading...'
  };

  get progressPercentage(): number {
    return this.loadingState.progress || 0;
  }

  get hasProgress(): boolean {
    return this.loadingState.progress !== undefined;
  }
}
