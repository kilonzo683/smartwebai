-- Create storage bucket for lecture documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('lecture-documents', 'lecture-documents', false);

-- Create storage policy for authenticated users to upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lecture-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policy for users to view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'lecture-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policy for users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lecture-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to track uploaded documents
CREATE TABLE public.lecture_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lecture_documents ENABLE ROW LEVEL SECURITY;

-- Document policies
CREATE POLICY "Users can view their own documents" ON public.lecture_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON public.lecture_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.lecture_documents
  FOR DELETE USING (auth.uid() = user_id);