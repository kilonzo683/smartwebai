import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ResumePersonal } from "@/types/resume";
import { User, Mail, Phone, MapPin, Linkedin, Globe, Briefcase, Upload, X, Camera } from "lucide-react";
import { toast } from "sonner";

interface PersonalInfoEditorProps {
  personal: ResumePersonal;
  onChange: (personal: ResumePersonal) => void;
}

export function PersonalInfoEditor({ personal, onChange }: PersonalInfoEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof ResumePersonal, value: string) => {
    onChange({ ...personal, [field]: value });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert to base64 for local preview (in production, you'd upload to storage)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateField('photo_url', base64);
        toast.success('Photo uploaded successfully');
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error('Failed to upload photo');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload photo');
      setIsUploading(false);
    }
  };

  const removePhoto = () => {
    updateField('photo_url', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Photo removed');
  };

  return (
    <div className="space-y-6">
      {/* Photo Upload Section */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Profile Photo
        </Label>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-border overflow-hidden bg-muted flex items-center justify-center">
              {personal.photo_url ? (
                <img 
                  src={personal.photo_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            {personal.photo_url && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-1 -right-1 w-6 h-6"
                onClick={removePhoto}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : personal.photo_url ? 'Change Photo' : 'Upload Photo'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Recommended: Square image, at least 300x300px. Max 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Name and Profession */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Full Name
          </Label>
          <Input
            id="full_name"
            value={personal.full_name}
            onChange={(e) => updateField('full_name', e.target.value)}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profession" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Profession / Title
          </Label>
          <Input
            id="profession"
            value={personal.profession || ''}
            onChange={(e) => updateField('profession', e.target.value)}
            placeholder="Graphic Designer"
          />
        </div>
      </div>

      {/* Email and Phone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={personal.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone
          </Label>
          <Input
            id="phone"
            value={personal.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Location
        </Label>
        <Input
          id="location"
          value={personal.location}
          onChange={(e) => updateField('location', e.target.value)}
          placeholder="New York, NY"
        />
      </div>

      {/* LinkedIn and Website */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="linkedin" className="flex items-center gap-2">
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </Label>
          <Input
            id="linkedin"
            value={personal.linkedin}
            onChange={(e) => updateField('linkedin', e.target.value)}
            placeholder="linkedin.com/in/johndoe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website
          </Label>
          <Input
            id="website"
            value={personal.website}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="johndoe.com"
          />
        </div>
      </div>

      {/* Professional Summary */}
      <div className="space-y-2">
        <Label htmlFor="summary">Professional Summary</Label>
        <Textarea
          id="summary"
          value={personal.summary}
          onChange={(e) => updateField('summary', e.target.value)}
          placeholder="A brief summary of your professional background and career goals..."
          rows={4}
        />
      </div>
    </div>
  );
}
