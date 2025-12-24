import { useState, useEffect } from "react";
import { Trash2, MessageSquare, BookOpen, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Document {
  id: string;
  file_name: string;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
  extracted_text: string | null;
}

interface KnowledgeBaseLibraryProps {
  onAskQuestion: (document: Document) => void;
  onCreateFAQ: (document: Document) => void;
  refreshKey?: number;
}

export function KnowledgeBaseLibrary({ onAskQuestion, onCreateFAQ, refreshKey }: KnowledgeBaseLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("support_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to load knowledge base",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchDocuments();
    });

    return () => subscription.unsubscribe();
  }, [refreshKey]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const doc = documents.find(d => d.id === deleteId);
      
      const { error } = await supabase
        .from("support_documents")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.id !== deleteId));
      toast({
        title: "Document deleted",
        description: `${doc?.file_name} has been removed from knowledge base`,
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (contentType: string | null) => {
    if (contentType?.includes("pdf")) return "📄";
    if (contentType?.includes("word") || contentType?.includes("document")) return "📝";
    if (contentType?.includes("text")) return "📃";
    return "📁";
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "400ms" }}>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Knowledge Base</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Knowledge Base</h3>
          <span className="text-xs text-muted-foreground">{documents.length} files</span>
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No documents yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Upload FAQs, guides, or product docs
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-start gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors"
              >
                <span className="text-lg flex-shrink-0">{getFileIcon(doc.content_type)}</span>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate" title={doc.file_name}>
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onAskQuestion(doc)}
                    title="Ask Question"
                  >
                    <MessageSquare className="w-4 h-4 text-agent-support" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onCreateFAQ(doc)}
                    title="Generate FAQ"
                  >
                    <BookOpen className="w-4 h-4 text-agent-support" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDeleteId(doc.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this from the knowledge base? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}