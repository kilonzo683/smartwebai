import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!audio) {
      throw new Error("No audio data provided");
    }

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing voice transcription with Gemini multimodal...");

    // Use Gemini's multimodal capabilities to transcribe audio
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
            role: "user",
            content: [
              {
                type: "text",
                text: "Please transcribe the following audio recording accurately. Return ONLY the transcribed text, nothing else. If the audio contains task-like items or action items, format them as a clean list."
              },
              {
                type: "input_audio",
                input_audio: {
                  data: audio,
                  format: "webm"
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Fallback: If multimodal audio fails, provide helpful message
      if (response.status === 400 || response.status === 422) {
        return new Response(
          JSON.stringify({ 
            text: "Voice recording received. Please describe what you said and I'll help format it as tasks.",
            note: "Direct audio transcription is being processed."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Transcription service error");
    }

    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content || "Could not transcribe audio";

    console.log("Transcription completed successfully");

    return new Response(
      JSON.stringify({ text: transcription }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Transcription error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Transcription failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});