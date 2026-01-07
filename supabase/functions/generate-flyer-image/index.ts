import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FlyerRequest {
  prompt: string;
  headline?: string;
  platform: string;
  style?: string;
  orientation?: string;
  colorScheme?: string;
  textPlacement?: string;
  referenceImage?: string; // Base64 image URL
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, headline, platform, style, orientation, colorScheme, textPlacement, referenceImage } = await req.json() as FlyerRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    console.log(`Generating flyer image for platform: ${platform}, style: ${style}, orientation: ${orientation}, has reference: ${!!referenceImage}`);

    // Orientation-specific dimensions
    const orientationDimensions: Record<string, { width: number; height: number; aspectText: string }> = {
      square: { width: 1080, height: 1080, aspectText: "1:1 square format" },
      portrait: { width: 1080, height: 1350, aspectText: "4:5 portrait format" },
      landscape: { width: 1920, height: 1080, aspectText: "16:9 landscape format" },
      story: { width: 1080, height: 1920, aspectText: "9:16 vertical story format" },
      wide: { width: 1200, height: 600, aspectText: "2:1 wide banner format" },
    };

    // Platform-specific dimensions (fallback if no orientation specified)
    const platformDimensions: Record<string, { width: number; height: number; aspectText: string }> = {
      instagram: { width: 1080, height: 1080, aspectText: "1:1 square format" },
      facebook: { width: 1200, height: 630, aspectText: "landscape 1200x630 format" },
      twitter: { width: 1200, height: 675, aspectText: "landscape 16:9 format" },
      linkedin: { width: 1200, height: 627, aspectText: "landscape 1200x627 format" },
      story: { width: 1080, height: 1920, aspectText: "vertical 9:16 format for stories" },
    };

    // Use orientation if specified, otherwise fall back to platform defaults
    const dimensions = orientation ? orientationDimensions[orientation] : platformDimensions[platform] || platformDimensions.instagram;
    
    // Style descriptions for enhanced prompts
    const styleDescriptions: Record<string, string> = {
      modern: "clean, modern, minimalist with bold typography and ample white space",
      bold: "bold, vibrant colors, high contrast, impactful design with strong visual elements",
      minimal: "ultra minimalist, simple geometric shapes, limited color palette, elegant simplicity",
      retro: "vintage, retro aesthetic with nostalgic elements, warm tones, classic typography",
      corporate: "professional, corporate, clean lines, trustworthy blue tones, business-appropriate",
      playful: "fun, playful, bright colors, rounded shapes, friendly and approachable",
      elegant: "luxury, elegant, sophisticated, premium feel with gold accents and refined typography",
      tech: "futuristic, tech-inspired, neon accents, dark backgrounds, modern digital aesthetic",
    };

    // Color scheme descriptions
    const colorSchemeDescriptions: Record<string, string> = {
      brand: "using brand-appropriate professional colors",
      warm: "warm color palette with reds, oranges, and yellows",
      cool: "cool color palette with blues, teals, and purples",
      monochrome: "black and white or single-color monochrome scheme",
      pastel: "soft pastel colors, gentle and calming tones",
      neon: "vibrant neon colors, electric and eye-catching",
      earth: "natural earth tones, greens, browns, and beiges",
      gradient: "beautiful gradient transitions between complementary colors",
    };

    // Text placement descriptions
    const textPlacementDescriptions: Record<string, string> = {
      center: "with main text prominently centered",
      top: "with headline text positioned at the top",
      bottom: "with text positioned at the bottom third",
      left: "with text left-aligned for readability",
      right: "with text right-aligned for visual balance",
      overlay: "with text overlaid on the main visual with appropriate contrast",
    };

    const selectedStyle = styleDescriptions[style || "modern"] || styleDescriptions.modern;
    const selectedColorScheme = colorSchemeDescriptions[colorScheme || "brand"] || colorSchemeDescriptions.brand;
    const selectedTextPlacement = textPlacementDescriptions[textPlacement || "center"] || textPlacementDescriptions.center;

    // Build comprehensive image prompt with all settings
    let enhancedPrompt = `Professional social media marketing flyer, ${dimensions.aspectText}. 
${prompt}
${headline ? `Main headline text: "${headline}"` : ""}
Design style: ${selectedStyle}
Color scheme: ${selectedColorScheme}
Text placement: ${selectedTextPlacement}
High quality, professional graphic design, suitable for ${platform} marketing.
Ultra high resolution, crisp typography if text included.`;

    // If there's a reference image, add instructions to match its style
    if (referenceImage) {
      enhancedPrompt = `Create a new flyer design inspired by the reference image provided.
${dimensions.aspectText}.
${prompt}
${headline ? `Main headline text: "${headline}"` : ""}
Maintain similar visual style and composition as the reference, but adapt with:
- Design style: ${selectedStyle}
- Color scheme: ${selectedColorScheme}
- Text placement: ${selectedTextPlacement}
High quality, professional graphic design, suitable for ${platform} marketing.
Ultra high resolution, crisp typography if text included.`;
    }

    console.log("Image generation prompt:", enhancedPrompt);

    // Build the message content
    const messageContent: any[] = [
      {
        type: "text",
        text: enhancedPrompt,
      },
    ];

    // Add reference image if provided
    if (referenceImage) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: referenceImage,
        },
      });
    }

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
            content: messageContent,
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
      usedReference: !!referenceImage,
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
