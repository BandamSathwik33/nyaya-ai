export type UserType = 
  | "victim_complainant" 
  | "citizen_general" 
  | "student_researcher" 
  | "legal_advocate" 
  | "police_officer";

export type ResearchPurpose = 
  | "seeking_remedy" 
  | "reporting_crime" 
  | "academic_study" 
  | "case_preparation" 
  | "statutory_reference" 
  | "general_awareness";

export interface UserProfile {
  id: number;
  user_id: number;
  user_type: UserType;
  purpose: ResearchPurpose;
  background_notes?: string | null;
  experience_level: "beginner" | "intermediate" | "expert";
  preferred_language: string;
  is_onboarding_completed: boolean;
  created_at: string;
}

export interface UserDetail {
  id: number;
  email: string;
  full_name?: string | null;
  auth_provider: string;
  is_active: boolean;
  is_onboarding_completed: boolean;
  profile?: UserProfile | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  is_onboarding_completed: boolean;
  user_id: number;
  email: string;
  full_name?: string | null;
}

export interface OnboardingQuestionnaireRequest {
  user_type: UserType;
  purpose: ResearchPurpose;
  background_notes: string;
  experience_level?: "beginner" | "intermediate" | "expert";
  preferred_language?: string;
}
