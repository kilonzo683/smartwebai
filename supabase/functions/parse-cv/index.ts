import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

Return ONLY valid JSON (no markdown, no code blocks):
{
  "personal": {
    "full_name": "string",
    "email": "string", 
    "phone": "string",
    "location": "string",
    "linkedin": "",
    "website": "",
    "summary": "professional summary",
    "profession": "job title"
  },
  "experiences": [
    {
      "company": "string",
      "position": "string",
      "location": "",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM or Present",
      "is_current": false,
      "description": "description"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "start_date": "YYYY",
      "end_date": "YYYY",
      "description": ""
    }
  ],
  "skills": [
    {
      "name": "string",
      "level": "beginner|intermediate|advanced|expert",
      "category": "Technical"
    }
  ],
  "projects": [],
  "certifications": [],
  "languages": []
}

Extract as much as possible. Use empty strings/arrays for missing data.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this CV:\n\n${cvText.substring(0, 15000)}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to parse CV' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      return new Response(
        JSON.stringify({ error: 'No AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let cleanedContent = aiContent.trim();
    if (cleanedContent.startsWith('```json')) cleanedContent = cleanedContent.slice(7);
    else if (cleanedContent.startsWith('```')) cleanedContent = cleanedContent.slice(3);
    if (cleanedContent.endsWith('```')) cleanedContent = cleanedContent.slice(0, -3);
    cleanedContent = cleanedContent.trim();

    let parsedResume;
    try {
      parsedResume = JSON.parse(cleanedContent);
    } catch {
      console.error('JSON parse error, raw content:', cleanedContent);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const addIds = (arr: any[]) => arr.map(item => ({ ...item, id: crypto.randomUUID() }));

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
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to parse CV' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
