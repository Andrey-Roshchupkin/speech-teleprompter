/**
 * Global types and interfaces for Speech Teleprompter application
 * All types and interfaces are centralized here for reusability
 */

// ============================================================================
// Core Application Types
// ============================================================================

export interface TeleprompterState {
  // Display state
  currentPosition: number;
  matchedWords: string[];
  scriptWords: string[];
  displayWords: string[];

  // UI state
  isListening: boolean;
  isInPiP: boolean;
  pipWindow: Window | null;

  // Settings
  linesToShow: number;
  scrollTrigger: number;
  textSize: number;
  primaryLanguage: string;

  // Scroll state
  topLinePosition: number;
  lastScrollPosition: number;
  scrollCount: number;

  // Attachment state
  attachments: Attachment[];
  currentAttachment: Attachment | null;

  // Speech recognition state
  finalTranscript: string;
  interimTranscript: string;
  recognitionStatus: RecognitionStatus;
}

export type RecognitionStatus = 'listening' | 'stopped' | 'error';

// ============================================================================
// Speech Recognition Types
// ============================================================================

export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

// Extended interface for callback results
export interface SpeechRecognitionCallbackResult {
  newFinalWords: string[];
  speechOutputHTML: string;
}

export interface SpeechRecognitionCallbackStatus {
  status: 'listening' | 'stopped' | 'error';
  languageInfo: string;
}

export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResult[];
  resultIndex: number;
}

export interface SpeechRecognitionCallbacks {
  onResult: (
    newFinalWords: string[],
    speechOutputHTML: string
  ) => Promise<void>;
  onStatusChange: (status: RecognitionStatus, languageInfo: string) => void;
}

// ============================================================================
// Fuzzy Matching Types
// ============================================================================

export interface FuzzyMatchResult {
  newPosition: number;
  matchedIndices: number[];
  confidence: number;
  matchedWords: string[];
}

export interface FuzzyMatchConfig {
  precision: number;
  threshold: number;
  maxDistance: number;
}

// ============================================================================
// Teleprompter Display Types
// ============================================================================

export interface TeleprompterSettings {
  linesToShow: number;
  scrollTrigger: number;
  textSize: number;
  primaryLanguage: string;
  scriptText: string;
}

export interface TeleprompterDisplayConfig {
  container: HTMLElement;
  textElement: HTMLElement;
  progressElement: HTMLElement;
  attachmentElement: HTMLElement;
}

// ============================================================================
// Attachment Types
// ============================================================================

export interface Attachment {
  name: string;
  content: string;
  startWordIndex: number;
  endWordIndex: number;
  type?: AttachmentType;
}

export type AttachmentType = 'text' | 'image' | 'video' | 'audio';

// ============================================================================
// Picture-in-Picture Types
// ============================================================================

export interface PiPConfig {
  width: number;
  height: number;
  controls: HTMLElement;
  display: HTMLElement;
  attachment: HTMLElement;
}

export interface PiPElements {
  controls: HTMLElement | null;
  display: HTMLElement | null;
  attachment: HTMLElement | null;
}

// ============================================================================
// Local Storage Types
// ============================================================================

export interface StoredSettings {
  scriptText: string;
  linesToShow: number;
  scrollTrigger: number;
  textSize: number;
  primaryLanguage: string;
  logLevel: LogLevel;
}

export type LogLevel = 'off' | 'error' | 'info' | 'debug';

