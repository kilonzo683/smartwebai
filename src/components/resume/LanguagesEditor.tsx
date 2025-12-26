import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ResumeLanguage, LANGUAGE_PROFICIENCY } from "@/types/resume";
import { Plus, X, Languages } from "lucide-react";
import { useState } from "react";

interface LanguagesEditorProps {
  languages: ResumeLanguage[];
  onChange: (languages: ResumeLanguage[]) => void;
}

export function LanguagesEditor({ languages, onChange }: LanguagesEditorProps) {
  const [newLanguage, setNewLanguage] = useState("");
  const [newProficiency, setNewProficiency] = useState<ResumeLanguage['proficiency']>("fluent");

  const addLanguage = () => {
    if (!newLanguage.trim()) return;
    
    const language: ResumeLanguage = {
      id: crypto.randomUUID(),
      language: newLanguage.trim(),
      proficiency: newProficiency,
    };
    onChange([...languages, language]);
    setNewLanguage("");
  };

  const removeLanguage = (id: string) => {
    onChange(languages.filter(l => l.id !== id));
  };

  const updateProficiency = (id: string, proficiency: ResumeLanguage['proficiency']) => {
    onChange(languages.map(l => l.id === id ? { ...l, proficiency } : l));
  };

  const getProficiencyColor = (proficiency: ResumeLanguage['proficiency']) => {
    switch (proficiency) {
      case 'native': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'fluent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'conversational': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'basic': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <div className="space-y-4">
      {languages.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Languages className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No languages added yet</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <Badge
              key={lang.id}
              variant="outline"
              className={`group flex items-center gap-2 py-1.5 px-3 ${getProficiencyColor(lang.proficiency)}`}
            >
              <span className="font-medium">{lang.language}</span>
              <Select
                value={lang.proficiency}
                onValueChange={(value) => updateProficiency(lang.id, value as ResumeLanguage['proficiency'])}
              >
                <SelectTrigger className="h-5 w-28 text-xs border-none bg-transparent p-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_PROFICIENCY.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => removeLanguage(lang.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="border-t pt-4 space-y-3">
        <Label>Add New Language</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            placeholder="Language name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLanguage();
              }
            }}
          />
          <Select value={newProficiency} onValueChange={(v) => setNewProficiency(v as ResumeLanguage['proficiency'])}>
            <SelectTrigger>
              <SelectValue placeholder="Proficiency" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_PROFICIENCY.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addLanguage} disabled={!newLanguage.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
