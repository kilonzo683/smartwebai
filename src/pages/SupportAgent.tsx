import { HeadphonesIcon, MessageSquare, Upload, AlertTriangle, BarChart3, Users } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";

const quickActions = [
  { label: "Upload knowledge base", icon: Upload },
  { label: "View open tickets", icon: MessageSquare },
  { label: "Check escalations", icon: AlertTriangle },
  { label: "View analytics", icon: BarChart3 },
  { label: "Manage team", icon: Users },
];

export default function SupportAgent() {
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
            placeholder="Ask about tickets, FAQs, or customer inquiries..."
          />
        </div>
        <div className="space-y-6">
          <QuickActions actions={quickActions} colorClass="text-agent-support" />
          
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
