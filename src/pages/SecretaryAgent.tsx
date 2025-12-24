import { useState, useCallback, useRef } from "react";
import { Mail, Calendar, Mic, Bell, FileText, Clock } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";

const quickActions = [
  { label: "Draft an email response", icon: Mail, prompt: "Help me draft a professional email response" },
  { label: "Schedule a meeting", icon: Calendar, prompt: "Help me schedule a meeting for this week" },
  { label: "Convert voice note to task", icon: Mic, prompt: "Help me convert a voice note into actionable tasks" },
  { label: "Set a reminder", icon: Bell, prompt: "Set a reminder for me" },
  { label: "Summarize inbox", icon: FileText, prompt: "Summarize my recent inbox and highlight urgent messages" },
  { label: "Check today's schedule", icon: Clock, prompt: "Show me what's on my schedule for today" },
];

export default function SecretaryAgent() {
  const quickActionHandler = useRef<((action: string) => void) | null>(null);

  const handleQuickAction = useCallback((prompt: string) => {
    if (quickActionHandler.current) {
      quickActionHandler.current(prompt);
    }
  }, []);

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
            agentType="secretary"
            placeholder="Ask me to draft emails, schedule meetings, or manage your tasks..."
            onQuickAction={(handler) => { quickActionHandler.current = handler; }}
          />
        </div>
        <div className="space-y-6">
          <QuickActions 
            actions={quickActions} 
            colorClass="text-agent-secretary" 
            onActionClick={handleQuickAction}
          />
          
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
