export type JobStatus =
  | "pending"
  | "processing"
  | "finished"
  | "skipped"
  | "failed"
  | "expired"
  | "canceled";

export interface Badge {
  id: string;
  title: string;
  desc: string;
}

export interface Onboarding {
  upload_first: boolean;
  download_result: boolean;
  share_referral: boolean;
  complete: boolean;
}

export interface Level {
  level_name: string;
  level_icon: string;
  level_min: number;
  level_progress: number;
  videos_to_next: number;
  next_level_name: string | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  plan: "free" | "pro";
  credits: number;
  created_at: string;
  videos_processed: number;
  referral_code: string | null;
  has_api_key: boolean;
  daily_bonus?: number;
  streak_days: number;
  badges: Badge[];
  onboarding: Onboarding | null;
  referral_count: number;
  level: Level | null;
  credits_reset_at?: string | null;
  auth_provider?: string | null;
}

export interface ActivityItem {
  watermark_type: string | null;
  resolution: string | null;
  from_cache: boolean;
  processing_sec: number | null;
  at: string;
}

export interface Job {
  id: string;
  status: JobStatus;
  progress: number;
  original_name: string;
  watermark_type: string | null;
  error_message: string | null;
  duration_sec: number | null;
  width: number | null;
  height: number | null;
  output_width: number | null;
  output_height: number | null;
  created_at: string;
  finished_at: string | null;
  expires_at: string | null;
  from_cache: boolean;
  processing_sec: number | null;
  download_url: string | null;
  queue_position: number | null;
  eta_sec: number | null;
  has_preview: boolean;
  quality_matched: boolean | null;
}

export interface UserSummary {
  total_processing_sec: number;
  cache_hits: number;
  finished_jobs: number;
}

export interface Stats {
  videos_cleaned: number;
  users: number;
  avg_processing_sec: number | null;
  queue_depth: number;
  cache_hits: number;
}
