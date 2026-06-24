export type WebsiteTopicAngle = "pain_point" | "curiosity" | "contrarian";

export type WebsiteTopicFormat = "4:5" | "9:16";

export interface WebsiteIngestTopicSuggestion {
  topic: string;
  angle: WebsiteTopicAngle;
  rationale: string;
  recommendedFormat: WebsiteTopicFormat;
}

export interface WebsiteIngestResult {
  businessName: string;
  description: string;
  audience: string;
  topics: WebsiteIngestTopicSuggestion[];
  productImageUrl: string | null;
  logoImageUrl: string | null;
  sourceUrl: string;
}

export interface WebsiteIngestCompletePayload {
  businessName: string;
  description: string;
  audience: string;
  topics: WebsiteIngestTopicSuggestion[];
  productImageUrl: string | null;
  logoImageUrl: string | null;
  sourceUrl: string;
}

export interface WebsiteIngestApiSuccess {
  success: true;
  businessName: string;
  description: string;
  audience: string;
  topics: WebsiteIngestTopicSuggestion[];
  productImageUrl: string | null;
  logoImageUrl: string | null;
  sourceUrl: string;
}

export interface WebsiteIngestApiFailure {
  success: false;
  error: string;
  code?: string;
}

export type WebsiteIngestApiResponse =
  | WebsiteIngestApiSuccess
  | WebsiteIngestApiFailure;

export interface TopicSelectionOptions {
  recommendedFormat?: WebsiteTopicFormat;
}
