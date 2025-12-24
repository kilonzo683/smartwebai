import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Trophy, ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizTakingProps {
  quizId: string;
  title: string;
  questions: QuizQuestion[];
  onComplete: (score: number, total: number, answers: number[]) => void;
  onClose: () => void;
}

export function QuizTaking({ quizId, title, questions, onComplete, onClose }: QuizTakingProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResults(true);
    onComplete(correctCount, questions.length, answers.filter(a => a !== null) as number[]);
  };

  const handleRetry = () => {
    setAnswers(new Array(questions.length).fill(null));
    setCurrentQuestion(0);
    setShowResults(false);
    setScore(0);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = answers.filter(a => a !== null).length;

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className={cn(
              "h-16 w-16",
              percentage >= 80 ? "text-yellow-500" : percentage >= 50 ? "text-blue-500" : "text-muted-foreground"
            )} />
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <p className="text-muted-foreground mt-2">{title}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-5xl font-bold mb-2">{percentage}%</p>
            <p className="text-lg text-muted-foreground">
              You got {score} out of {questions.length} correct
            </p>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.map((q, idx) => {
              const isCorrect = answers[idx] === q.correctAnswer;
              return (
                <div key={idx} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">Q{idx + 1}: {q.question}</p>
                      <p className={cn(
                        "text-sm",
                        isCorrect ? "text-green-600" : "text-red-600"
                      )}>
                        Your answer: {answers[idx] !== null ? q.options[answers[idx]] : "Not answered"}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-600 mt-1">
                          Correct: {q.options[q.correctAnswer]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button variant="outline" onClick={handleRetry} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {currentQuestion + 1} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-xl font-medium mb-6">{currentQ.question}</h3>
          
          <RadioGroup
            value={answers[currentQuestion]?.toString()}
            onValueChange={(v) => handleAnswer(parseInt(v))}
          >
            {currentQ.options.map((option, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                  answers[currentQuestion] === idx 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:bg-accent"
                )}
                onClick={() => handleAnswer(idx)}
              >
                <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <div className="text-sm text-muted-foreground">
          {answeredCount} of {questions.length} answered
        </div>
        
        {currentQuestion === questions.length - 1 ? (
          <Button 
            onClick={handleSubmit}
            disabled={answeredCount !== questions.length}
          >
            Submit Quiz
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}