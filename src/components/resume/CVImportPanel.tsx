import { useState, useRef } from "react";
import { Upload, FileText, Sparkles, Loader2, ClipboardPaste, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ResumeContent } from "@/types/resume";

interface CVImportPanelProps {
  onImport: (content: ResumeContent, title: string) => void;
  onCancel: () => void;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function CVImportPanel({ onImport, onCancel }: CVImportPanelProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("paste");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.name.endsWith('.txt')) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, Word document (.doc, .docx), or text file (.txt).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    // For text files, read directly
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      return await file.text();
    }

    // For PDF and Word documents, use the process-document edge function
    const formData = new FormData();
    formData.append('file', file);

    const { data, error } = await supabase.functions.invoke('process-document', {
      body: formData,
    });

    if (error) {
      throw new Error('Failed to process document: ' + error.message);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data?.text || data?.extractedText || '';
  };

  const handleParseCV = async () => {
    let textToParse = "";

    if (activeTab === "paste") {
      if (!pastedText.trim()) {
        toast({
          title: "No content",
          description: "Please paste your CV content first.",
          variant: "destructive",
        });
        return;
      }
      textToParse = pastedText;
    } else {
      if (!selectedFile) {
        toast({
          title: "No file selected",
          description: "Please select a CV file to upload.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsParsing(true);

    try {
      // Extract text from file if uploading
      if (activeTab === "upload" && selectedFile) {
        toast({
          title: "Processing file...",
          description: "Extracting text from your document.",
        });
        textToParse = await extractTextFromFile(selectedFile);
        
        if (!textToParse.trim()) {
          throw new Error("Could not extract text from the file. Please try pasting the content manually.");
        }
      }

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
        const content = data.resumeContent as ResumeContent;
        const title = content.personal?.full_name 
          ? `${content.personal.full_name}'s Resume` 
          : "Imported Resume";
        
        onImport(content, title);
        toast({
          title: "CV imported successfully!",
          description: "Your resume has been created with the extracted information.",
        });
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

  const isReadyToSubmit = activeTab === "paste" ? pastedText.trim().length > 0 : selectedFile !== null;

  return (
    <div className="space-y-4">
      <div className="text-center pb-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Import from Existing CV</h2>
        <p className="text-muted-foreground mt-1">
          Upload a file or paste your CV content
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paste" className="gap-2">
            <ClipboardPaste className="w-4 h-4" />
            Paste Text
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <FileText className="w-4 h-4" />
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
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <File className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">
                  PDF, Word (.doc, .docx), or Text files up to 10MB
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-medium mb-2">💡 Tips for best results:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Include clear section headers (Experience, Education, Skills)</li>
          <li>• List job titles, companies, and dates for each position</li>
          <li>• Include your contact information at the top</li>
          {activeTab === "upload" && (
            <li>• PDF files with text (not scanned images) work best</li>
          )}
        </ul>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleParseCV} 
          disabled={isParsing || !isReadyToSubmit}
          className="flex-1 gap-2"
        >
          {isParsing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {activeTab === "upload" ? "Processing..." : "Parsing..."}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Import & Create Resume
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
