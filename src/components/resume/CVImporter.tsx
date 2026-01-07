import { useState, useRef } from "react";
import { Upload, FileText, Sparkles, Loader2, X, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ResumeContent } from "@/types/resume";

interface CVImporterProps {
  onImport: (content: ResumeContent) => void;
}

export function CVImporter({ onImport }: CVImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, Word document, or plain text file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);

    // Extract text from the file
    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        setExtractedText(text);
      } else {
        // For PDF and Word files, read as text (basic extraction)
        // Note: For production, you'd want a proper document parsing service
        const text = await file.text();
        setExtractedText(text);
        
        toast({
          title: "File uploaded",
          description: "For best results with PDF/Word files, you may also paste the text content directly.",
        });
      }
    } catch (error) {
      toast({
        title: "Error reading file",
        description: "Could not read the file content. Try pasting the text instead.",
        variant: "destructive",
      });
    }
  };

  const handleParseCV = async (textToParse: string) => {
    if (!textToParse.trim()) {
      toast({
        title: "No content",
        description: "Please paste your CV content or upload a file first.",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);

    try {
      const { data, error } = await supabase.functions.invoke('parse-cv', {
        body: { cvText: textToParse },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.resumeContent) {
        onImport(data.resumeContent);
        toast({
          title: "CV imported successfully!",
          description: "Your resume has been populated with the extracted information.",
        });
        setIsOpen(false);
        resetState();
      }
    } catch (error: any) {
      console.error('Error parsing CV:', error);
      toast({
        title: "Failed to parse CV",
        description: error.message || "Could not extract information from the CV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const resetState = () => {
    setPastedText("");
    setUploadedFile(null);
    setExtractedText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Import from CV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Import from CV/Resume
          </DialogTitle>
          <DialogDescription>
            Upload your existing CV or paste its content, and AI will automatically extract and populate all your resume fields.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paste" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste" className="gap-2">
              <ClipboardPaste className="w-4 h-4" />
              Paste Text
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Paste your CV content</label>
              <Textarea
                placeholder="Copy and paste the entire content of your CV here...

Example:
John Doe
Software Engineer
john.doe@email.com | (555) 123-4567

EXPERIENCE
Senior Developer at Tech Corp (2020 - Present)
- Led development of microservices architecture
- Managed team of 5 developers

EDUCATION
BS Computer Science - MIT (2016-2020)

SKILLS
JavaScript, React, Node.js, Python..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            
            <Button 
              onClick={() => handleParseCV(pastedText)} 
              disabled={isParsing || !pastedText.trim()}
              className="w-full gap-2"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Parse & Import CV
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {uploadedFile ? (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 mx-auto text-primary" />
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetState();
                      }}
                      className="gap-1"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">
                      PDF, Word, or TXT files (max 5MB)
                    </p>
                  </div>
                )}
              </div>

              {extractedText && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Extracted text (you can edit)</label>
                  <Textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
              )}
            </div>

            <Button 
              onClick={() => handleParseCV(extractedText)} 
              disabled={isParsing || !extractedText.trim()}
              className="w-full gap-2"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Parse & Import CV
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">💡 Tips for best results:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Include clear section headers (Experience, Education, Skills, etc.)</li>
            <li>• List job titles, companies, and dates for each position</li>
            <li>• Include your contact information at the top</li>
            <li>• For PDF files, copying text directly often works better</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
