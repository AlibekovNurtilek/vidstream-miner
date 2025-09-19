// API Types for YouTube Data Collection System

export interface User {
  username: string;
  role: UserRole;
}

export enum UserRole {
  ADMIN = "admin",
  ANNOTATOR = "annotator", 
  VIEWER = "viewer"
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: UserRole;
}

export enum DatasetStatus {
  INITIALIZING = "INITIALIZING",
  SAMPLING = "SAMPLING", 
  SAMPLED = "SAMPLED",
  TRANSCRIBING = "TRANSCRIBING",
  FAILED_TRANSCRIPTION = "FAILED_TRANSCRIPTION",
  SEMY_TRANSCRIBED = "SEMY_TRANSCRIBED",
  REVIEW = "REVIEW",
  READY = "READY",
  ERROR = "ERROR"
}

export interface Dataset {
  id: number;
  name: string;
  url: string;
  source_rel_path: string;
  segments_rel_dir: string;
  count_of_samples: number;
  duration: number | null;
  status: DatasetStatus;
  created_at: string;
  last_update: string;
}

export interface DatasetsResponse {
  items: Dataset[];
  total: number;
}

export interface DatasetFilters {
  status?: DatasetStatus;
  name_search?: string;
  created_from?: string;
  created_to?: string;
  limit?: number;
  offset?: number;
}

export enum SampleStatus {
  NEW = "NEW",
  IN_PROGRESS = "IN_PROGRESS", 
  COMPLETED = "COMPLETED",
  REVIEWED = "REVIEWED"
}

export interface Sample {
  id: number;
  dataset_id: number;
  filename: string;
  text: string | null;
  duration: number;
  status: SampleStatus;
  created_at: string;
}

export interface SamplesResponse {
  dataset_id: number;
  page: number;
  limit: number;
  samples: Sample[];
  total: number;
}

export interface CreateDatasetRequest {
  url: string;
  min_duration: number;
  max_duration: number;
}

export interface ApiError {
  detail: string;
}