import { useCallback, useRef, useState } from "react";
import { GraduationCap, Upload, FileQuestion, ClipboardCheck, BarChart3, BookOpen } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FileUpload } from "@/components/chat/FileUpload";
import { DocumentLibrary } from "@/components/lecturer/DocumentLibrary";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Document {
  id: string;
  file_name: string;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
  extracted_text: string | null;
}

const quickActions = [
  { label: "Upload lecture notes", icon: Upload, prompt: "__UPLOAD_DOCUMENT__" },
  { label: "Generate a quiz", icon: FileQuestion, prompt: "__GENERATE_QUIZ__" },
  { label: "Auto-mark tests", icon: ClipboardCheck, prompt: "Help me auto-grade the latest batch of student tests" },
  { label: "View student analytics", icon: BarChart3, prompt: "Show me student performance analytics and weak topic areas" },
  { label: "Create summary", icon: BookOpen, prompt: "Create a summary of the recent lecture material for students" },
];

export default function LecturerAgent() {
  const quickActionHandler = useRef<((action: string) => void) | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"extract" | "quiz">("extract");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleQuickAction = useCallback((prompt: string) => {
    if (prompt === "__UPLOAD_DOCUMENT__") {
      setUploadMode("extract");
      setUploadDialogOpen(true);
      return;
    }
    if (prompt === "__GENERATE_QUIZ__") {
      setUploadMode("quiz");
      setUploadDialogOpen(true);
      return;
    }
    if (quickActionHandler.current) {
      quickActionHandler.current(prompt);
    }
  }, []);

  const handleFileProcessed = useCallback((result: { fileName: string; content?: string; quiz?: string }) => {
    setUploadDialogOpen(false);
    setRefreshKey(prev => prev + 1); // Refresh document library
    
    if (result.quiz && quickActionHandler.current) {
      quickActionHandler.current(`I've generated a quiz from "${result.fileName}":\n\n${result.quiz}`);
    } else if (result.content && quickActionHandler.current) {
      quickActionHandler.current(`I've uploaded "${result.fileName}". The document has been processed and saved. What would you like me to do with it? I can:\n\n• Generate quiz questions\n• Create a summary\n• Identify key concepts\n• Create study notes`);
    }
  }, []);

  const handleGenerateQuizFromDoc = useCallback((doc: Document) => {
    if (quickActionHandler.current && doc.extracted_text) {
      quickActionHandler.current(`Generate a multiple choice quiz based on this document "${doc.file_name}":\n\nContent:\n${doc.extracted_text.slice(0, 5000)}`);
    } else if (quickActionHandler.current) {
      quickActionHandler.current(`Please generate a quiz from the document "${doc.file_name}". I'll need you to help me extract key concepts and create questions.`);
    }
  }, []);

  const handleCreateSummaryFromDoc = useCallback((doc: Document) => {
    if (quickActionHandler.current && doc.extracted_text) {
      quickActionHandler.current(`Create a comprehensive summary of this document "${doc.file_name}":\n\nContent:\n${doc.extracted_text.slice(0, 5000)}`);
    } else if (quickActionHandler.current) {
      quickActionHandler.current(`Please create a summary of the document "${doc.file_name}". Include the main topics, key points, and important concepts.`);
    }
  }, []);

  return (
    <div className="space-y-6">
      <AgentHeader
        name="AI Lecturer Assistant"
        description="Create quizzes, grade tests, and help students learn more effectively"
        icon={GraduationCap}
        gradient="agent-card-lecturer"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChatInterface
            agentName="Lecturer Assistant"
            agentColor="agent-card-lecturer"
            agentType="lecturer"
            placeholder="Ask me to generate quizzes, summarize lectures, or track progress..."
            onQuickAction={(handler) => { quickActionHandler.current = handler; }}
          />
        </div>
        <div className="space-y-6">
          <QuickActions 
            actions={quickActions} 
            colorClass="text-agent-lecturer"
            onActionClick={handleQuickAction}
          />
          
          {/* Document Library */}
          <DocumentLibrary
            key={refreshKey}
            onGenerateQuiz={handleGenerateQuizFromDoc}
            onCreateSummary={handleCreateSummaryFromDoc}
          />
          
          {/* Upload Dialog */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {uploadMode === "quiz" ? "Generate Quiz from Document" : "Upload Lecture Notes"}
                </DialogTitle>
              </DialogHeader>
              
              <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "extract" | "quiz")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="extract">Upload Only</TabsTrigger>
                  <TabsTrigger value="quiz">Generate Quiz</TabsTrigger>
                </TabsList>
                
                <TabsContent value="extract" className="mt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your lecture notes to store them for future reference and quiz generation.
                  </p>
                  <FileUpload 
                    onFileProcessed={handleFileProcessed}
                    generateQuiz={false}
                  />
                </TabsContent>
                
                <TabsContent value="quiz" className="mt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a document and automatically generate quiz questions based on its content.
                  </p>
                  <FileUpload 
                    onFileProcessed={handleFileProcessed}
                    generateQuiz={true}
                  />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          
          {/* Stats Card */}
          <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Teaching Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Quizzes Created</span>
                <span className="text-sm font-semibold text-agent-lecturer">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Tests Auto-Graded</span>
                <span className="text-sm font-semibold text-agent-lecturer">156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Avg Student Score</span>
                <span className="text-sm font-semibold text-agent-lecturer">78%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
