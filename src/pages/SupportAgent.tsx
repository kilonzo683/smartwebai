import { useCallback, useRef, useState, useEffect } from "react";
import { HeadphonesIcon, MessageSquare, Upload, AlertTriangle, BarChart3, Users } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { KnowledgeBaseLibrary } from "@/components/support/KnowledgeBaseLibrary";
import { SupportFileUpload } from "@/components/support/SupportFileUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

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
  { label: "Manage team", icon: Users, prompt: "Help me manage the support team assignments and workload" },
];

export default function SupportAgent() {
  const quickActionHandler = useRef<((action: string) => void) | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { currentOrg } = useOrganization();
  const [stats, setStats] = useState({ openTickets: 0, resolvedToday: 0, kbDocs: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentOrg) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [openTicketsRes, resolvedTodayRes, kbDocsRes] = await Promise.all([
        supabase.from("escalation_tickets").select("id", { count: "exact", head: true })
          .eq("organization_id", currentOrg.id).in("status", ["open", "in_progress"]),
        supabase.from("escalation_tickets").select("id", { count: "exact", head: true })
          .eq("organization_id", currentOrg.id).eq("status", "resolved").gte("resolved_at", today.toISOString()),
        supabase.from("knowledge_base").select("id", { count: "exact", head: true })
          .eq("organization_id", currentOrg.id).eq("is_active", true),
      ]);

      setStats({
        openTickets: openTicketsRes.count || 0,
        resolvedToday: resolvedTodayRes.count || 0,
        kbDocs: kbDocsRes.count || 0,
      });
    };
    fetchStats();
  }, [currentOrg, refreshKey]);

  const handleQuickAction = useCallback((prompt: string) => {
    if (prompt === "__UPLOAD_KB__") {
      setUploadDialogOpen(true);
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}