// ============================================================================
// Language Types
// ============================================================================

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export interface LanguageInfo {
  code: string;
  name: string;
  isSupported: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

export interface TeleprompterEvent {
  type: string;
  payload: unknown;
  timestamp: number;
  source: string;
}

export interface StateChangeEvent extends TeleprompterEvent {
  type: 'state-change';
  payload: {
    key: keyof TeleprompterState;
    oldValue: unknown;
    newValue: unknown;
  };
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface BaseComponentProps {
  id?: string;
  class?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
}

export interface ButtonProps extends BaseComponentProps {
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'neutral';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

export interface InputProps extends BaseComponentProps {
  type: 'text' | 'number' | 'email' | 'password' | 'search';
  value: string | number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectProps extends BaseComponentProps {
  options: LanguageOption[];
  value: string;
  disabled?: boolean;
  required?: boolean;
}

export interface TextareaProps extends BaseComponentProps {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  cols?: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface TeleprompterError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
  source: string;
}

export type ErrorCode =
  | 'SPEECH_RECOGNITION_NOT_SUPPORTED'
  | 'SPEECH_RECOGNITION_ERROR'
  | 'FUZZY_MATCH_ERROR'
  | 'STORAGE_ERROR'
  | 'PIP_NOT_SUPPORTED'
  | 'PIP_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_SETTINGS: TeleprompterSettings = {
  scriptText: '',
  linesToShow: 5,
  scrollTrigger: 3,
  textSize: 24,
  primaryLanguage: 'en-US',
} as const;

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)' },
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)' },
  {
    code: 'de-DE',
    name: 'German (Germany)',
    nativeName: 'Deutsch (Deutschland)',
  },
  { code: 'it-IT', name: 'Italian (Italy)', nativeName: 'Italiano (Italia)' },
  {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
  },
  {
    code: 'pt-PT',
    name: 'Portuguese (Portugal)',
    nativeName: 'Português (Portugal)',
  },
  { code: 'ru-RU', name: 'Russian (Russia)', nativeName: 'Русский (Россия)' },
  { code: 'ja-JP', name: 'Japanese (Japan)', nativeName: '日本語 (日本)' },
  {
    code: 'ko-KR',
    name: 'Korean (South Korea)',
    nativeName: '한국어 (대한민국)',
  },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文 (简体)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)' },
  {
    code: 'ar-SA',
    name: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية (السعودية)',
  },
  { code: 'hi-IN', name: 'Hindi (India)', nativeName: 'हिन्दी (भारत)' },
  {
    code: 'nl-NL',
    name: 'Dutch (Netherlands)',
    nativeName: 'Nederlands (Nederland)',
  },
  { code: 'sv-SE', name: 'Swedish (Sweden)', nativeName: 'Svenska (Sverige)' },
  { code: 'no-NO', name: 'Norwegian (Norway)', nativeName: 'Norsk (Norge)' },
  { code: 'da-DK', name: 'Danish (Denmark)', nativeName: 'Dansk (Danmark)' },
  { code: 'fi-FI', name: 'Finnish (Finland)', nativeName: 'Suomi (Suomi)' },
  { code: 'pl-PL', name: 'Polish (Poland)', nativeName: 'Polski (Polska)' },
  { code: 'tr-TR', name: 'Turkish (Turkey)', nativeName: 'Türkçe (Türkiye)' },
  { code: 'he-IL', name: 'Hebrew (Israel)', nativeName: 'עברית (ישראל)' },
  { code: 'th-TH', name: 'Thai (Thailand)', nativeName: 'ไทย (ประเทศไทย)' },
  {
    code: 'vi-VN',
    name: 'Vietnamese (Vietnam)',
    nativeName: 'Tiếng Việt (Việt Nam)',
  },
] as const;

export const LOG_LEVELS: readonly LogLevel[] = [
  'off',
  'error',
  'info',
  'debug',
] as const;

export const BUTTON_VARIANTS = [
  'primary',
  'secondary',
  'success',
  'danger',
  'neutral',
] as const;
export const BUTTON_SIZES = ['small', 'medium', 'large'] as const;
export const INPUT_TYPES = [
  'text',
  'number',
  'email',
  'password',
  'search',
] as const;
export const SELECT_SIZES = ['small', 'medium', 'large'] as const;
export const TEXTAREA_SIZES = ['small', 'medium', 'large'] as const;

// Type definitions for component props
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type InputType = (typeof INPUT_TYPES)[number];
export type SelectSize = (typeof SELECT_SIZES)[number];
export type TextareaSize = (typeof TEXTAREA_SIZES)[number];
