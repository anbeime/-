export interface ArticleImage {
  id: string;
  file: File;
  previewUrl: string;
  base64: string; // Clean base64 without prefix for Gemini
  mimeType: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
  rawContent: string;
  formattedContent: string;
  images: ArticleImage[];
}

export enum ViewMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW'
}

export interface GenerationConfig {
  tone: 'professional' | 'casual' | 'emotional' | 'witty';
  includeEmoji: boolean;
}