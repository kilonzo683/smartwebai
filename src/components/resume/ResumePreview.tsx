import { ResumeContent } from "@/types/resume";
import { Mail, Phone, MapPin, Linkedin, Globe, Calendar, ExternalLink } from "lucide-react";
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

export function ResumePreview({ content, template }: ResumePreviewProps) {
  const { personal, experiences, education, skills, projects, certifications, languages } = content;

  // Template-specific styles
  const getTemplateStyles = () => {
    switch (template) {
      case 'classic':
        return {
          header: 'text-center border-b-2 border-gray-800 pb-4',
          section: 'border-b border-gray-200 pb-4',
          accent: 'text-gray-800',
        };
      case 'minimal':
        return {
          header: 'border-l-4 border-gray-400 pl-4',
          section: '',
          accent: 'text-gray-600',
        };
      case 'creative':
        return {
          header: 'bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg',
          section: 'border-l-2 border-primary pl-4',
          accent: 'text-primary',
        };
      default: // modern
        return {
          header: 'border-l-4 border-primary pl-4',
          section: '',
          accent: 'text-primary',
        };
    }
  };

  const styles = getTemplateStyles();

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <div className="bg-white text-gray-900 p-8 min-h-full print:p-0" id="resume-preview">
      {/* Header / Personal Info */}
      <header className={`mb-6 ${styles.header}`}>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {personal.full_name || "Your Name"}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          {personal.email && (
            <a href={`mailto:${personal.email}`} className="flex items-center gap-1 hover:text-primary">
              <Mail className="w-3 h-3" />
              {personal.email}
            </a>
          )}
          {personal.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {personal.phone}
            </span>
          )}
          {personal.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {personal.location}
            </span>
          )}
          {personal.linkedin && (
            <a href={personal.linkedin.startsWith('http') ? personal.linkedin : `https://${personal.linkedin}`} 
               target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 hover:text-primary">
              <Linkedin className="w-3 h-3" />
              LinkedIn
            </a>
          )}
          {personal.website && (
            <a href={personal.website.startsWith('http') ? personal.website : `https://${personal.website}`}
               target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 hover:text-primary">
              <Globe className="w-3 h-3" />
              {personal.website}
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {personal.summary && (
        <section className={`mb-6 ${styles.section}`}>
          <h2 className={`text-lg font-semibold mb-2 ${styles.accent}`}>Professional Summary</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">{personal.summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className={`mb-6 ${styles.section}`}>
          <h2 className={`text-lg font-semibold mb-3 ${styles.accent}`}>Work Experience</h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                    <p className="text-sm text-gray-600">{exp.company}{exp.location && ` • ${exp.location}`}</p>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(exp.start_date)} – {exp.is_current ? "Present" : formatDate(exp.end_date)}
                  </p>
                </div>
                {exp.description && (
                  <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                    {exp.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className={`mb-6 ${styles.section}`}>
          <h2 className={`text-lg font-semibold mb-3 ${styles.accent}`}>Education</h2>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(edu.start_date)} – {formatDate(edu.end_date)}
                  </p>
                </div>
                {edu.description && (
                  <p className="text-sm text-gray-700 mt-1">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className={`mb-6 ${styles.section}`}>
          <h2 className={`text-lg font-semibold mb-3 ${styles.accent}`}>Skills</h2>
          <div className="space-y-2">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category}>
                <span className="text-sm font-medium text-gray-700">{category}: </span>
                <span className="text-sm text-gray-600">
                  {categorySkills.map(s => s.name).join(", ")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className={`mb-6 ${styles.section}`}>
          <h2 className={`text-lg font-semibold mb-3 ${styles.accent}`}>Projects</h2>
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project.id}>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  {project.url && (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {project.description && (
                  <p className="text-sm text-gray-700 mt-1">{project.description}</p>
                )}
                {project.technologies.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Technologies: {project.technologies.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section className={`mb-6 ${styles.section}`}>
          <h2 className={`text-lg font-semibold mb-3 ${styles.accent}`}>Certifications</h2>
          <div className="space-y-2">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{cert.name}</h3>
                  <p className="text-sm text-gray-600">{cert.issuer}</p>
                </div>
                <p className="text-sm text-gray-500">{formatDate(cert.issue_date)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <section className={`mb-6 ${styles.section}`}>
          <h2 className={`text-lg font-semibold mb-2 ${styles.accent}`}>Languages</h2>
          <p className="text-sm text-gray-700">
            {languages.map(l => `${l.language} (${l.proficiency})`).join(" • ")}
          </p>
        </section>
      )}
    </div>
  );
}
