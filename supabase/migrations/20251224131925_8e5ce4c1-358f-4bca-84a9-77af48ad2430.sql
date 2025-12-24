-- Social Media Content Calendar
CREATE TABLE IF NOT EXISTS public.social_content_calendar (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  platform text NOT NULL, -- 'twitter', 'instagram', 'linkedin', 'facebook', 'tiktok'
  post_type text DEFAULT 'post', -- 'post', 'story', 'reel', 'thread'
  hashtags text[] DEFAULT '{}',
  scheduled_at timestamp with time zone,
  status text DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed'
  media_urls text[] DEFAULT '{}',
  engagement_metrics jsonb DEFAULT '{}',
  approved_by uuid,
  approved_at timestamp with time zone,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.social_content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own content"
  ON public.social_content_calendar FOR ALL
  USING (auth.uid() = user_id);

-- Social Brand Profiles (for tone training)
CREATE TABLE IF NOT EXISTS public.social_brand_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  brand_name text NOT NULL,
  brand_voice text, -- 'professional', 'casual', 'playful', 'authoritative', etc.
  tone_examples jsonb DEFAULT '[]', -- Array of example posts for AI training
  target_audience text,
  key_topics text[] DEFAULT '{}',
  hashtag_groups jsonb DEFAULT '{}', -- Named groups of hashtags
  color_palette text[] DEFAULT '{}',
  do_not_use text[] DEFAULT '{}', -- Words/phrases to avoid
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, brand_name)
);

ALTER TABLE public.social_brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their brand profiles"
  ON public.social_brand_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Social Campaigns
CREATE TABLE IF NOT EXISTS public.social_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  start_date date,
  end_date date,
  goals jsonb DEFAULT '{}', -- { impressions: 10000, engagement: 5% }
  platforms text[] DEFAULT '{}',
  status text DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  performance_summary jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.social_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their campaigns"
  ON public.social_campaigns FOR ALL
  USING (auth.uid() = user_id);

-- Link content to campaigns
ALTER TABLE public.social_content_calendar 
ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.social_campaigns(id) ON DELETE SET NULL;

-- Lecturer: Student Performance Tracking
CREATE TABLE IF NOT EXISTS public.student_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL, -- the lecturer
  student_identifier text NOT NULL, -- anonymous or actual identifier
  quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
  topic_scores jsonb DEFAULT '{}', -- { "algebra": 75, "geometry": 60 }
  weak_topics text[] DEFAULT '{}',
  strong_topics text[] DEFAULT '{}',
  total_attempts integer DEFAULT 0,
  average_score numeric DEFAULT 0,
  last_attempt_at timestamp with time zone,
  feedback_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, student_identifier, quiz_id)
);

ALTER TABLE public.student_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecturers can manage student performance"
  ON public.student_performance FOR ALL
  USING (auth.uid() = user_id);

-- Lecturer: Generated Reports
CREATE TABLE IF NOT EXISTS public.lecturer_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  report_type text NOT NULL, -- 'quiz_summary', 'student_progress', 'topic_analysis', 'class_overview'
  content jsonb NOT NULL, -- The actual report data
  quiz_id uuid REFERENCES public.quizzes(id) ON DELETE SET NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_exported boolean DEFAULT false,
  export_format text, -- 'pdf', 'csv', 'json'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lecturer_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecturers can manage their reports"
  ON public.lecturer_reports FOR ALL
  USING (auth.uid() = user_id);

-- Add topic tags to quizzes for weak-topic detection
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS topics text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium';

-- Update triggers
CREATE TRIGGER update_social_content_calendar_updated_at
  BEFORE UPDATE ON public.social_content_calendar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_brand_profiles_updated_at
  BEFORE UPDATE ON public.social_brand_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_campaigns_updated_at
  BEFORE UPDATE ON public.social_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_performance_updated_at
  BEFORE UPDATE ON public.student_performance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();