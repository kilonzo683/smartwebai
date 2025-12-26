import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ResumeExperience } from "@/types/resume";
import { Plus, Trash2, GripVertical, Building2, Calendar } from "lucide-react";

interface ExperienceEditorProps {
  experiences: ResumeExperience[];
  onChange: (experiences: ResumeExperience[]) => void;
}

export function ExperienceEditor({ experiences, onChange }: ExperienceEditorProps) {
  const addExperience = () => {
    const newExp: ResumeExperience = {
      id: crypto.randomUUID(),
      company: "",
      position: "",
      location: "",
      start_date: "",
      end_date: "",
      is_current: false,
      description: "",
    };
    onChange([...experiences, newExp]);
  };

  const updateExperience = (index: number, updates: Partial<ResumeExperience>) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeExperience = (index: number) => {
    onChange(experiences.filter((_, i) => i !== index));
  };

  const moveExperience = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= experiences.length) return;
    const updated = [...experiences];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {experiences.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No work experience added yet</p>
        </div>
      ) : (
        experiences.map((exp, index) => (
          <Card key={exp.id} className="relative group">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 mb-4">
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveExperience(index, index - 1)}
                    disabled={index === 0}
                  >
                    <GripVertical className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Position / Title</Label>
                      <Input
                        value={exp.position}
                        onChange={(e) => updateExperience(index, { position: e.target.value })}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(index, { company: e.target.value })}
                        placeholder="Tech Company Inc."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={exp.location}
                      onChange={(e) => updateExperience(index, { location: e.target.value })}
                      placeholder="San Francisco, CA"
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
                        value={exp.start_date}
                        onChange={(e) => updateExperience(index, { start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        End Date
                      </Label>
                      <Input
                        type="month"
                        value={exp.end_date}
                        onChange={(e) => updateExperience(index, { end_date: e.target.value })}
                        disabled={exp.is_current}
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <Checkbox
                          id={`current-${exp.id}`}
                          checked={exp.is_current}
                          onCheckedChange={(checked) => 
                            updateExperience(index, { is_current: !!checked, end_date: checked ? "" : exp.end_date })
                          }
                        />
                        <Label htmlFor={`current-${exp.id}`} className="text-sm">
                          I currently work here
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(index, { description: e.target.value })}
                      placeholder="Describe your responsibilities and achievements..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tip: Use bullet points starting with action verbs (e.g., "• Developed...", "• Managed...")
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeExperience(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      
      <Button variant="outline" onClick={addExperience} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Experience
      </Button>
    </div>
  );
}
