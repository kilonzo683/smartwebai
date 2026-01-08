import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ResumeEducation } from "@/types/resume";
import { Plus, Trash2, GripVertical, GraduationCap, Calendar } from "lucide-react";

interface EducationEditorProps {
  education: ResumeEducation[];
  onChange: (education: ResumeEducation[]) => void;
}

// Validate date is in yyyy-MM format for month inputs
const isValidMonthFormat = (date: string): boolean => {
  if (!date) return false;
  return /^\d{4}-\d{2}$/.test(date);
};

export function EducationEditor({ education, onChange }: EducationEditorProps) {
  const addEducation = () => {
    const newEdu: ResumeEducation = {
      id: crypto.randomUUID(),
      institution: "",
      degree: "",
      field: "",
      start_date: "",
      end_date: "",
      description: "",
    };
    onChange([...education, newEdu]);
  };

  const updateEducation = (index: number, updates: Partial<ResumeEducation>) => {
    const updated = [...education];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeEducation = (index: number) => {
    onChange(education.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {education.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No education added yet</p>
        </div>
      ) : (
        education.map((edu, index) => (
          <Card key={edu.id} className="relative group">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 mb-4">
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, { institution: e.target.value })}
                        placeholder="University of Example"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, { degree: e.target.value })}
                        placeholder="Bachelor of Science"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Field of Study</Label>
                    <Input
                      value={edu.field}
                      onChange={(e) => updateEducation(index, { field: e.target.value })}
                      placeholder="Computer Science"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Start Date
                      </Label>
                      <Input
                        type="month"
                        value={isValidMonthFormat(edu.start_date) ? edu.start_date : ""}
                        onChange={(e) => updateEducation(index, { start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        End Date
                      </Label>
                      <Input
                        type="month"
                        value={isValidMonthFormat(edu.end_date) ? edu.end_date : ""}
                        onChange={(e) => updateEducation(index, { end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      value={edu.description}
                      onChange={(e) => updateEducation(index, { description: e.target.value })}
                      placeholder="Relevant coursework, honors, activities..."
                      rows={3}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeEducation(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      
      <Button variant="outline" onClick={addEducation} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Education
      </Button>
    </div>
  );
}
