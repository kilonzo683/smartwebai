import { useState, useEffect } from "react";
import { FileText, Download, Loader2, Plus, Trash2, FileSpreadsheet, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Report {
  id: string;
  title: string;
  report_type: string;
  content: Record<string, unknown>;
  generated_at: string;
  is_exported: boolean;
  export_format: string | null;
}

interface Quiz {
  id: string;
  title: string;
}

const REPORT_TYPES = [
  { value: "quiz_summary", label: "Quiz Summary" },
  { value: "student_progress", label: "Student Progress" },
  { value: "topic_analysis", label: "Topic Analysis" },
  { value: "class_overview", label: "Class Overview" },
];

export function ReportGenerator() {
  const [reports, setReports] = useState<Report[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    report_type: "quiz_summary",
    quiz_id: "",
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const [reportsRes, quizzesRes] = await Promise.all([
        supabase
          .from("lecturer_reports")
          .select("*")
          .eq("user_id", user.id)
          .order("generated_at", { ascending: false }),
        supabase
          .from("quizzes")
          .select("id, title")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (reportsRes.data) {
        setReports(reportsRes.data.map(r => ({
          ...r,
          content: r.content as Record<string, unknown>,
        })));
      }
      if (quizzesRes.data) setQuizzes(quizzesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    if (!formData.title.trim() || !user) return;

    setIsGenerating(true);
    try {
      let content: Record<string, unknown> = {};

      // Generate report content based on type
      if (formData.report_type === "quiz_summary" && formData.quiz_id) {
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("score, total_questions, completed_at")
          .eq("quiz_id", formData.quiz_id);

        if (attempts && attempts.length > 0) {
          const totalScore = attempts.reduce((acc, a) => acc + a.score, 0);
          const totalQuestions = attempts.reduce((acc, a) => acc + a.total_questions, 0);
          const avgPercentage = Math.round((totalScore / totalQuestions) * 100);
          const highestScore = Math.max(...attempts.map(a => (a.score / a.total_questions) * 100));
          const lowestScore = Math.min(...attempts.map(a => (a.score / a.total_questions) * 100));

          content = {
            quiz_id: formData.quiz_id,
            total_attempts: attempts.length,
            average_score: avgPercentage,
            highest_score: Math.round(highestScore),
            lowest_score: Math.round(lowestScore),
            pass_rate: Math.round((attempts.filter(a => a.score / a.total_questions >= 0.6).length / attempts.length) * 100),
            attempts_by_date: attempts.reduce((acc, a) => {
              const date = format(new Date(a.completed_at), "yyyy-MM-dd");
              acc[date] = (acc[date] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
          };
        }
      } else if (formData.report_type === "class_overview") {
        const { data: allAttempts } = await supabase
          .from("quiz_attempts")
          .select("score, total_questions, completed_at, quiz_id")
          .order("completed_at", { ascending: false });

        if (allAttempts && allAttempts.length > 0) {
          const totalScore = allAttempts.reduce((acc, a) => acc + a.score, 0);
          const totalQuestions = allAttempts.reduce((acc, a) => acc + a.total_questions, 0);

          content = {
            total_quizzes: new Set(allAttempts.map(a => a.quiz_id)).size,
            total_attempts: allAttempts.length,
            overall_average: Math.round((totalScore / totalQuestions) * 100),
            recent_activity: allAttempts.slice(0, 10).map(a => ({
              date: format(new Date(a.completed_at), "yyyy-MM-dd HH:mm"),
              score: `${a.score}/${a.total_questions}`,
            })),
          };
        }
      } else if (formData.report_type === "topic_analysis") {
        const { data: quizzesWithTopics } = await supabase
          .from("quizzes")
          .select("topics")
          .eq("user_id", user.id);

        const allTopics = new Set<string>();
        quizzesWithTopics?.forEach(q => {
          (q.topics as string[] || []).forEach(t => allTopics.add(t));
        });

        content = {
          unique_topics: Array.from(allTopics),
          topic_count: allTopics.size,
          generated_at: new Date().toISOString(),
        };
      }

      const { error } = await supabase
        .from("lecturer_reports")
        .insert([{
          user_id: user.id,
          title: formData.title,
          report_type: formData.report_type,
          content,
          quiz_id: formData.quiz_id || null,
        }]);

      if (error) throw error;

      toast({ title: "Report generated", description: "Your report is ready" });
      setShowCreateDialog(false);
      setFormData({ title: "", report_type: "quiz_summary", quiz_id: "" });
      fetchData();
    } catch (error) {
      console.error("Error generating report:", error);
      toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = (report: Report, format: "csv" | "json") => {
    let content: string;
    let mimeType: string;
    let filename: string;

    if (format === "json") {
      content = JSON.stringify(report.content, null, 2);
      mimeType = "application/json";
      filename = `${report.title.replace(/\s+/g, "_")}.json`;
    } else {
      // Convert to CSV
      const rows: string[] = ["Key,Value"];
      Object.entries(report.content).forEach(([key, value]) => {
        rows.push(`"${key}","${typeof value === 'object' ? JSON.stringify(value) : value}"`);
      });
      content = rows.join("\n");
      mimeType = "text/csv";
      filename = `${report.title.replace(/\s+/g, "_")}.csv`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Report exported", description: `Downloaded as ${format.toUpperCase()}` });
  };

  const handleDelete = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("lecturer_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;
      toast({ title: "Report deleted" });
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  return (
    <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-agent-lecturer" />
          <h3 className="text-sm font-medium">Reports</h3>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-3 h-3 mr-1" />
          Generate
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No reports yet</p>
          <p className="text-xs">Generate reports to track progress</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {reports.map(report => (
            <div
              key={report.id}
              className="flex items-center justify-between p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{report.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {REPORT_TYPES.find(t => t.value === report.report_type)?.label || report.report_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(report.generated_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => exportReport(report, "csv")}
                  title="Export as CSV"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => exportReport(report, "json")}
                  title="Export as JSON"
                >
                  <FileJson className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleDelete(report.id)}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Report Title *</label>
              <Input
                placeholder="Weekly Quiz Summary"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Report Type</label>
              <Select
                value={formData.report_type}
                onValueChange={(v) => setFormData(prev => ({ ...prev, report_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.report_type === "quiz_summary" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Select Quiz</label>
                <Select
                  value={formData.quiz_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, quiz_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map(quiz => (
                      <SelectItem key={quiz.id} value={quiz.id}>{quiz.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={generateReport} disabled={isGenerating || !formData.title.trim()}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
