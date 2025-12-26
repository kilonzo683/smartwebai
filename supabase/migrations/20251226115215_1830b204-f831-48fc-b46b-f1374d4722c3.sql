-- Create storage bucket for platform assets (logo, favicon, hero images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('platform-assets', 'platform-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Platform assets are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'platform-assets');

-- Create policy for authenticated users to upload (super admin only)
CREATE POLICY "Super admins can upload platform assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'platform-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create policy for super admins to update
CREATE POLICY "Super admins can update platform assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'platform-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create policy for super admins to delete
CREATE POLICY "Super admins can delete platform assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'platform-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);