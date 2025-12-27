import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResumeInput {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  profession: string;
  yearsExperience: number;
  linkedin?: string;
  website?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: ResumeInput = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Generate a professional resume for the following person. Return ONLY valid JSON matching the exact structure provided.

Person Details:
- Full Name: ${input.fullName}
- Email: ${input.email}
- Phone: ${input.phone}
- Location: ${input.location}
- Profession/Job Title: ${input.profession}
- Years of Experience: ${input.yearsExperience}
${input.linkedin ? `- LinkedIn: ${input.linkedin}` : ''}
${input.website ? `- Website: ${input.website}` : ''}

Generate realistic and professional content including:
1. A compelling professional summary (2-3 sentences)
2. 2-3 relevant work experiences with realistic descriptions
3. 1-2 education entries appropriate for the profession
4. 5-8 relevant skills for this profession
5. 1-2 relevant projects (if applicable)
6. 1-2 certifications relevant to the profession
7. 2-3 languages

Return ONLY this JSON structure (no markdown, no explanation):
{
  "personal": {
    "full_name": "${input.fullName}",
    "email": "${input.email}",
    "phone": "${input.phone}",
    "location": "${input.location}",
    "linkedin": "${input.linkedin || ''}",
    "website": "${input.website || ''}",
    "summary": "Generated professional summary here",
    "photo_url": "",
    "profession": "${input.profession}"
  },
  "experiences": [
    {
      "id": "exp-1",
      "company": "Company Name",
      "position": "Job Title",
      "location": "City, Country",
      "start_date": "2020-01",
      "end_date": "Present",
      "is_current": true,
      "description": "Job description with achievements"
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "institution": "University Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "start_date": "2015-09",
      "end_date": "2019-06",
      "description": ""
    }
  ],
  "skills": [
    {
      "id": "skill-1",
      "name": "Skill Name",
      "level": "advanced",
      "category": "Category"
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "name": "Project Name",
      "description": "Project description",
      "url": "",
      "technologies": ["Tech1", "Tech2"]
    }
  ],
  "certifications": [
    {
      "id": "cert-1",
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "issue_date": "2023-01",
      "expiry_date": "",
      "credential_url": ""
    }
  ],
  "languages": [
    {
      "id": "lang-1",
      "language": "English",
      "proficiency": "native"
    }
  ],
  "custom_sections": []
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a professional resume writer. Generate realistic, professional resume content. Return ONLY valid JSON, no markdown formatting or explanation."
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received from AI");
    }

    // Parse the JSON from the response, handling potential markdown wrapping
    let resumeContent;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      resumeContent = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(JSON.stringify({ resume: resumeContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating resume:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
