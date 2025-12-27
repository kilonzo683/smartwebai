import { ResumeContent } from "@/types/resume";
import { Mail, Phone, MapPin, Linkedin, Globe, Calendar, ExternalLink, User } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ResumePreviewProps {
  content: ResumeContent;
  template: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr + "-01"), "MMM yyyy");
  } catch {
    return dateStr;
  }
}

// Skill level to dots
function SkillDots({ level }: { level: string }) {
  const levels: Record<string, number> = {
    beginner: 2,
    intermediate: 3,
    advanced: 4,
    expert: 5,
  };
  const filled = levels[level] || 3;
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= filled ? 'bg-current' : 'bg-current/20'
          }`}
        />
      ))}
    </div>
  );
}

// Language proficiency to percentage
function LanguageCircle({ proficiency, language }: { proficiency: string; language: string }) {
  const percentages: Record<string, number> = {
    basic: 40,
    conversational: 60,
    fluent: 85,
    native: 100,
  };
  const percent = percentages[proficiency] || 60;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-20"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={`${(percent / 100) * 176} 176`}
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
          {percent}%
        </span>
      </div>
      <span className="text-xs mt-1 uppercase tracking-wide">{language}</span>
    </div>
  );
}

export function ResumePreview({ content, template }: ResumePreviewProps) {
  const { personal, experiences, education, skills, projects, certifications, languages } = content;

  // Template color schemes
  const getTemplateColors = () => {
    switch (template) {
      case 'classic':
        return {
          primary: '#0d4f4f', // Dark teal
          secondary: '#17a2a2', // Teal
          accent: '#e8f5f5', // Light teal bg
          headerBg: 'linear-gradient(135deg, #0d4f4f 0%, #17a2a2 100%)',
        };
      case 'minimal':
        return {
          primary: '#1e3a5f', // Navy blue
          secondary: '#2563eb', // Blue
          accent: '#eff6ff', // Light blue bg
          headerBg: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        };
      case 'creative':
        return {
          primary: '#7c3aed', // Purple
          secondary: '#a855f7', // Light purple
          accent: '#faf5ff', // Light purple bg
          headerBg: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        };
      default: // modern - teal like reference images
        return {
          primary: '#008b8b', // Teal
          secondary: '#00bfbf', // Light teal
          accent: '#e0f7f7', // Very light teal bg
          headerBg: 'linear-gradient(135deg, #008b8b 0%, #00bfbf 100%)',
        };
    }
  };

  const colors = getTemplateColors();

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <div 
      className="bg-white text-gray-900 min-h-full relative overflow-hidden print:w-[210mm] print:min-h-[297mm] print:overflow-visible" 
      id="resume-preview"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Decorative shapes */}
      <div 
        className="absolute top-0 right-0 w-48 h-48 opacity-10"
        style={{
          background: colors.primary,
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-32 h-64"
        style={{
          background: colors.secondary,
          clipPath: 'polygon(0 30%, 100% 0, 100% 100%, 0 100%)',
        }}
      />

      <div className="relative grid grid-cols-[280px_1fr] min-h-full">
        {/* Left Sidebar */}
        <div 
          className="p-6 text-white relative"
          style={{ background: colors.headerBg }}
        >
          {/* Photo */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-36 h-36 rounded-full border-4 border-white/30 overflow-hidden bg-white/20 flex items-center justify-center"
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
            >
              {personal.photo_url ? (
                <img 
                  src={personal.photo_url} 
                  alt={personal.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white/60" />
              )}
            </div>
          </div>

          {/* Name & Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold uppercase tracking-wide mb-1">
              {personal.full_name || "Your Name"}
            </h1>
            <p className="text-sm uppercase tracking-widest opacity-90">
              {personal.profession || "Professional Title"}
            </p>
          </div>

          {/* Contact Section */}
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 pb-2 border-b border-white/30">
              Contact
            </h2>
            <div className="space-y-3 text-sm">
              {personal.email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="break-all text-xs">{personal.email}</span>
                </div>
              )}
              {personal.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-xs">{personal.phone}</span>
                </div>
              )}
              {personal.location && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-xs">{personal.location}</span>
                </div>
              )}
              {personal.linkedin && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <span className="text-xs break-all">{personal.linkedin}</span>
                </div>
              )}
              {personal.website && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="text-xs break-all">{personal.website}</span>
                </div>
              )}
            </div>
          </div>

          {/* Skills Section */}
          {skills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest mb-4 pb-2 border-b border-white/30">
                Skills
              </h2>
              <div className="space-y-3">
                {skills.slice(0, 8).map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between">
                    <span className="text-xs">{skill.name}</span>
                    <SkillDots level={skill.level} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages Section */}
          {languages.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-4 pb-2 border-b border-white/30">
                Languages
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                {languages.slice(0, 3).map((lang) => (
                  <LanguageCircle 
                    key={lang.id} 
                    language={lang.language} 
                    proficiency={lang.proficiency} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content */}
        <div className="p-8">
          {/* About Me / Summary */}
          {personal.summary && (
            <section className="mb-8">
              <h2 
                className="text-lg font-bold uppercase tracking-wide mb-4 pb-2 inline-block"
                style={{ 
                  color: colors.primary,
                  borderBottom: `3px solid ${colors.secondary}`,
                }}
              >
                About Me
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {personal.summary}
              </p>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section className="mb-8">
              <h2 
                className="text-lg font-bold uppercase tracking-wide mb-4 pb-2 inline-block"
                style={{ 
                  color: colors.primary,
                  borderBottom: `3px solid ${colors.secondary}`,
                }}
              >
                Education
              </h2>
              <div className="space-y-4">
                {education.map((edu, idx) => (
                  <div key={edu.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ background: colors.secondary }}
                      />
                      {idx < education.length - 1 && (
                        <div 
                          className="w-0.5 flex-1 mt-1" 
                          style={{ background: colors.secondary }}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm uppercase">
                            {edu.institution}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {edu.degree} in {edu.field}
                          </p>
                        </div>
                        <span 
                          className="text-xs font-semibold px-2 py-1 rounded"
                          style={{ 
                            background: colors.accent,
                            color: colors.primary,
                          }}
                        >
                          {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                        </span>
                      </div>
                      {edu.description && (
                        <p className="text-xs text-gray-500 mt-1">{edu.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Work Experience */}
          {experiences.length > 0 && (
            <section className="mb-8">
              <h2 
                className="text-lg font-bold uppercase tracking-wide mb-4 pb-2 inline-block"
                style={{ 
                  color: colors.primary,
                  borderBottom: `3px solid ${colors.secondary}`,
                }}
              >
                Work Experience
              </h2>
              <div className="space-y-4">
                {experiences.map((exp, idx) => (
                  <div key={exp.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ background: colors.secondary }}
                      />
                      {idx < experiences.length - 1 && (
                        <div 
                          className="w-0.5 flex-1 mt-1" 
                          style={{ background: colors.secondary }}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm uppercase">
                            {exp.position}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {exp.company}{exp.location && ` • ${exp.location}`}
                          </p>
                        </div>
                        <span 
                          className="text-xs font-semibold px-2 py-1 rounded"
                          style={{ 
                            background: colors.accent,
                            color: colors.primary,
                          }}
                        >
                          {formatDate(exp.start_date)} - {exp.is_current ? "Present" : formatDate(exp.end_date)}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-xs text-gray-500 mt-2 whitespace-pre-line leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <section className="mb-8">
              <h2 
                className="text-lg font-bold uppercase tracking-wide mb-4 pb-2 inline-block"
                style={{ 
                  color: colors.primary,
                  borderBottom: `3px solid ${colors.secondary}`,
                }}
              >
                Projects
              </h2>
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="p-3 rounded-lg" style={{ background: colors.accent }}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm" style={{ color: colors.primary }}>
                        {project.name}
                      </h3>
                      {project.url && (
                        <a 
                          href={project.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: colors.secondary }}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-xs text-gray-600 mb-2">{project.description}</p>
                    )}
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech, i) => (
                          <span 
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ background: colors.secondary }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <section>
              <h2 
                className="text-lg font-bold uppercase tracking-wide mb-4 pb-2 inline-block"
                style={{ 
                  color: colors.primary,
                  borderBottom: `3px solid ${colors.secondary}`,
                }}
              >
                Certifications
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {certifications.map((cert) => (
                  <div 
                    key={cert.id} 
                    className="p-3 rounded-lg border-l-4"
                    style={{ 
                      background: colors.accent,
                      borderColor: colors.secondary,
                    }}
                  >
                    <h3 className="font-semibold text-sm text-gray-900">{cert.name}</h3>
                    <p className="text-xs text-gray-600">{cert.issuer}</p>
                    <p className="text-xs mt-1" style={{ color: colors.secondary }}>
                      {formatDate(cert.issue_date)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
