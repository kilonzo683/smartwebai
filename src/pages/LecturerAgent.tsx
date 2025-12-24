import { useCallback, useRef } from "react";
import { GraduationCap, Upload, FileQuestion, ClipboardCheck, BarChart3, BookOpen } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";

const quickActions = [
  { label: "Upload lecture notes", icon: Upload, prompt: "Help me upload and process lecture notes for quiz generation" },
  { label: "Generate a quiz", icon: FileQuestion, prompt: "Generate a multiple choice quiz based on recent lecture material" },
  { label: "Auto-mark tests", icon: ClipboardCheck, prompt: "Help me auto-grade the latest batch of student tests" },
  { label: "View student analytics", icon: BarChart3, prompt: "Show me student performance analytics and weak topic areas" },
  { label: "Create summary", icon: BookOpen, prompt: "Create a summary of the recent lecture material for students" },
];

export default function LecturerAgent() {
  const quickActionHandler = useRef<((action: string) => void) | null>(null);

  const handleQuickAction = useCallback((prompt: string) => {
    if (quickActionHandler.current) {
      quickActionHandler.current(prompt);
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
