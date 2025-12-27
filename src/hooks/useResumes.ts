import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Resume, ResumeContent, ResumeVersion, defaultResumeContent } from '@/types/resume';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

// Helper to safely cast JSON to Resume
function parseResume(data: any): Resume {
  return {
    ...data,
    content: data.content as ResumeContent,
    status: data.status as 'draft' | 'published',
  };
}

// Helper to safely cast JSON to ResumeVersion
function parseVersion(data: any): ResumeVersion {
  return {
    ...data,
    snapshot: data.snapshot as ResumeContent,
  };
}

export function useResumes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resumesQuery = useQuery({
    queryKey: ['resumes', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(parseResume);
    },
    enabled: !!user,
  });

  const createResume = useMutation({
    mutationFn: async ({ title = 'My Resume', content }: { title?: string; content?: ResumeContent } = {}) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('resumes')
        .insert([{
          user_id: user.id,
          title,
          content: (content || defaultResumeContent) as unknown as Json,
        }])
        .select()
        .single();

      if (error) throw error;
      return parseResume(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast({ title: 'Resume created', description: 'Your new resume is ready to edit.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateResume = useMutation({
    mutationFn: async ({ id, content, ...updates }: Partial<Resume> & { id: string }) => {
      const updateData: any = { ...updates };
      if (content) {
        updateData.content = content as unknown as Json;
      }
      
      const { data, error } = await supabase
        .from('resumes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return parseResume(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
    onError: (error) => {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    },
  });

  const deleteResume = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('resumes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast({ title: 'Resume deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const duplicateResume = useMutation({
    mutationFn: async (resume: Resume) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('resumes')
        .insert([{
          user_id: user.id,
          title: `${resume.title} (Copy)`,
          template: resume.template,
          content: resume.content as unknown as Json,
          section_order: resume.section_order,
        }])
        .select()
        .single();

      if (error) throw error;
      return parseResume(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast({ title: 'Resume duplicated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    resumes: resumesQuery.data || [],
    isLoading: resumesQuery.isLoading,
    error: resumesQuery.error,
    createResume,
    updateResume,
    deleteResume,
    duplicateResume,
    refetch: resumesQuery.refetch,
  };
}

export function useResume(id: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resumeQuery = useQuery({
    queryKey: ['resume', id],
    queryFn: async () => {
      if (!id) throw new Error('No resume ID');
      
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return parseResume(data);
    },
    enabled: !!user && !!id,
  });

  const versionsQuery = useQuery({
    queryKey: ['resume-versions', id],
    queryFn: async () => {
      if (!id) throw new Error('No resume ID');
      
      const { data, error } = await supabase
        .from('resume_versions')
        .select('*')
        .eq('resume_id', id)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return (data || []).map(parseVersion);
    },
    enabled: !!user && !!id,
  });

  const saveVersion = useMutation({
    mutationFn: async () => {
      if (!id || !resumeQuery.data) throw new Error('No resume data');

      const versions = versionsQuery.data || [];
      const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version_number)) + 1 : 1;

      const { data, error } = await supabase
        .from('resume_versions')
        .insert([{
          resume_id: id,
          version_number: nextVersion,
          title: `Version ${nextVersion}`,
          snapshot: resumeQuery.data.content as unknown as Json,
        }])
        .select()
        .single();

      if (error) throw error;
      return parseVersion(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-versions', id] });
      toast({ title: 'Version saved', description: 'A snapshot of your resume has been saved.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const restoreVersion = useMutation({
    mutationFn: async (version: ResumeVersion) => {
      if (!id) throw new Error('No resume ID');

      const { data, error } = await supabase
        .from('resumes')
        .update({ content: version.snapshot as unknown as Json })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return parseResume(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume', id] });
      toast({ title: 'Version restored', description: 'Your resume has been restored to the selected version.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteVersion = useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase.from('resume_versions').delete().eq('id', versionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-versions', id] });
      toast({ title: 'Version deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    resume: resumeQuery.data,
    versions: versionsQuery.data || [],
    isLoading: resumeQuery.isLoading,
    isVersionsLoading: versionsQuery.isLoading,
    error: resumeQuery.error,
    refetch: resumeQuery.refetch,
    saveVersion,
    restoreVersion,
    deleteVersion,
  };
}
