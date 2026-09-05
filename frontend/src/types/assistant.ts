/**
 * UNNATI Voice-First Multilingual Assistant Types
 */

export interface SupportedLanguage {
  code: string;
  bcp47: string;
  name: string;
  native_name: string;
}

export type AssistantSender = 'user' | 'assistant' | 'system';

export type SpeechRecognitionState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'PERMISSION_DENIED'
  | 'UNAVAILABLE'
  | 'ERROR'
  | 'OFFLINE';

export interface ConsequentialAction {
  action_type: 'NAVIGATE_BOOKING' | 'CONFIRM_CANCELLATION' | 'REVIEW_PAYMENT' | 'NAVIGATE_SETTINGS' | string;
  label: string;
  target_url: string;
  payload?: Record<string, unknown>;
}

export interface AssistantMessage {
  id: string;
  sender: AssistantSender;
  text: string;
  spoken_text?: string;
  language: string;
  timestamp: string;
  is_verified_data?: boolean;
  is_advisory?: boolean;
  data_source?: string;
  requires_confirmation?: boolean;
  action?: ConsequentialAction;
  suggested_chips?: string[];
  is_offline_fallback?: boolean;
}

export interface AssistantQueryResponse {
  text: string;
  spoken_text: string;
  language: string;
  is_verified_data: boolean;
  is_advisory: boolean;
  data_source: string;
  requires_confirmation: boolean;
  action?: ConsequentialAction;
  suggested_chips?: string[];
  speech_config?: {
    bcp47: string;
    language_name: string;
    voice_pitch: number;
    voice_rate: number;
  };
  privacy?: {
    audio_retention: string;
    audio_stored: boolean;
    data_retention_policy: string;
  };
}
