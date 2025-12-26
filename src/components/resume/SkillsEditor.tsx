import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ResumeSkill, SKILL_LEVELS } from "@/types/resume";
import { Plus, X, Wrench } from "lucide-react";
import { useState } from "react";

interface SkillsEditorProps {
  skills: ResumeSkill[];
  onChange: (skills: ResumeSkill[]) => void;
}

export function SkillsEditor({ skills, onChange }: SkillsEditorProps) {
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<ResumeSkill['level']>("intermediate");
  const [newSkillCategory, setNewSkillCategory] = useState("");

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    
    const newSkill: ResumeSkill = {
      id: crypto.randomUUID(),
      name: newSkillName.trim(),
      level: newSkillLevel,
      category: newSkillCategory.trim() || "General",
    };
    onChange([...skills, newSkill]);
    setNewSkillName("");
    setNewSkillCategory("");
  };

  const removeSkill = (id: string) => {
    onChange(skills.filter(s => s.id !== id));
  };

  const updateSkillLevel = (id: string, level: ResumeSkill['level']) => {
    onChange(skills.map(s => s.id === id ? { ...s, level } : s));
  };

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, ResumeSkill[]>);

  const categories = Object.keys(groupedSkills);
  const existingCategories = [...new Set(skills.map(s => s.category || "General"))];

  return (
    <div className="space-y-4">
      {skills.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No skills added yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category}>
              <Label className="text-sm text-muted-foreground mb-2 block">{category}</Label>
              <div className="flex flex-wrap gap-2">
                {groupedSkills[category].map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="secondary"
                    className="group flex items-center gap-2 py-1.5 px-3"
                  >
                    <span>{skill.name}</span>
                    <Select
                      value={skill.level}
                      onValueChange={(value) => updateSkillLevel(skill.id, value as ResumeSkill['level'])}
                    >
                      <SelectTrigger className="h-5 w-20 text-xs border-none bg-transparent p-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SKILL_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-4 space-y-3">
        <Label>Add New Skill</Label>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Skill name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              }
            }}
          />
          <Select value={newSkillLevel} onValueChange={(v) => setNewSkillLevel(v as ResumeSkill['level'])}>
            <SelectTrigger>
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              {SKILL_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            placeholder="Category (optional)"
            list="skill-categories"
          />
          <datalist id="skill-categories">
            {existingCategories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          <Button onClick={addSkill} disabled={!newSkillName.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
