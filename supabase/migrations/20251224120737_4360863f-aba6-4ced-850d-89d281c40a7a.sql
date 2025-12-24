-- Create support knowledge base documents table
CREATE TABLE public.support_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own support documents" 
  ON public.support_documents FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own support documents" 
  ON public.support_documents FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own support documents" 
  ON public.support_documents FOR DELETE 
  USING (auth.uid() = user_id);

-- Create storage bucket for support documents
INSERT INTO storage.buckets (id, name, public) VALUES ('support-documents', 'support-documents', false);

-- Storage policies
CREATE POLICY "Users can upload support documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'support-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their support documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'support-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their support documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'support-documents' AND auth.uid()::text = (storage.foldername(name))[1]);