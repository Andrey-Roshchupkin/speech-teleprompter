import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Attachment, RecognitionStatus } from '@/types/global';

export const useTeleprompterStore = defineStore('teleprompter', () => {
  // Core teleprompter state
  const scriptText = ref('');
  const currentPosition = ref(0);
  const matchedWords = ref<string[]>([]);
  const scriptWords = ref<string[]>([]);
  const displayWords = ref<string[]>([]);

  // UI state
  const isListening = ref(false);
  const isInPiP = ref(false);
  const pipWindow = ref<Window | null>(null);

  // Settings
  const linesToShow = ref(5);
  const scrollTrigger = ref(3);
  const textSize = ref(24);
  const primaryLanguage = ref('en-US');

  // Scroll state
  const topLinePosition = ref(0);
  const lastScrollPosition = ref(0);
  const scrollCount = ref(0);

  // Attachment state
  const attachments = ref<Attachment[]>([]);
  const currentAttachment = ref<Attachment | null>(null);

  // Speech recognition state
  const finalTranscript = ref('');
  const interimTranscript = ref('');
  const recognitionStatus = ref<RecognitionStatus>('stopped');

  // Computed properties
  const progress = computed(() => {
    if (scriptWords.value.length === 0) return 0;
    return Math.round((currentPosition.value / scriptWords.value.length) * 100);
  });

  const isAtEnd = computed(() => {
    return currentPosition.value >= scriptWords.value.length - 1;
  });

  const isAtStart = computed(() => {
    return currentPosition.value <= 0;
  });

  // Actions
  const updateScript = (text: string) => {
    scriptText.value = text;
    scriptWords.value = text.split(/\s+/).filter((word) => word.length > 0);
    displayWords.value = [...scriptWords.value];
    currentPosition.value = 0;
    matchedWords.value = [];
  };

  const updatePosition = (position: number) => {
    const oldPosition = currentPosition.value;
    currentPosition.value = Math.max(
      0,
      Math.min(position, scriptWords.value.length - 1)
    );

    // Update matched words
    if (currentPosition.value > oldPosition) {
      matchedWords.value = scriptWords.value.slice(0, currentPosition.value);
    } else if (currentPosition.value < oldPosition) {
      matchedWords.value = scriptWords.value.slice(0, currentPosition.value);
    }
  };

  const updateMatchedWords = (words: string[]) => {
    matchedWords.value = words;
  };

  const updateSpeechState = (
    isListeningState: boolean,
    status: RecognitionStatus
  ) => {
    isListening.value = isListeningState;
    recognitionStatus.value = status;
  };

  const updatePiPState = (inPiP: boolean, window: Window | null = null) => {
    isInPiP.value = inPiP;
    pipWindow.value = window;
  };

  const updateSettings = (settings: {
    linesToShow?: number;
    scrollTrigger?: number;
    textSize?: number;
    primaryLanguage?: string;
  }) => {
    if (settings.linesToShow !== undefined)
      linesToShow.value = settings.linesToShow;
    if (settings.scrollTrigger !== undefined)
      scrollTrigger.value = settings.scrollTrigger;
    if (settings.textSize !== undefined) textSize.value = settings.textSize;
    if (settings.primaryLanguage !== undefined)
      primaryLanguage.value = settings.primaryLanguage;
  };

  const updateAttachments = (newAttachments: Attachment[]) => {
    attachments.value = newAttachments;
  };

  const updateCurrentAttachment = (attachment: Attachment | null) => {
    currentAttachment.value = attachment;
  };

  const updateScrollState = (
    topLine: number,
    lastScroll: number,
    count: number
  ) => {
    topLinePosition.value = topLine;
    lastScrollPosition.value = lastScroll;
    scrollCount.value = count;
  };

  const reset = () => {
    currentPosition.value = 0;
    matchedWords.value = [];
    topLinePosition.value = 0;
    lastScrollPosition.value = 0;
    scrollCount.value = 0;
    currentAttachment.value = null;
    finalTranscript.value = '';
    interimTranscript.value = '';
    recognitionStatus.value = 'stopped';
    isListening.value = false;
  };

  return {
    // State
    scriptText,
    currentPosition,
    matchedWords,
    scriptWords,
    displayWords,
    isListening,
    isInPiP,
    pipWindow,
    linesToShow,
    scrollTrigger,
    textSize,
    primaryLanguage,
    topLinePosition,
    lastScrollPosition,
    scrollCount,
    attachments,
    currentAttachment,
    finalTranscript,
    interimTranscript,
    recognitionStatus,

    // Computed
    progress,
    isAtEnd,
    isAtStart,

    // Actions
    updateScript,
    updatePosition,
    updateMatchedWords,
    updateSpeechState,
    updatePiPState,
    updateSettings,
    updateAttachments,
    updateCurrentAttachment,
    updateScrollState,
    reset,
  };
});
