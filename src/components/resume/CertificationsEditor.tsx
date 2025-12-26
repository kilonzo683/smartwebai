import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ResumeCertification } from "@/types/resume";
import { Plus, Trash2, Award, Link, Calendar } from "lucide-react";

interface CertificationsEditorProps {
  certifications: ResumeCertification[];
  onChange: (certifications: ResumeCertification[]) => void;
}

export function CertificationsEditor({ certifications, onChange }: CertificationsEditorProps) {
  const addCertification = () => {
    const newCert: ResumeCertification = {
      id: crypto.randomUUID(),
      name: "",
      issuer: "",
      issue_date: "",
      expiry_date: "",
      credential_url: "",
    };
    onChange([...certifications, newCert]);
  };

  const updateCertification = (index: number, updates: Partial<ResumeCertification>) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeCertification = (index: number) => {
    onChange(certifications.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {certifications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No certifications added yet</p>
        </div>
      ) : (
        certifications.map((cert, index) => (
          <Card key={cert.id} className="relative group">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 mb-4">
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Certification Name</Label>
                      <Input
                        value={cert.name}
                        onChange={(e) => updateCertification(index, { name: e.target.value })}
                        placeholder="AWS Solutions Architect"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issuing Organization</Label>
                      <Input
                        value={cert.issuer}
                        onChange={(e) => updateCertification(index, { issuer: e.target.value })}
                        placeholder="Amazon Web Services"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Issue Date
                      </Label>
                      <Input
                        type="month"
                        value={cert.issue_date}
                        onChange={(e) => updateCertification(index, { issue_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Expiry Date (Optional)
                      </Label>
                      <Input
                        type="month"
                        value={cert.expiry_date}
                        onChange={(e) => updateCertification(index, { expiry_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Credential URL (Optional)
                    </Label>
                    <Input
                      value={cert.credential_url}
                      onChange={(e) => updateCertification(index, { credential_url: e.target.value })}
                      placeholder="https://credential.net/..."
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeCertification(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      
      <Button variant="outline" onClick={addCertification} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Certification
      </Button>
    </div>
  );
}
