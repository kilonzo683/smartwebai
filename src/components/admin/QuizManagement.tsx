import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileQuestion, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Quiz {
  id: string;
  title: string;
  questions: any[];
  created_at: string;
  user_id: string;
}

export function QuizManagement() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);
  const [viewQuiz, setViewQuiz] = useState<Quiz | null>(null);
  const { toast } = useToast();

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setQuizzes(data?.map(q => ({
        ...q,
        questions: (q.questions as any[]) || []
      })) || []);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (quizId: string) => {
    try {
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId);

      if (error) throw error;

      setQuizzes(prev => prev.filter(q => q.id !== quizId));
      toast({
        title: "Quiz deleted",
        description: "The quiz has been removed.",
      });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    } finally {
      setDeleteQuizId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5" />
            Quiz Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-accent/30 text-center">
              <p className="text-2xl font-bold">{quizzes.length}</p>
              <p className="text-xs text-muted-foreground">Total Quizzes</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/30 text-center">
              <p className="text-2xl font-bold">
                {quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Questions</p>
            </div>
          </div>

          {quizzes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No quizzes created yet</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizzes.map((quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{quiz.title}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {quiz.id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {quiz.questions?.length || 0} questions
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(quiz.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewQuiz(quiz)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteQuizId(quiz.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteQuizId} onOpenChange={() => setDeleteQuizId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this quiz and all associated attempts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuizId && handleDelete(deleteQuizId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Quiz Dialog */}
      <Dialog open={!!viewQuiz} onOpenChange={() => setViewQuiz(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewQuiz?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {viewQuiz?.questions?.map((q: any, idx: number) => (
                <div key={idx} className="p-4 rounded-lg border bg-card">
                  <p className="font-medium mb-2">Q{idx + 1}: {q.question}</p>
                  <div className="space-y-1">
                    {q.options?.map((opt: string, optIdx: number) => (
                      <p
                        key={optIdx}
                        className={`text-sm pl-4 ${optIdx === q.correctAnswer ? "text-green-500 font-medium" : "text-muted-foreground"}`}
                      >
                        {String.fromCharCode(65 + optIdx)}) {opt}
                        {optIdx === q.correctAnswer && " ✓"}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}