import { GraduationCap, Upload, FileQuestion, ClipboardCheck, BarChart3, BookOpen } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";

const quickActions = [
  { label: "Upload lecture notes", icon: Upload },
  { label: "Generate a quiz", icon: FileQuestion },
  { label: "Auto-mark tests", icon: ClipboardCheck },
  { label: "View student analytics", icon: BarChart3 },
  { label: "Create summary", icon: BookOpen },
];

export default function LecturerAgent() {
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
            placeholder="Ask me to generate quizzes, summarize lectures, or track progress..."
          />
        </div>
        <div className="space-y-6">
          <QuickActions actions={quickActions} colorClass="text-agent-lecturer" />
          
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
