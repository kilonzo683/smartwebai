import { useState, useRef } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "success" | "error";
}

interface FileUploadProps {
  onFileProcessed: (result: { fileName: string; content?: string; quiz?: string }) => void;
  accept?: string;
  generateQuiz?: boolean;
}

export function FileUpload({ 
  onFileProcessed, 
  accept = ".pdf,.doc,.docx,.txt,.md,.pptx",
  generateQuiz = false 
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  };

  const processFiles = async (newFiles: File[]) => {
    // Validate file size (max 20MB)
    const validFiles = newFiles.filter(file => {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsProcessing(true);

    for (const file of validFiles) {
      const fileId = Date.now().toString();
      
      setFiles(prev => [...prev, {
        id: fileId,
        name: file.name,
        size: file.size,
        status: "uploading",
      }]);

      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) {
          toast({
            title: "Authentication required",
            description: "Please sign in to upload documents",
            variant: "destructive",
          });
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, status: "error" } : f
          ));
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("action", generateQuiz ? "quiz" : "extract");

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.session.access_token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        const result = await response.json();

        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: "success" } : f
        ));

        onFileProcessed({
          fileName: file.name,
          content: result.document?.extracted_text,
          quiz: result.quiz,
        });

        toast({
          title: "Document uploaded",
          description: result.quiz 
            ? `Quiz generated from ${file.name}` 
            : `${file.name} processed successfully`,
        });

      } catch (error) {
        console.error("Upload error:", error);
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: "error" } : f
        ));
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Could not process file",
          variant: "destructive",
        });
      }
    }

    setIsProcessing(false);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
          isDragging 
            ? "border-primary bg-primary/10" 
            : "border-border hover:border-primary/50 hover:bg-accent/50",
          isProcessing && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-2">
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {isProcessing ? "Processing..." : "Drop files here or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, Word, PowerPoint, Text files (max 20MB)
            </p>
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg"
            >
              <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {file.status === "uploading" ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : file.status === "success" ? (
                <span className="text-xs text-green-500 font-medium">Done</span>
              ) : (
                <span className="text-xs text-red-500 font-medium">Error</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
