import { useCallback, useRef, useState, useEffect } from "react";
import { HeadphonesIcon, MessageSquare, Upload, AlertTriangle, BarChart3, Users, BookOpen, Tag } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { KnowledgeBaseLibrary } from "@/components/support/KnowledgeBaseLibrary";
import { SupportFileUpload } from "@/components/support/SupportFileUpload";
import { TicketManager } from "@/components/support/TicketManager";
import { ResolutionLogger } from "@/components/support/ResolutionLogger";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/hooks/use-toast";

interface Document {
  id: string;
  file_name: string;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
  extracted_text: string | null;
}

const quickActions = [
  { label: "Upload knowledge base", icon: Upload, prompt: "__UPLOAD_KB__" },
  { label: "View open tickets", icon: MessageSquare, prompt: "Show me the current open support tickets that need attention" },
  { label: "Check escalations", icon: AlertTriangle, prompt: "List any tickets that have been escalated and need immediate attention" },
  { label: "View analytics", icon: BarChart3, prompt: "Show me customer support analytics and performance metrics" },
  { label: "Log resolution", icon: BookOpen, prompt: "__LOG_RESOLUTION__" },
];

export default function SupportAgent() {
  const quickActionHandler = useRef<((action: string) => void) | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { currentOrg } = useOrganization();
  const [stats, setStats] = useState({ 
    openTickets: 0, 
    resolvedToday: 0, 
    kbDocs: 0,
    avgSatisfaction: 0,
    escalationRate: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentOrg) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [openTicketsRes, resolvedTodayRes, kbDocsRes, resolutionsRes] = await Promise.all([
        supabase.from("escalation_tickets").select("id", { count: "exact", head: true })
          .eq("organization_id", currentOrg.id).in("status", ["open", "in_progress"]),
        supabase.from("escalation_tickets").select("id", { count: "exact", head: true })
          .eq("organization_id", currentOrg.id).eq("status", "resolved").gte("resolved_at", today.toISOString()),
        supabase.from("knowledge_base").select("id", { count: "exact", head: true })
          .eq("organization_id", currentOrg.id).eq("is_active", true),
        supabase.from("support_resolutions").select("customer_satisfaction, was_escalated")
          .eq("organization_id", currentOrg.id).limit(100),
      ]);

      // Calculate average satisfaction
      let avgSatisfaction = 0;
      let escalationRate = 0;
      if (resolutionsRes.data && resolutionsRes.data.length > 0) {
        const withRatings = resolutionsRes.data.filter(r => r.customer_satisfaction);
        if (withRatings.length > 0) {
          avgSatisfaction = withRatings.reduce((acc, r) => acc + (r.customer_satisfaction || 0), 0) / withRatings.length;
        }
        const escalated = resolutionsRes.data.filter(r => r.was_escalated).length;
        escalationRate = Math.round((escalated / resolutionsRes.data.length) * 100);
      }

      setStats({
        openTickets: openTicketsRes.count || 0,
        resolvedToday: resolvedTodayRes.count || 0,
        kbDocs: kbDocsRes.count || 0,
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
        escalationRate,
      });
    };
    fetchStats();
  }, [currentOrg, refreshKey]);

  const handleQuickAction = useCallback((prompt: string) => {
    if (prompt === "__UPLOAD_KB__") {
      setUploadDialogOpen(true);
      return;
    }
    if (prompt === "__LOG_RESOLUTION__") {
      setResolutionDialogOpen(true);
      return;
    }
    if (quickActionHandler.current) {
      quickActionHandler.current(prompt);
    }
  }, []);

  const handleFileProcessed = useCallback((result: { fileName: string; content?: string }) => {
    setUploadDialogOpen(false);
    setRefreshKey(prev => prev + 1);
    
    if (result.content && quickActionHandler.current) {
      quickActionHandler.current(`I've added "${result.fileName}" to the knowledge base. I can now help answer questions based on this document. What would you like to know?`);
    }
  }, []);

  const handleAskQuestion = useCallback((doc: Document) => {
    if (quickActionHandler.current && doc.extracted_text) {
      quickActionHandler.current(`Based on the knowledge base document "${doc.file_name}", help me answer customer questions. Here's the document content for context:\n\n${doc.extracted_text.slice(0, 5000)}`);
    } else if (quickActionHandler.current) {
      quickActionHandler.current(`Help me use the knowledge base document "${doc.file_name}" to answer customer questions.`);
    }
  }, []);

  const handleCreateFAQ = useCallback((doc: Document) => {
    if (quickActionHandler.current && doc.extracted_text) {
      quickActionHandler.current(`Generate a FAQ document based on "${doc.file_name}":\n\nContent:\n${doc.extracted_text.slice(0, 5000)}`);
    } else if (quickActionHandler.current) {
      quickActionHandler.current(`Create a FAQ section based on the document "${doc.file_name}".`);
    }
  }, []);

  const handleEscalate = useCallback((ticketId: string) => {
    if (quickActionHandler.current) {
      quickActionHandler.current(`I need to escalate ticket ${ticketId}. Please help me document the escalation reason and notify the appropriate team.`);
    }
  }, []);

  const handleTakeover = useCallback((ticketId: string) => {
    if (quickActionHandler.current) {
      quickActionHandler.current(`I'm now handling ticket ${ticketId}. Please provide me with the full context and any relevant knowledge base articles to help resolve this issue.`);
    }
  }, []);

  return (
    <div className="space-y-6">
      <AgentHeader
        name="AI Customer Support Agent"
        description="Handle customer inquiries, resolve tickets, and provide 24/7 support with intelligent escalation"
        icon={HeadphonesIcon}
        gradient="agent-card-support"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <ChatInterface
            agentName="Customer Support"
            agentColor="agent-card-support"
            agentType="support"
            placeholder="Ask about tickets, FAQs, or customer inquiries..."
            onQuickAction={(handler) => { quickActionHandler.current = handler; }}
          />
        </div>
        
        <div className="space-y-4">
          <QuickActions 
            actions={quickActions} 
            colorClass="text-agent-support"
            onActionClick={handleQuickAction}
          />
          
          {/* Ticket Queue */}
          <TicketManager 
            onEscalate={handleEscalate}
            onTakeover={handleTakeover}
            refreshKey={refreshKey}
          />
          
          {/* Knowledge Base Library */}
          <KnowledgeBaseLibrary
            onAskQuestion={handleAskQuestion}
            onCreateFAQ={handleCreateFAQ}
            refreshKey={refreshKey}
          />
          
          {/* Upload Dialog */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload to Knowledge Base</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mb-4">
                Upload FAQs, product guides, or support documentation to help answer customer questions.
              </p>
              <SupportFileUpload onFileProcessed={handleFileProcessed} />
            </DialogContent>
          </Dialog>
          
          {/* Resolution Logger Dialog */}
          <ResolutionLogger
            isOpen={resolutionDialogOpen}
            onClose={() => setResolutionDialogOpen(false)}
            onLogged={() => setRefreshKey(prev => prev + 1)}
          />
          
          {/* Stats Card */}
          <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Support Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Open Tickets</span>
                <span className="text-sm font-semibold text-agent-support">{stats.openTickets}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Resolved Today</span>
                <span className="text-sm font-semibold text-agent-support">{stats.resolvedToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">KB Documents</span>
                <span className="text-sm font-semibold text-agent-support">{stats.kbDocs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Avg Satisfaction</span>
                <span className="text-sm font-semibold text-agent-support">
                  {stats.avgSatisfaction > 0 ? `${stats.avgSatisfaction}/5` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Escalation Rate</span>
                <span className="text-sm font-semibold text-agent-support">
                  {stats.escalationRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
