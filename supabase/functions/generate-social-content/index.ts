import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  type: "post" | "flyer" | "hashtags" | "caption";
  title: string;
  platform: string;
  brandVoice?: string;
  keyTopics?: string[];
  tone?: string;
  postType?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, title, platform, brandVoice, keyTopics, tone, postType } = await req.json() as GenerateRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating ${type} content for: ${title} on ${platform}`);

    // Build context-aware prompt based on type
    let systemPrompt = "";
    let userPrompt = "";

    const platformLimits: Record<string, number> = {
      twitter: 280,
      instagram: 2200,
      linkedin: 3000,
      facebook: 63206,
      tiktok: 2200,
    };

    const charLimit = platformLimits[platform] || 280;

    switch (type) {
      case "post":
        systemPrompt = `You are an expert social media content creator. Generate engaging, unique social media posts that drive engagement.

RULES:
- Create content that matches the platform's style and character limits
- ${platform === "twitter" ? "Keep under 280 characters including hashtags" : `Keep under ${charLimit} characters`}
- Use emojis appropriately for the platform
- Make it engaging and action-oriented
- Include a clear call-to-action when relevant
${brandVoice ? `- Match this brand voice: ${brandVoice}` : ""}
${keyTopics?.length ? `- Incorporate these topics naturally: ${keyTopics.join(", ")}` : ""}
${tone ? `- Tone should be: ${tone}` : ""}

Return ONLY the post content, no explanations or quotes.`;

        userPrompt = `Create a unique, engaging ${platform} ${postType || "post"} about: "${title}"`;
        break;

      case "hashtags":
        systemPrompt = `You are a social media hashtag expert. Generate relevant, trending hashtags.

RULES:
- Generate 5-10 relevant hashtags
- Mix popular and niche hashtags
- Include branded hashtags if brand info provided
- Format as space-separated hashtags
- No explanations, just hashtags

Return ONLY the hashtags, space-separated.`;

        userPrompt = `Generate hashtags for a ${platform} post about: "${title}"${keyTopics?.length ? `. Related topics: ${keyTopics.join(", ")}` : ""}`;
        break;

      case "caption":
        systemPrompt = `You are an expert at writing engaging social media captions.

RULES:
- Write a compelling caption that stops the scroll
- Include a hook in the first line
- Add value or tell a story
- End with engagement prompt or CTA
${brandVoice ? `- Match this brand voice: ${brandVoice}` : ""}

Return ONLY the caption, no explanations.`;

        userPrompt = `Write an engaging ${platform} caption for: "${title}"`;
        break;

      case "flyer":
        // For flyer, we'll return a description that can be used for image generation
        systemPrompt = `You are a professional graphic designer who creates image generation prompts.

RULES:
- Create a detailed prompt for generating a professional social media flyer/graphic
- Include: layout, colors, typography style, visual elements
- Make it platform-appropriate (${platform})
- Professional, modern, eye-catching design
- Include the main text/message to show

Return a JSON object with:
- "imagePrompt": detailed prompt for AI image generation
- "headline": main text for the flyer (short, impactful)
- "subtext": supporting text if needed
- "callToAction": CTA text`;

        userPrompt = `Create a professional flyer design prompt for: "${title}"${brandVoice ? `. Brand voice: ${brandVoice}` : ""}`;
        break;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8, // Higher creativity for unique content
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log(`Generated ${type} content successfully`);

    // For flyer type, try to parse as JSON
    if (type === "flyer") {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const flyerData = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify({ 
            type: "flyer",
            ...flyerData 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.error("Failed to parse flyer JSON:", e);
      }
    }

    return new Response(JSON.stringify({ 
      type,
      content: content.trim(),
      platform,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Generate content error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});