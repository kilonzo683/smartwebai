import { useState } from "react";
import { Sparkles, Loader2, User, Briefcase, Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ResumeContent } from "@/types/resume";

interface AIResumeGeneratorProps {
  onGenerated: (content: ResumeContent, title: string) => void;
  onCancel: () => void;
}

export function AIResumeGenerator({ onGenerated, onCancel }: AIResumeGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    profession: "",
    yearsExperience: "3",
    linkedin: "",
    website: "",
  });

  const handleGenerate = async () => {
    if (!formData.fullName || !formData.email || !formData.profession) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least your name, email, and profession.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-resume", {
        body: {
          ...formData,
          yearsExperience: parseInt(formData.yearsExperience),
        },
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.resume) {
        onGenerated(data.resume, `${formData.profession} Resume`);
        toast({
          title: "Resume Generated!",
          description: "Your AI-powered resume is ready. You can now edit and customize it.",
        });
      }
    } catch (error) {
      console.error("Error generating resume:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">AI Resume Generator</CardTitle>
        <CardDescription>
          Enter your basic details and profession, and we'll generate a complete professional resume for you.
          You can customize everything afterward.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name *
            </Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone
            </Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="New York, NY"
              value={formData.location}
              onChange={(e) => updateField("location", e.target.value)}
            />
          </div>

          {/* Profession */}
          <div className="space-y-2">
            <Label htmlFor="profession" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Profession/Job Title *
            </Label>
            <Input
              id="profession"
              placeholder="Software Engineer"
              value={formData.profession}
              onChange={(e) => updateField("profession", e.target.value)}
            />
          </div>

          {/* Years of Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Select value={formData.yearsExperience} onValueChange={(v) => updateField("yearsExperience", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Entry Level (0-1 years)</SelectItem>
                <SelectItem value="2">Junior (2-3 years)</SelectItem>
                <SelectItem value="5">Mid-Level (4-6 years)</SelectItem>
                <SelectItem value="8">Senior (7-10 years)</SelectItem>
                <SelectItem value="12">Lead/Expert (10+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn (optional)
            </Label>
            <Input
              id="linkedin"
              placeholder="linkedin.com/in/johndoe"
              value={formData.linkedin}
              onChange={(e) => updateField("linkedin", e.target.value)}
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Website (optional)
            </Label>
            <Input
              id="website"
              placeholder="johndoe.com"
              value={formData.website}
              onChange={(e) => updateField("website", e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Resume...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Resume
              </>
            )}
          </Button>
        </div>

        {isGenerating && (
          <div className="text-center text-sm text-muted-foreground animate-pulse">
            AI is crafting your professional resume. This may take a moment...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
