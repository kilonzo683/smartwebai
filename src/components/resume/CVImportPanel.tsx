import { useState } from "react";
import { Upload, FileText, Sparkles, Loader2, ClipboardPaste } from "lucide-react";
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

export function CVImportPanel({ onImport, onCancel }: CVImportPanelProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const { toast } = useToast();

  const handleParseCV = async () => {
    if (!pastedText.trim()) {
      toast({
        title: "No content",
        description: "Please paste your CV content first.",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);

    try {
      const { data, error } = await supabase.functions.invoke('parse-cv', {
        body: { cvText: pastedText },
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

  return (
    <div className="space-y-4">
      <div className="text-center pb-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Import from Existing CV</h2>
        <p className="text-muted-foreground mt-1">
          Paste your CV content and AI will extract all the information
        </p>
      </div>

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
          className="min-h-[250px] font-mono text-sm"
        />
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-medium mb-2">💡 Tips for best results:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Include clear section headers (Experience, Education, Skills)</li>
          <li>• List job titles, companies, and dates for each position</li>
          <li>• Include your contact information at the top</li>
        </ul>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleParseCV} 
          disabled={isParsing || !pastedText.trim()}
          className="flex-1 gap-2"
        >
          {isParsing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Parsing with AI...
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
