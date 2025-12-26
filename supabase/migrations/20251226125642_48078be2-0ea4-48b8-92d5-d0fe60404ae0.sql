-- Create a public storage bucket for social media assets (flyers, images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-media-assets',
  'social-media-assets',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from the bucket (public assets)
CREATE POLICY "Public read access for social media assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'social-media-assets');

-- Allow authenticated users to upload assets
CREATE POLICY "Authenticated users can upload social media assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'social-media-assets');

-- Allow service role to upload (for edge functions)
CREATE POLICY "Service role can upload social media assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'social-media-assets');