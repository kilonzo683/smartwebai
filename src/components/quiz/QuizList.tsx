import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileQuestion, Play, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  created_at: string;
  user_id: string;
}

interface QuizAttempt {
  quiz_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

interface QuizListProps {
  onStartQuiz: (quiz: Quiz) => void;
  refreshKey?: number;
}

export function QuizList({ onStartQuiz, refreshKey }: QuizListProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchQuizzes = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (quizError) throw quizError;
      
      // Parse questions JSON
      const parsedQuizzes = (quizData || []).map(q => ({
        ...q,
        questions: (q.questions as unknown as QuizQuestion[]) || []
      }));
      
      setQuizzes(parsedQuizzes);

      // Fetch user's attempts
      const { data: attemptData, error: attemptError } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, score, total_questions, completed_at")
        .order("completed_at", { ascending: false });

      if (!attemptError && attemptData) {
        setAttempts(attemptData);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [refreshKey]);

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
        description: "Failed to delete quiz.",
        variant: "destructive",
      });
    } finally {
      setDeleteQuizId(null);
    }
  };

  const getLatestAttempt = (quizId: string): QuizAttempt | undefined => {
    return attempts.find(a => a.quiz_id === quizId);
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quizzes.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="p-6 text-center">
          <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No quizzes available yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Generate a quiz from a document to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-agent-lecturer" />
            Available Quizzes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {quizzes.map((quiz) => {
                const attempt = getLatestAttempt(quiz.id);
                const percentage = attempt 
                  ? Math.round((attempt.score / attempt.total_questions) * 100) 
                  : null;

                return (
                  <div
                    key={quiz.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{quiz.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(quiz.created_at), "MMM d, yyyy")}
                          <Badge variant="secondary" className="text-xs">
                            {quiz.questions.length} questions
                          </Badge>
                        </div>
                        {attempt && (
                          <div className="flex items-center gap-1 mt-2 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span className="text-muted-foreground">
                              Last score: {percentage}% ({attempt.score}/{attempt.total_questions})
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onStartQuiz(quiz)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {attempt ? "Retry" : "Start"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteQuizId(quiz.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteQuizId} onOpenChange={() => setDeleteQuizId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the quiz and all associated attempts. This action cannot be undone.
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
    </>
  );
}