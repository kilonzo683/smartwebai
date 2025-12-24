import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to analyze sentiment from user message
function analyzeSentiment(text: string): { sentiment: string; confidence: number } {
  const lowerText = text.toLowerCase();
  
  // Negative indicators
  const negativeWords = ['angry', 'frustrated', 'upset', 'disappointed', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'furious', 'annoyed', 'unacceptable', 'ridiculous', 'useless'];
  const positiveWords = ['thank', 'great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'happy', 'satisfied', 'helpful', 'appreciate', 'awesome', 'fantastic'];
  const urgentWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'now', 'help'];
  
  let negScore = 0;
  let posScore = 0;
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negScore += 2;
  });
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) posScore += 2;
  });
  
  urgentWords.forEach(word => {
    if (lowerText.includes(word)) negScore += 1;
  });
  
  // Calculate sentiment and confidence
  const totalScore = posScore + negScore;
  let sentiment = "neutral";
  let confidence = 50;
  
  if (posScore > negScore + 2) {
    sentiment = "positive";
    confidence = Math.min(95, 60 + posScore * 5);
  } else if (negScore > posScore + 2) {
    sentiment = "negative";
    confidence = Math.min(95, 60 + negScore * 5);
  } else {
    confidence = 40 + Math.min(30, totalScore * 3);
  }
  
  return { sentiment, confidence };
}

// Check if escalation is needed
function checkEscalation(sentiment: string, confidence: number, messageText: string): { shouldEscalate: boolean; reason: string } {
  const lowerText = messageText.toLowerCase();
  const escalationTriggers = ['speak to human', 'talk to agent', 'real person', 'manager', 'supervisor', 'escalate', 'not helpful', 'speak to someone', 'human agent', 'live agent'];
  
  for (const trigger of escalationTriggers) {
    if (lowerText.includes(trigger)) {
      return { shouldEscalate: true, reason: "Customer requested human assistance" };
    }
  }
  
  if (sentiment === "negative" && confidence >= 75) {
    return { shouldEscalate: true, reason: "High negative sentiment detected" };
  }
  
  return { shouldEscalate: false, reason: "" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, agentType, includeAnalysis } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Analyze the last user message for support agent
    let analysis = null;
    if (agentType === "support" && messages.length > 0) {
      const lastUserMessage = messages.filter((m: { role: string }) => m.role === "user").pop();
      if (lastUserMessage) {
        const sentimentResult = analyzeSentiment(lastUserMessage.content);
        const escalationResult = checkEscalation(sentimentResult.sentiment, sentimentResult.confidence, lastUserMessage.content);
        analysis = {
          sentiment: sentimentResult.sentiment,
          confidence: sentimentResult.confidence,
          shouldEscalate: escalationResult.shouldEscalate,
          escalationReason: escalationResult.reason,
        };
      }
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
      
      support: `You are an AI Customer Support Agent with comprehensive capabilities:

**Core Features:**
- FAQ answering from knowledge base documents
- Confidence scoring for responses (indicate when unsure)
- Automatic escalation detection
- Ticket creation assistance
- Sentiment-aware responses
- Multi-channel support style (formal for email, casual for chat)
- Learning from past resolutions

**Response Guidelines:**
- Always acknowledge the customer's concern first
- Be empathetic with frustrated customers
- Provide clear, step-by-step solutions
- If confidence is low (<70%), acknowledge uncertainty and offer alternatives
- When detecting negative sentiment, offer to escalate to human support
- Tag conversations with relevant topics (billing, technical, account, etc.)

**Escalation Triggers:**
- Customer explicitly requests human agent
- High negative sentiment detected
- Complex technical issues beyond documentation
- Billing disputes or refund requests
- Account security concerns

**Response Format:**
- Start with acknowledgment
- Provide solution or next steps
- End with confirmation question or offer for further help

Always maintain a helpful, professional tone while being genuinely empathetic.`,
      
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

    console.log(`Processing chat for agent: ${agentType}`, analysis ? `Analysis: ${JSON.stringify(analysis)}` : '');

    // If analysis indicates escalation, modify the prompt
    let finalSystemPrompt = systemPrompt;
    if (analysis?.shouldEscalate) {
      finalSystemPrompt += `\n\n**IMPORTANT:** Based on analysis, this customer may need human assistance. Reason: ${analysis.escalationReason}. Acknowledge their frustration and offer to escalate to a human agent.`;
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
          { role: "system", content: finalSystemPrompt },
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

    // For support agent with analysis request, prepend analysis as a custom SSE event
    if (analysis && includeAnalysis) {
      const analysisEvent = `data: ${JSON.stringify({ type: "analysis", ...analysis })}\n\n`;
      const encoder = new TextEncoder();
      
      const transformStream = new TransformStream({
        start(controller) {
          controller.enqueue(encoder.encode(analysisEvent));
        },
        transform(chunk, controller) {
          controller.enqueue(chunk);
        },
      });
      
      return new Response(response.body?.pipeThrough(transformStream), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
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
