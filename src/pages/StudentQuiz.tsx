import { useState, useCallback } from "react";
import { GraduationCap, BookOpen, Trophy, History } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuizList } from "@/components/quiz/QuizList";
import { QuizTaking } from "@/components/quiz/QuizTaking";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export default function StudentQuiz() {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  const handleStartQuiz = useCallback((quiz: Quiz) => {
    if (quiz.questions.length === 0) {
      toast({
        title: "Invalid Quiz",
        description: "This quiz has no questions.",
        variant: "destructive",
      });
      return;
    }
    setSelectedQuiz(quiz);
  }, [toast]);

  const handleCompleteQuiz = useCallback(async (score: number, total: number, answers: number[]) => {
    if (!selectedQuiz) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Not logged in",
          description: "Please log in to save your quiz results.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: selectedQuiz.id,
          user_id: user.id,
          answers: answers,
          score,
          total_questions: total,
        });

      if (error) throw error;

      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error saving quiz attempt:", error);
    }
  }, [selectedQuiz, toast]);

  const handleCloseQuiz = useCallback(() => {
    setSelectedQuiz(null);
  }, []);

  return (
    <div className="space-y-6">
      <AgentHeader
        name="Student Quiz Portal"
        description="Take quizzes, test your knowledge, and track your progress"
        icon={GraduationCap}
        gradient="agent-card-lecturer"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuizList onStartQuiz={handleStartQuiz} refreshKey={refreshKey} />
        </div>
        
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="glass animate-slide-up">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Quizzes Taken</span>
                  <span className="text-sm font-semibold">-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Score</span>
                  <span className="text-sm font-semibold">-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Best Score</span>
                  <span className="text-sm font-semibold">-</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Complete quizzes to track your progress!
              </p>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="glass animate-slide-up" style={{ animationDelay: "150ms" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-agent-lecturer" />
                Study Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Review incorrect answers after each quiz</li>
                <li>• Retake quizzes to improve your score</li>
                <li>• Focus on topics you find challenging</li>
                <li>• Take quizzes regularly to reinforce learning</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quiz Taking Dialog */}
      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedQuiz && (
            <QuizTaking
              quizId={selectedQuiz.id}
              title={selectedQuiz.title}
              questions={selectedQuiz.questions}
              onComplete={handleCompleteQuiz}
              onClose={handleCloseQuiz}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}