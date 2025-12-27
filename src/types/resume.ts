export interface ResumePersonal {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  photo_url?: string;
  profession?: string;
}

export interface ResumeExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface ResumeSkill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
}

export interface ResumeProject {
  id: string;
  name: string;
  description: string;
  url: string;
  technologies: string[];
}

export interface ResumeCertification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date: string;
  credential_url: string;
}

export interface ResumeLanguage {
  id: string;
  language: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

export interface ResumeCustomSection {
  id: string;
  title: string;
  items: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
  }[];
}

export interface ResumeContent {
  personal: ResumePersonal;
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkill[];
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  languages: ResumeLanguage[];
  custom_sections: ResumeCustomSection[];
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  template: string;
  status: 'draft' | 'published';
  content: ResumeContent;
  section_order: string[];
  created_at: string;
  updated_at: string;
}

export interface ResumeVersion {
  id: string;
  resume_id: string;
  version_number: number;
  title: string;
  snapshot: ResumeContent;
  created_at: string;
}

export const defaultResumeContent: ResumeContent = {
  personal: {
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    summary: '',
    photo_url: '',
    profession: '',
  },
  experiences: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  custom_sections: [],
};

export const RESUME_TEMPLATES = [
  { id: 'modern', name: 'Modern', description: 'Clean and contemporary design' },
  { id: 'classic', name: 'Classic', description: 'Traditional professional look' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' },
  { id: 'creative', name: 'Creative', description: 'Bold and eye-catching' },
] as const;

export const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
] as const;

export const LANGUAGE_PROFICIENCY = [
  { value: 'basic', label: 'Basic' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'native', label: 'Native' },
] as const;
