import { useState, useCallback, useRef, useEffect } from "react";
import { Mail, Calendar, Mic, Bell, FileText, Clock } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { TaskDashboard } from "@/components/secretary/TaskDashboard";
import { RemindersList } from "@/components/secretary/RemindersList";
import { CalendarWidget } from "@/components/secretary/CalendarWidget";
import { EmailDrafts } from "@/components/secretary/EmailDrafts";
import { VoiceRecorder } from "@/components/secretary/VoiceRecorder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const quickActions = [
  { label: "Draft an email", icon: Mail, prompt: "Help me draft a professional email response" },
  { label: "Schedule meeting", icon: Calendar, prompt: "Help me schedule a meeting for this week" },
  { label: "Voice to task", icon: Mic, prompt: "__VOICE_RECORD__" },
  { label: "Set reminder", icon: Bell, prompt: "Set a reminder for me" },
  { label: "Summarize inbox", icon: FileText, prompt: "Summarize my recent messages and highlight urgent items with priority detection" },
  { label: "Today's schedule", icon: Clock, prompt: "Show me what's on my schedule for today and check availability" },
];

export default function SecretaryAgent() {
  const quickActionHandler = useRef<((action: string) => void) | null>(null);
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: 0, reminders: 0, events: 0, drafts: 0 });
  const [showVoicePrompt, setShowVoicePrompt] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      const [tasksRes, remindersRes, eventsRes, draftsRes] = await Promise.all([
        supabase.from("secretary_tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "completed"),
        supabase.from("secretary_reminders").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_completed", false),
        supabase.from("secretary_calendar_events").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("start_time", new Date().toISOString()),
        supabase.from("secretary_email_drafts").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "draft"),
      ]);

      setStats({
        tasks: tasksRes.count || 0,
        reminders: remindersRes.count || 0,
        events: eventsRes.count || 0,
        drafts: draftsRes.count || 0,
      });
    };
    fetchStats();
  }, [user]);

  const handleQuickAction = useCallback((prompt: string) => {
    if (prompt === "__VOICE_RECORD__") {
      setShowVoicePrompt(true);
      return;
    }
    if (quickActionHandler.current) {
      quickActionHandler.current(prompt);
    }
  }, []);

  const handleVoiceTranscription = useCallback((text: string) => {
    setShowVoicePrompt(false);
    if (quickActionHandler.current) {
      quickActionHandler.current(`Convert this voice note to actionable tasks:\n\n"${text}"\n\nPlease extract tasks, detect priority levels, and suggest any calendar events or reminders.`);
    }
  }, []);

  return (
    <div className="space-y-6">
      <AgentHeader
        name="AI Smart Secretary"
        description="Email management, scheduling, task automation & voice-to-task conversion"
        icon={Mail}
        gradient="agent-card-secretary"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <ChatInterface
            agentName="Smart Secretary"
            agentColor="agent-card-secretary"
            agentType="secretary"
            placeholder="Ask me to draft emails, schedule meetings, or manage your tasks..."
            onQuickAction={(handler) => { quickActionHandler.current = handler; }}
          />
          
          {showVoicePrompt && (
            <div className="glass rounded-xl p-4 flex items-center gap-4">
              <VoiceRecorder onTranscription={handleVoiceTranscription} />
              <span className="text-sm text-muted-foreground">Click the mic to record a voice note, then click again to stop and convert to tasks.</span>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <QuickActions 
            actions={quickActions} 
            colorClass="text-agent-secretary" 
            onActionClick={handleQuickAction}
          />
          
          {/* Stats Card */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded-lg bg-accent/30">
                <p className="text-lg font-bold">{stats.tasks}</p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-accent/30">
                <p className="text-lg font-bold">{stats.reminders}</p>
                <p className="text-xs text-muted-foreground">Reminders</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-accent/30">
                <p className="text-lg font-bold">{stats.events}</p>
                <p className="text-xs text-muted-foreground">Events</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-accent/30">
                <p className="text-lg font-bold">{stats.drafts}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="tasks" className="animate-slide-up">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-4">
          <TaskDashboard />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <CalendarWidget />
        </TabsContent>
        <TabsContent value="reminders" className="mt-4">
          <RemindersList />
        </TabsContent>
        <TabsContent value="emails" className="mt-4">
          <EmailDrafts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
