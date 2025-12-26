import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    console.log(`Generating flyer image for platform: ${platform}`);

    // Platform-specific dimensions
    const platformDimensions: Record<string, { width: number; height: number; aspectText: string }> = {
      instagram: { width: 1080, height: 1080, aspectText: "1:1 square format" },
      facebook: { width: 1200, height: 630, aspectText: "landscape 1200x630 format" },
      twitter: { width: 1200, height: 675, aspectText: "landscape 16:9 format" },
      linkedin: { width: 1200, height: 627, aspectText: "landscape 1200x627 format" },
      story: { width: 1080, height: 1920, aspectText: "vertical 9:16 format for stories" },
    };

    const dimensions = platformDimensions[platform] || platformDimensions.instagram;

    // Build comprehensive image prompt
    const enhancedPrompt = `Professional social media marketing flyer, ${dimensions.aspectText}. 
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
    const imageBase64Url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content;

    if (!imageBase64Url) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated");
    }

    console.log("Image generated, uploading to storage...");

    // Parse base64 data
    const base64Match = imageBase64Url.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const imageType = base64Match[1];
    const base64Data = base64Match[2];
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Generate unique filename
    const filename = `flyers/${Date.now()}-${crypto.randomUUID()}.${imageType}`;

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("social-media-assets")
      .upload(filename, bytes, {
        contentType: `image/${imageType}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("social-media-assets")
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;

    console.log("Flyer image uploaded successfully:", publicUrl);

    return new Response(JSON.stringify({
      success: true,
      imageUrl: publicUrl,
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
