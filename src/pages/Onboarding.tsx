import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, Building2, Mail, HeadphonesIcon, Share2, GraduationCap,
  ArrowRight, ArrowLeft, Check, Loader2, Users, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: typeof Mail;
  color: string;
}

const agents: Agent[] = [
  {
    id: "secretary",
    name: "AI Smart Secretary",
    description: "Email management, scheduling, task automation & voice-to-task",
    icon: Mail,
    color: "bg-blue-500",
  },
  {
    id: "support",
    name: "AI Customer Support",
    description: "Handle inquiries, resolve tickets, 24/7 support with escalation",
    icon: HeadphonesIcon,
    color: "bg-green-500",
  },
  {
    id: "social",
    name: "AI Social Media Agent",
    description: "Create content, manage calendars, engage with brand consistency",
    icon: Share2,
    color: "bg-purple-500",
  },
  {
    id: "lecturer",
    name: "AI Lecturer Assistant",
    description: "Generate quizzes, grade tests, track student performance",
    icon: GraduationCap,
    color: "bg-orange-500",
  },
];

type Step = "organization" | "agents" | "team" | "complete";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createOrganization } = useOrganization();
  
  const [currentStep, setCurrentStep] = useState<Step>("organization");
  const [isLoading, setIsLoading] = useState(false);
  
  // Organization step
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  
  // Agents step
  const [selectedAgents, setSelectedAgents] = useState<string[]>(["secretary", "support"]);
  
  // Team step
  const [teamEmails, setTeamEmails] = useState("");

  const steps = [
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "agents", label: "AI Agents", icon: Settings },
    { id: "team", label: "Team", icon: Users },
    { id: "complete", label: "Complete", icon: Check },
  ];

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      toast.error("Please enter an organization name");
      return;
    }
    
    setIsLoading(true);
    const slug = orgSlug.trim() || orgName.toLowerCase().replace(/\s+/g, "-");
    const result = await createOrganization(orgName, slug);
    
    if (result.success) {
      setCurrentStep("agents");
    } else {
      toast.error(result.error || "Failed to create organization");
    }
    setIsLoading(false);
  };

  const handleAgentSelection = () => {
    if (selectedAgents.length === 0) {
      toast.error("Please select at least one AI agent");
      return;
    }
    setCurrentStep("team");
  };

  const handleTeamSetup = () => {
    // Process team emails if provided
    if (teamEmails.trim()) {
      const emails = teamEmails.split(/[,\n]/).map(e => e.trim()).filter(e => e);
      if (emails.length > 0) {
        toast.success(`${emails.length} team invite(s) will be sent`);
      }
    }
    setCurrentStep("complete");
  };

  const handleComplete = () => {
    toast.success("Onboarding complete! Welcome to AI Work Assistant");
    navigate("/");
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const goBack = () => {
    if (currentStep === "agents") setCurrentStep("organization");
    else if (currentStep === "team") setCurrentStep("agents");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">AI Work Assistant</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Skip for now
          </Button>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="py-8 px-4 bg-accent/30">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const stepIndex = steps.findIndex(s => s.id === currentStep);
              const isActive = step.id === currentStep;
              const isCompleted = index < stepIndex;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted 
                          ? "bg-green-500 text-white" 
                          : isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-accent text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs mt-2 ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 sm:w-24 h-0.5 mx-2 ${index < stepIndex ? "bg-green-500" : "bg-accent"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          
          {/* Organization Step */}
          {currentStep === "organization" && (
            <Card className="glass">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Create Your Organization</CardTitle>
                <CardDescription>
                  Set up your workspace to start using AI Work Assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name *</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="My Company"
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgSlug">URL Slug (optional)</Label>
                  <Input
                    id="orgSlug"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    placeholder="my-company"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used in URLs and API references
                  </p>
                </div>
                <Button 
                  onClick={handleCreateOrganization} 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading || !orgName.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Agents Step */}
          {currentStep === "agents" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Select Your AI Agents</h2>
                <p className="text-muted-foreground">
                  Choose which AI agents you want to activate for your organization
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {agents.map((agent) => {
                  const isSelected = selectedAgents.includes(agent.id);
                  return (
                    <Card 
                      key={agent.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => toggleAgent(agent.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl ${agent.color} flex items-center justify-center flex-shrink-0`}>
                            <agent.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-foreground">{agent.name}</h3>
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => toggleAgent(agent.id)}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {agent.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleAgentSelection} className="flex-1" disabled={selectedAgents.length === 0}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Team Step */}
          {currentStep === "team" && (
            <Card className="glass">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Invite Your Team</CardTitle>
                <CardDescription>
                  Add team members to collaborate with your AI agents (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="teamEmails">Team Member Emails</Label>
                  <textarea
                    id="teamEmails"
                    value={teamEmails}
                    onChange={(e) => setTeamEmails(e.target.value)}
                    placeholder="john@example.com&#10;jane@example.com"
                    className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter email addresses separated by commas or new lines
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <Button variant="outline" onClick={goBack} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleTeamSetup} className="flex-1">
                    {teamEmails.trim() ? "Send Invites" : "Skip & Continue"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complete Step */}
          {currentStep === "complete" && (
            <Card className="glass">
              <CardHeader className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                <CardTitle className="text-2xl">You're All Set!</CardTitle>
                <CardDescription>
                  Your AI Work Assistant is ready to help you be more productive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-accent/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-foreground">What's next:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Explore your AI agents and their capabilities
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Upload documents to the knowledge base
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Configure integrations and channels
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Customize settings for your team
                    </li>
                  </ul>
                </div>
                
                <Button onClick={handleComplete} className="w-full" size="lg">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
