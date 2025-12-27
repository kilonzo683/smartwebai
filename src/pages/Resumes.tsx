import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, FileText, MoreVertical, Trash2, Copy, 
  Edit, Loader2, Search, Grid, List,
  Calendar, Clock, Sparkles, PenTool
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResumes } from "@/hooks/useResumes";
import { Resume, ResumeContent, RESUME_TEMPLATES } from "@/types/resume";
import { AIResumeGenerator } from "@/components/resume/AIResumeGenerator";
import { format } from "date-fns";
export default function Resumes() {
  const navigate = useNavigate();
  const { resumes, isLoading, createResume, deleteResume, duplicateResume } = useResumes();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"choice" | "manual" | "ai">("choice");
  const [newResumeTitle, setNewResumeTitle] = useState("My Resume");

  const filteredResumes = resumes.filter(resume =>
    resume.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateResume = async () => {
    const result = await createResume.mutateAsync({ title: newResumeTitle });
    setCreateDialogOpen(false);
    setCreateMode("choice");
    setNewResumeTitle("My Resume");
    navigate(`/resumes/${result.id}`);
  };

  const handleAIGenerated = async (content: ResumeContent, title: string) => {
    const result = await createResume.mutateAsync({ title, content });
    setCreateDialogOpen(false);
    setCreateMode("choice");
    navigate(`/resumes/${result.id}`);
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setCreateMode("choice");
    setNewResumeTitle("My Resume");
  };

  const handleDeleteResume = async () => {
    if (selectedResume) {
      await deleteResume.mutateAsync(selectedResume.id);
      setDeleteDialogOpen(false);
      setSelectedResume(null);
    }
  };

  const handleDuplicateResume = async (resume: Resume) => {
    const result = await duplicateResume.mutateAsync(resume);
    navigate(`/resumes/${result.id}`);
  };

  const getTemplateInfo = (templateId: string) => {
    return RESUME_TEMPLATES.find(t => t.id === templateId) || RESUME_TEMPLATES[0];
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">CV & Resume Builder</h1>
            <p className="text-muted-foreground mt-1">Create professional resumes in minutes</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Resume
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search resumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
            <TabsList>
              <TabsTrigger value="grid">
                <Grid className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredResumes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resumes yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first resume to get started
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Resume
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResumes.map((resume) => (
              <Card key={resume.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{resume.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getTemplateInfo(resume.template).name}
                        </Badge>
                        <Badge 
                          variant={resume.status === 'published' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {resume.status}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/resumes/${resume.id}`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateResume(resume)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            setSelectedResume(resume);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent 
                  className="pb-3"
                  onClick={() => navigate(`/resumes/${resume.id}`)}
                >
                  <div className="aspect-[8.5/11] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    <div className="text-center p-4">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {resume.content.personal.full_name || 'No name set'}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(resume.created_at), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(resume.updated_at), 'h:mm a')}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResumes.map((resume) => (
              <Card 
                key={resume.id} 
                className="group hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/resumes/${resume.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{resume.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Updated {format(new Date(resume.updated_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2">
                      <Badge variant="secondary">{getTemplateInfo(resume.template).name}</Badge>
                      <Badge variant={resume.status === 'published' ? 'default' : 'outline'}>
                        {resume.status}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/resumes/${resume.id}`);
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateResume(resume);
                        }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResume(resume);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className={createMode === "ai" ? "max-w-3xl" : ""}>
            {createMode === "choice" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Create New Resume</DialogTitle>
                  <DialogDescription>
                    Choose how you want to create your resume
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 md:grid-cols-2">
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setCreateMode("ai")}
                  >
                    <CardContent className="pt-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">AI-Powered</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter your profession and contact info, and AI will generate a complete professional resume
                      </p>
                      <Badge className="mt-3" variant="secondary">Recommended</Badge>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setCreateMode("manual")}
                  >
                    <CardContent className="pt-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <PenTool className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">Manual Entry</h3>
                      <p className="text-sm text-muted-foreground">
                        Start with a blank resume and fill in all details yourself
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : createMode === "manual" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Create New Resume</DialogTitle>
                  <DialogDescription>
                    Give your resume a name to get started.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Resume title"
                    value={newResumeTitle}
                    onChange={(e) => setNewResumeTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateResume();
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateMode("choice")}>
                    Back
                  </Button>
                  <Button onClick={handleCreateResume} disabled={createResume.isPending}>
                    {createResume.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Resume
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <AIResumeGenerator 
                onGenerated={handleAIGenerated}
                onCancel={() => setCreateMode("choice")}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Resume</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedResume?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteResume}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteResume.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
