-- Create resumes table
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'My Resume',
  template TEXT NOT NULL DEFAULT 'modern',
  status TEXT NOT NULL DEFAULT 'draft',
  content JSONB NOT NULL DEFAULT '{
    "personal": {
      "full_name": "",
      "email": "",
      "phone": "",
      "location": "",
      "linkedin": "",
      "website": "",
      "summary": ""
    },
    "experiences": [],
    "education": [],
    "skills": [],
    "projects": [],
    "certifications": [],
    "languages": [],
    "custom_sections": []
  }'::jsonb,
  section_order TEXT[] NOT NULL DEFAULT ARRAY['personal', 'summary', 'experiences', 'education', 'skills', 'projects', 'certifications', 'languages'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resume versions table for history
CREATE TABLE public.resume_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resume_id, version_number)
);

-- Enable RLS
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for resumes
CREATE POLICY "Users can view their own resumes"
ON public.resumes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resumes"
ON public.resumes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes"
ON public.resumes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes"
ON public.resumes FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for resume_versions
CREATE POLICY "Users can view versions of their resumes"
ON public.resume_versions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.resumes 
  WHERE resumes.id = resume_versions.resume_id 
  AND resumes.user_id = auth.uid()
));

CREATE POLICY "Users can create versions of their resumes"
ON public.resume_versions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.resumes 
  WHERE resumes.id = resume_versions.resume_id 
  AND resumes.user_id = auth.uid()
));

CREATE POLICY "Users can delete versions of their resumes"
ON public.resume_versions FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.resumes 
  WHERE resumes.id = resume_versions.resume_id 
  AND resumes.user_id = auth.uid()
));

-- Create updated_at trigger for resumes
CREATE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resume_versions_resume_id ON public.resume_versions(resume_id);