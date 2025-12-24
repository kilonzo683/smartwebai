import { Mail, Calendar, Mic, Bell, FileText, Clock } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";

const quickActions = [
  { label: "Draft an email response", icon: Mail },
  { label: "Schedule a meeting", icon: Calendar },
  { label: "Convert voice note to task", icon: Mic },
  { label: "Set a reminder", icon: Bell },
  { label: "Summarize inbox", icon: FileText },
  { label: "Check today's schedule", icon: Clock },
];

export default function SecretaryAgent() {
  return (
    <div className="space-y-6">
      <AgentHeader
        name="AI Smart Secretary"
        description="Automate your communications, scheduling, and task management"
        icon={Mail}
        gradient="agent-card-secretary"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChatInterface
            agentName="Smart Secretary"
            agentColor="agent-card-secretary"
            placeholder="Ask me to draft emails, schedule meetings, or manage your tasks..."
          />
        </div>
        <div className="space-y-6">
          <QuickActions actions={quickActions} colorClass="text-agent-secretary" />
          
          {/* Stats Card */}
          <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Today's Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Emails Drafted</span>
                <span className="text-sm font-semibold text-agent-secretary">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Meetings Scheduled</span>
                <span className="text-sm font-semibold text-agent-secretary">4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Reminders Set</span>
                <span className="text-sm font-semibold text-agent-secretary">7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
