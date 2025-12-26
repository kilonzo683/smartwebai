import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FlyerRequest {
  prompt: string;
  headline?: string;
  platform: string;
  style?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, headline, platform, style } = await req.json() as FlyerRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating flyer image for platform: ${platform}`);

    // Platform-specific aspect ratios
    const aspectRatios: Record<string, string> = {
      instagram: "1:1 square format",
      facebook: "landscape 1200x630 format",
      twitter: "landscape 16:9 format",
      linkedin: "landscape 1200x627 format",
      story: "vertical 9:16 format for stories",
    };

    const aspectRatio = aspectRatios[platform] || aspectRatios.instagram;

    // Build comprehensive image prompt
    const enhancedPrompt = `Professional social media marketing flyer, ${aspectRatio}. 
${prompt}
${headline ? `Main headline text: "${headline}"` : ""}
Style: ${style || "modern, clean, professional, eye-catching"}
High quality, professional graphic design, suitable for ${platform} marketing.
Ultra high resolution, crisp typography if text included.`;

    console.log("Image generation prompt:", enhancedPrompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI image generation error:", response.status, errorText);

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

      throw new Error("Image generation failed");
    }

    const data = await response.json();
    
    // Extract image from response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated");
    }

    console.log("Flyer image generated successfully");

    return new Response(JSON.stringify({
      success: true,
      imageUrl,
      description: textResponse,
      platform,
      generatedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Flyer generation error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});