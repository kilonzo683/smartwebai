import { useState, useEffect } from "react";
import { GraduationCap, Bell, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TeachingPreferences {
  default_quiz_difficulty: string;
  marking_scheme_style: string;
  feedback_detail_level: string;
  auto_generate_hints: boolean;
  show_correct_answers: boolean;
}

interface LecturerNotifications {
  assignment_alerts: boolean;
  submission_alerts: boolean;
  result_publishing_alerts: boolean;
  student_help_requests: boolean;
}

export function LecturerSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [preferences, setPreferences] = useState<TeachingPreferences>({
    default_quiz_difficulty: "medium",
    marking_scheme_style: "percentage",
    feedback_detail_level: "detailed",
    auto_generate_hints: true,
    show_correct_answers: true,
  });

  const [notifications, setNotifications] = useState<LecturerNotifications>({
    assignment_alerts: true,
    submission_alerts: true,
    result_publishing_alerts: true,
    student_help_requests: true,
  });

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const savedPrefs = localStorage.getItem(`lecturer_prefs_${user.id}`);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.preferences) setPreferences(parsed.preferences);
        if (parsed.notifications) setNotifications(parsed.notifications);
      }
    } catch (error) {
      console.error("Error fetching lecturer settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      localStorage.setItem(`lecturer_prefs_${user.id}`, JSON.stringify({
        preferences,
        notifications,
      }));
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="teaching" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teaching" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Teaching Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Teaching Preferences */}
        <TabsContent value="teaching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Preferences</CardTitle>
              <CardDescription>Configure default settings for assessments and feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quizDifficulty">Default Quiz Difficulty</Label>
                  <Select
                    value={preferences.default_quiz_difficulty}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, default_quiz_difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="markingScheme">Marking Scheme Style</Label>
                  <Select
                    value={preferences.marking_scheme_style}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, marking_scheme_style: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="points">Points</SelectItem>
                      <SelectItem value="letter_grade">Letter Grade</SelectItem>
                      <SelectItem value="pass_fail">Pass/Fail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="feedbackLevel">Feedback Detail Level</Label>
                  <Select
                    value={preferences.feedback_detail_level}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, feedback_detail_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal - Score only</SelectItem>
                      <SelectItem value="basic">Basic - Score + correct answers</SelectItem>
                      <SelectItem value="detailed">Detailed - With explanations</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive - Full analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Auto-Generate Hints</p>
                    <p className="text-sm text-muted-foreground">Automatically generate hints for quiz questions</p>
                  </div>
                  <Switch
                    checked={preferences.auto_generate_hints}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, auto_generate_hints: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Show Correct Answers After Submission</p>
                    <p className="text-sm text-muted-foreground">Display correct answers once student submits</p>
                  </div>
                  <Switch
                    checked={preferences.show_correct_answers}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, show_correct_answers: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Preferences */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure academic-related alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "assignment_alerts", label: "Assignment Alerts", desc: "Notify when assignments are due" },
                { key: "submission_alerts", label: "Submission Alerts", desc: "Notify when students submit work" },
                { key: "result_publishing_alerts", label: "Result Publishing Alerts", desc: "Confirm when results are published" },
                { key: "student_help_requests", label: "Student Help Requests", desc: "Notify when students request help" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={notifications[key as keyof LecturerNotifications]}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
