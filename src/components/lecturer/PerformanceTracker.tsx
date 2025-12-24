import { useState, useEffect } from "react";
import { TrendingDown, TrendingUp, Users, Loader2, AlertTriangle, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PerformanceData {
  student_identifier: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

interface TopicAnalysis {
  topic: string;
  correctCount: number;
  totalCount: number;
  percentage: number;
}

export function PerformanceTracker() {
  const [performances, setPerformances] = useState<PerformanceData[]>([]);
  const [weakTopics, setWeakTopics] = useState<TopicAnalysis[]>([]);
  const [strongTopics, setStrongTopics] = useState<TopicAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageScore, setAverageScore] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    fetchPerformanceData();
  }, [user]);

  const fetchPerformanceData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Get all quiz attempts with quiz info
      const { data: attempts, error } = await supabase
        .from("quiz_attempts")
        .select(`
          score,
          total_questions,
          completed_at,
          answers,
          quiz:quizzes(title, questions, topics)
        `)
        .order("completed_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!attempts || attempts.length === 0) {
        setIsLoading(false);
        return;
      }

      // Calculate average score
      const totalScore = attempts.reduce((acc, a) => acc + (a.score / a.total_questions) * 100, 0);
      setAverageScore(Math.round(totalScore / attempts.length));

      // Analyze topics
      const topicStats: Record<string, { correct: number; total: number }> = {};

      attempts.forEach(attempt => {
        const quiz = attempt.quiz as { title: string; questions: Array<{ question: string; correctAnswer: number }>; topics: string[] } | null;
        if (!quiz?.topics) return;

        const answers = attempt.answers as number[];
        const questions = quiz.questions;

        quiz.topics.forEach(topic => {
          if (!topicStats[topic]) {
            topicStats[topic] = { correct: 0, total: 0 };
          }
          topicStats[topic].total += questions.length;
          topicStats[topic].correct += attempt.score;
        });
      });

      const topicAnalysis: TopicAnalysis[] = Object.entries(topicStats)
        .map(([topic, stats]) => ({
          topic,
          correctCount: stats.correct,
          totalCount: stats.total,
          percentage: Math.round((stats.correct / stats.total) * 100),
        }))
        .sort((a, b) => a.percentage - b.percentage);

      setWeakTopics(topicAnalysis.filter(t => t.percentage < 60).slice(0, 5));
      setStrongTopics(topicAnalysis.filter(t => t.percentage >= 70).slice(-5).reverse());

      // Map to performance data
      const perfData: PerformanceData[] = attempts.map(a => ({
        student_identifier: "Student",
        quiz_title: (a.quiz as { title: string } | null)?.title || "Unknown Quiz",
        score: a.score,
        total_questions: a.total_questions,
        completed_at: a.completed_at,
      }));

      setPerformances(perfData);
    } catch (error) {
      console.error("Error fetching performance data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-4">
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-agent-lecturer" />
          <h3 className="text-sm font-medium">Performance Tracking</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {performances.length} attempts
        </Badge>
      </div>

      {performances.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No quiz attempts yet</p>
          <p className="text-xs">Take quizzes to track performance</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Average Score */}
          <div className="p-3 rounded-xl bg-accent/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Average Score</span>
              <span className={`text-lg font-bold ${
                averageScore >= 70 ? "text-green-500" : averageScore >= 50 ? "text-yellow-500" : "text-red-500"
              }`}>
                {averageScore}%
              </span>
            </div>
            <Progress value={averageScore} className="h-2" />
          </div>

          {/* Weak Topics */}
          {weakTopics.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-muted-foreground">Weak Topics (Need Review)</span>
              </div>
              <div className="space-y-2">
                {weakTopics.map(topic => (
                  <div key={topic.topic} className="flex items-center justify-between p-2 rounded-lg bg-red-500/10">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span className="text-sm">{topic.topic}</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400">
                      {topic.percentage}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strong Topics */}
          {strongTopics.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Strong Topics</span>
              </div>
              <div className="space-y-2">
                {strongTopics.map(topic => (
                  <div key={topic.topic} className="flex items-center justify-between p-2 rounded-lg bg-green-500/10">
                    <div className="flex items-center gap-2">
                      <Award className="w-3 h-3 text-green-500" />
                      <span className="text-sm">{topic.topic}</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400">
                      {topic.percentage}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Attempts */}
          <div>
            <span className="text-xs font-medium text-muted-foreground">Recent Attempts</span>
            <div className="mt-2 space-y-2 max-h-[150px] overflow-y-auto">
              {performances.slice(0, 5).map((perf, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{perf.quiz_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(perf.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={perf.score / perf.total_questions >= 0.7 ? "default" : "secondary"}>
                    {perf.score}/{perf.total_questions}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
