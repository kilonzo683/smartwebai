import { useState, useCallback } from "react";
import { Upload, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SupportFileUploadProps {
  onFileProcessed: (result: { fileName: string; content?: string }) => void;
}

export function SupportFileUpload({ onFileProcessed }: SupportFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to upload documents.",
          variant: "destructive",
        });
        return;
      }

      // Upload to storage
      const filePath = `${session.user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("support-documents")
        .upload(filePath, selectedFile, {
          contentType: selectedFile.type,
        });

      if (uploadError) throw uploadError;

      // Extract text for text-based files
      let extractedText = "";
      const textTypes = ["text/plain", "text/markdown", "application/json"];
      
      if (textTypes.includes(selectedFile.type) || 
          selectedFile.name.endsWith(".txt") || 
          selectedFile.name.endsWith(".md")) {
        extractedText = await selectedFile.text();
      } else {
        extractedText = `[Document: ${selectedFile.name}] - Knowledge base document uploaded.`;
      }

      // Save to database
      const { error: dbError } = await supabase
        .from("support_documents")
        .insert({
          user_id: session.user.id,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          content_type: selectedFile.type,
          extracted_text: extractedText.slice(0, 50000),
        });

      if (dbError) throw dbError;

      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} added to knowledge base`,
      });

      onFileProcessed({ fileName: selectedFile.name, content: extractedText });
      setSelectedFile(null);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-agent-support bg-agent-support/10"
            : "border-muted-foreground/25 hover:border-agent-support/50"
        )}
        onClick={() => document.getElementById("support-file-input")?.click()}
      >
        <input
          id="support-file-input"
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.md,.json"
        />
        
        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-agent-support" />
            <p className="font-medium text-sm">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm font-medium">Drop file here or click to browse</p>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, TXT, MD (Max 20MB)
            </p>
          </div>
        )}
      </div>

      {selectedFile && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload to Knowledge Base
            </>
          )}
        </Button>
      )}
    </div>
  );
}