import { useCallback, useRef } from "react";
import { HeadphonesIcon, MessageSquare, Upload, AlertTriangle, BarChart3, Users } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";

const quickActions = [
  { label: "Upload knowledge base", icon: Upload, prompt: "Help me upload and process a knowledge base document for customer support" },
  { label: "View open tickets", icon: MessageSquare, prompt: "Show me the current open support tickets that need attention" },
  { label: "Check escalations", icon: AlertTriangle, prompt: "List any tickets that have been escalated and need immediate attention" },
  { label: "View analytics", icon: BarChart3, prompt: "Show me customer support analytics and performance metrics" },
  { label: "Manage team", icon: Users, prompt: "Help me manage the support team assignments and workload" },
];

export default function SupportAgent() {
  const quickActionHandler = useRef<((action: string) => void) | null>(null);

  const handleQuickAction = useCallback((prompt: string) => {
    if (quickActionHandler.current) {
      quickActionHandler.current(prompt);
    }
  }, []);

  return (
    <div className="space-y-6">
      <AgentHeader
        name="AI Customer Support Agent"
        description="Handle customer inquiries, resolve tickets, and provide 24/7 support"
        icon={HeadphonesIcon}
        gradient="agent-card-support"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChatInterface
            agentName="Customer Support"
            agentColor="agent-card-support"
            agentType="support"
            placeholder="Ask about tickets, FAQs, or customer inquiries..."
            onQuickAction={(handler) => { quickActionHandler.current = handler; }}
          />
        </div>
        <div className="space-y-6">
          <QuickActions 
            actions={quickActions} 
            colorClass="text-agent-support"
            onActionClick={handleQuickAction}
          />
          
          {/* Stats Card */}
          <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Support Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Open Tickets</span>
                <span className="text-sm font-semibold text-agent-support">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Resolved Today</span>
                <span className="text-sm font-semibold text-agent-support">34</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Satisfaction Rate</span>
                <span className="text-sm font-semibold text-agent-support">96%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
