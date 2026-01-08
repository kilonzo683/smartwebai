import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ResumeProject } from "@/types/resume";
import { Plus, Trash2, FolderOpen, Link, X } from "lucide-react";
import { useState } from "react";

interface ProjectsEditorProps {
  projects: ResumeProject[];
  onChange: (projects: ResumeProject[]) => void;
}

export function ProjectsEditor({ projects, onChange }: ProjectsEditorProps) {
  const [newTech, setNewTech] = useState<Record<string, string>>({});

  const addProject = () => {
    const newProject: ResumeProject = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      url: "",
      technologies: [],
    };
    onChange([...projects, newProject]);
  };

  const updateProject = (index: number, updates: Partial<ResumeProject>) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeProject = (index: number) => {
    onChange(projects.filter((_, i) => i !== index));
  };

  const addTechnology = (projectId: string, index: number) => {
    const tech = newTech[projectId]?.trim();
    if (!tech) return;
    
    const project = projects[index];
    const currentTech = project.technologies || [];
    if (!currentTech.includes(tech)) {
      updateProject(index, { technologies: [...currentTech, tech] });
    }
    setNewTech({ ...newTech, [projectId]: "" });
  };

  const removeTechnology = (index: number, techIndex: number) => {
    const project = projects[index];
    const currentTech = project.technologies || [];
    updateProject(index, { 
      technologies: currentTech.filter((_, i) => i !== techIndex) 
    });
  };

  return (
    <div className="space-y-4">
      {projects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No projects added yet</p>
        </div>
      ) : (
        projects.map((project, index) => (
          <Card key={project.id} className="relative group">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 mb-4">
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input
                        value={project.name}
                        onChange={(e) => updateProject(index, { name: e.target.value })}
                        placeholder="My Awesome Project"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Link className="w-4 h-4" />
                        Project URL
                      </Label>
                      <Input
                        value={project.url}
                        onChange={(e) => updateProject(index, { url: e.target.value })}
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={project.description}
                      onChange={(e) => updateProject(index, { description: e.target.value })}
                      placeholder="Describe what the project does and your role..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Technologies Used</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(project.technologies || []).map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="group/tech">
                          {tech}
                          <button
                            onClick={() => removeTechnology(index, techIndex)}
                            className="ml-1 opacity-0 group-hover/tech:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTech[project.id] || ""}
                        onChange={(e) => setNewTech({ ...newTech, [project.id]: e.target.value })}
                        placeholder="Add technology..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTechnology(project.id, index);
                          }
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addTechnology(project.id, index)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeProject(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      
      <Button variant="outline" onClick={addProject} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Project
      </Button>
    </div>
  );
}
