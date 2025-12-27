import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Save, Download, Eye, History, Settings, 
  Loader2, FileText, Plus, GripVertical, Trash2, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useResume, useResumes } from "@/hooks/useResumes";
import { Resume, ResumeContent, RESUME_TEMPLATES } from "@/types/resume";
import { PersonalInfoEditor } from "@/components/resume/PersonalInfoEditor";
import { ExperienceEditor } from "@/components/resume/ExperienceEditor";
import { EducationEditor } from "@/components/resume/EducationEditor";
import { SkillsEditor } from "@/components/resume/SkillsEditor";
import { ProjectsEditor } from "@/components/resume/ProjectsEditor";
import { CertificationsEditor } from "@/components/resume/CertificationsEditor";
import { LanguagesEditor } from "@/components/resume/LanguagesEditor";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { VersionHistory } from "@/components/resume/VersionHistory";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/contexts/BrandingContext";

export default function ResumeBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { branding } = useBranding();
  const { resume, versions, isLoading, saveVersion, restoreVersion, deleteVersion, refetch } = useResume(id);
  const { updateResume } = useResumes();
  
  const [localContent, setLocalContent] = useState<ResumeContent | null>(null);
  const [localTitle, setLocalTitle] = useState("");
  const [localTemplate, setLocalTemplate] = useState("modern");
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    experiences: true,
    education: true,
    skills: true,
  });

  useEffect(() => {
    if (resume) {
      setLocalContent(resume.content);
      setLocalTitle(resume.title);
      setLocalTemplate(resume.template);
    }
  }, [resume]);

  const saveChanges = useCallback(async () => {
    if (!id || !localContent) return;
    
    setIsSaving(true);
    try {
      await updateResume.mutateAsync({
        id,
        title: localTitle,
        template: localTemplate,
        content: localContent,
      });
    } finally {
      setIsSaving(false);
    }
  }, [id, localContent, localTitle, localTemplate, updateResume]);

  // Auto-save with debounce
  useEffect(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    
    if (localContent && resume) {
      const timer = setTimeout(() => {
        saveChanges();
      }, 2000);
      setAutoSaveTimer(timer);
    }

    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [localContent, localTitle, localTemplate]);

  const updateContent = useCallback((updates: Partial<ResumeContent>) => {
    setLocalContent(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleExport = async () => {
    // Open preview in print mode
    setShowPreview(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!resume || !localContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Resume not found</h2>
          <Button onClick={() => navigate("/resumes")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resumes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/resumes")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="font-semibold text-lg border-none bg-transparent focus-visible:ring-1 max-w-[200px] md:max-w-[300px]"
            />
            {isSaving && (
              <Badge variant="secondary" className="animate-pulse">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Saving...
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={localTemplate} onValueChange={setLocalTemplate}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                {RESUME_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <History className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Version History</SheetTitle>
                </SheetHeader>
                <VersionHistory
                  versions={versions}
                  onSaveVersion={() => saveVersion.mutate()}
                  onRestoreVersion={(v) => restoreVersion.mutate(v)}
                  onDeleteVersion={(id) => deleteVersion.mutate(id)}
                  isSaving={saveVersion.isPending}
                />
              </SheetContent>
            </Sheet>

            <Button variant="outline" size="icon" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="w-4 h-4" />
            </Button>

            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>

            <Button onClick={saveChanges} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container px-4 py-6">
        <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-3xl mx-auto'}`}>
          {/* Editor Panel */}
          <div className="space-y-4">
            {/* Personal Info */}
            <Collapsible open={expandedSections.personal} onOpenChange={() => toggleSection('personal')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                      <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.personal ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <PersonalInfoEditor
                      personal={localContent.personal}
                      onChange={(personal) => updateContent({ personal })}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Experience */}
            <Collapsible open={expandedSections.experiences} onOpenChange={() => toggleSection('experiences')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Work Experience</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{localContent.experiences.length}</Badge>
                        <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.experiences ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <ExperienceEditor
                      experiences={localContent.experiences}
                      onChange={(experiences) => updateContent({ experiences })}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Education */}
            <Collapsible open={expandedSections.education} onOpenChange={() => toggleSection('education')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Education</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{localContent.education.length}</Badge>
                        <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.education ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <EducationEditor
                      education={localContent.education}
                      onChange={(education) => updateContent({ education })}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Skills */}
            <Collapsible open={expandedSections.skills} onOpenChange={() => toggleSection('skills')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Skills</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{localContent.skills.length}</Badge>
                        <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.skills ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <SkillsEditor
                      skills={localContent.skills}
                      onChange={(skills) => updateContent({ skills })}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Projects */}
            <Collapsible open={expandedSections.projects} onOpenChange={() => toggleSection('projects')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Projects</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{localContent.projects.length}</Badge>
                        <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.projects ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <ProjectsEditor
                      projects={localContent.projects}
                      onChange={(projects) => updateContent({ projects })}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Certifications */}
            <Collapsible open={expandedSections.certifications} onOpenChange={() => toggleSection('certifications')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Certifications</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{localContent.certifications.length}</Badge>
                        <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.certifications ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <CertificationsEditor
                      certifications={localContent.certifications}
                      onChange={(certifications) => updateContent({ certifications })}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Languages */}
            <Collapsible open={expandedSections.languages} onOpenChange={() => toggleSection('languages')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Languages</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{localContent.languages.length}</Badge>
                        <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.languages ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <LanguagesEditor
                      languages={localContent.languages}
                      onChange={(languages) => updateContent({ languages })}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-auto border rounded-lg bg-white shadow-lg print:shadow-none">
              <ResumePreview
                content={localContent}
                template={localTemplate}
              />
            </div>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: A4;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          #resume-preview,
          #resume-preview * {
            visibility: visible !important;
          }
          
          #resume-preview {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          
          header, nav, .sticky, button, .border-b {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
