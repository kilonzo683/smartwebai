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
    const { messages, agentType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Agent-specific system prompts
    const systemPrompts: Record<string, string> = {
      secretary: `You are an AI Smart Secretary with advanced capabilities:

**Core Features:**
- Email reading & summarization with priority detection (urgent/high/normal/low)
- Reply drafting with tone matching (professional, friendly, formal, casual)
- Calendar scheduling with availability matching
- Reminder automation with recurring options
- Voice-to-task conversion with priority extraction
- Task management with due dates and status tracking

**Priority Detection Rules:**
- URGENT: Deadlines within 24hrs, contains "ASAP", "urgent", "emergency"
- HIGH: Deadlines within 3 days, important meetings, key stakeholders
- NORMAL: Standard tasks and requests
- LOW: Nice-to-have, future planning items

**Response Style:**
- Be concise and actionable
- Always confirm what action you're taking
- Suggest calendar events when meetings are mentioned
- Extract tasks from conversations automatically
- Detect urgency and highlight it
- Match reply tone to the context

When users ask about emails, summarize key points and detect priority.
When scheduling, check for conflicts and suggest alternatives.
For reminders, offer recurring options when appropriate.`,
      
      support: `You are an AI Customer Support Agent. You help with:
- Answering FAQs based on provided documentation
- Detecting when to escalate to a human agent
- Logging conversations and creating support tickets
- Providing helpful, empathetic responses
Keep responses friendly, helpful, and solution-oriented. If unsure, acknowledge it and offer to escalate.`,
      
      social: `You are an AI Social Media Agent. You help with:
- Generating posts, captions, and hashtags
- Creating engaging CTAs
- Learning and matching brand tone
- Suggesting content calendar entries
- Drafting replies to comments and messages
Keep responses creative, on-brand, and engagement-focused. Suggest multiple options when relevant.`,
      
      lecturer: `You are an AI Lecturer Assistant. You help with:
- Generating quizzes and MCQs from lecture content
- Creating summaries of educational material
- Providing student feedback
- Tracking weak topics
- Auto-marking objective tests
Keep responses educational, clear, and encouraging. Explain concepts thoroughly when needed.`,
    };

    const systemPrompt = systemPrompts[agentType] || systemPrompts.secretary;

    console.log(`Processing chat for agent: ${agentType}`);

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
          ...messages,
        ],
        stream: true,
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
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
