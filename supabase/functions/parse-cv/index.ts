import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvText } = await req.json();

    if (!cvText || typeof cvText !== 'string' || cvText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'CV text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing CV with length:', cvText.length);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a CV/Resume parser. Extract structured information from the provided CV/resume text and return it as a JSON object.

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just pure JSON):
{
  "personal": {
    "full_name": "string",
    "email": "string", 
    "phone": "string",
    "location": "string",
    "linkedin": "string or empty",
    "website": "string or empty",
    "summary": "professional summary string",
    "profession": "job title or profession"
  },
  "experiences": [
    {
      "company": "string",
      "position": "string",
      "location": "string or empty",
      "start_date": "YYYY-MM or string",
      "end_date": "YYYY-MM or Present",
      "is_current": boolean,
      "description": "bullet points or description"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "start_date": "YYYY or string",
      "end_date": "YYYY or string",
      "description": "string or empty"
    }
  ],
  "skills": [
    {
      "name": "string",
      "level": "beginner|intermediate|advanced|expert",
      "category": "Technical|Soft Skills|Tools|Languages|Other"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "url": "string or empty",
      "technologies": ["array", "of", "tech"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "issue_date": "string or empty",
      "expiry_date": "string or empty",
      "credential_url": "string or empty"
    }
  ],
  "languages": [
    {
      "language": "string",
      "proficiency": "basic|conversational|fluent|native"
    }
  ]
}

Rules:
- Extract as much information as possible from the CV
- If a field is not found, use empty string "" or empty array []
- For skill levels, infer from context (years of experience, how it's mentioned)
- For language proficiency, infer from how it's described
- Keep descriptions concise but informative
- Parse dates in a consistent format when possible
- If currently employed, set is_current to true and end_date to "Present"`;

    const response = await fetch('https://api.lovable.dev/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this CV/Resume and extract all information:\n\n${cvText}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse CV with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response received, parsing JSON...');

    // Clean the response - remove markdown code blocks if present
    let cleanedContent = aiContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    let parsedResume;
    try {
      parsedResume = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Content was:', cleanedContent.substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add IDs to array items
    const addIds = (arr: any[]) => arr.map((item, idx) => ({ 
      ...item, 
      id: crypto.randomUUID() 
    }));

    const result = {
      personal: parsedResume.personal || {},
      experiences: addIds(parsedResume.experiences || []),
      education: addIds(parsedResume.education || []),
      skills: addIds(parsedResume.skills || []),
      projects: addIds(parsedResume.projects || []),
      certifications: addIds(parsedResume.certifications || []),
      languages: addIds(parsedResume.languages || []),
      custom_sections: [],
    };

    console.log('CV parsed successfully');

    return new Response(
      JSON.stringify({ success: true, resumeContent: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in parse-cv function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to parse CV' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
