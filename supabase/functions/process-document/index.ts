import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const action = formData.get("action") as string || "extract";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Upload file to storage
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("lecture-documents")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to upload file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For text-based files, extract content directly
    let extractedText = "";
    const textTypes = ["text/plain", "text/markdown", "application/json"];
    
    if (textTypes.includes(file.type) || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      extractedText = await file.text();
    } else {
      // For PDFs and other documents, we'll use AI to process the content description
      // In a production app, you'd integrate a PDF parsing library
      extractedText = `[Document: ${file.name}] - Content uploaded successfully. Please describe what you'd like me to do with this document.`;
    }

    // Save document record
    const { data: docRecord, error: dbError } = await supabase
      .from("lecture_documents")
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        content_type: file.type,
        extracted_text: extractedText.slice(0, 50000), // Limit stored text
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
    }

    // If action is to generate quiz, call AI
    if (action === "quiz" && extractedText) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ 
          success: true, 
          document: docRecord,
          message: "Document uploaded. AI quiz generation requires API key configuration."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use tool calling to get structured quiz data
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: "You are an educational AI assistant. Generate quiz questions based on the provided document content."
            },
            {
              role: "user",
              content: `Generate a quiz with 5-10 multiple choice questions based on this document content:\n\n${extractedText.slice(0, 15000)}`
            }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_quiz",
                description: "Create a structured quiz with multiple choice questions",
                parameters: {
                  type: "object",
                  properties: {
                    title: { 
                      type: "string", 
                      description: "A short descriptive title for the quiz based on the content" 
                    },
                    questions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          question: { type: "string", description: "The question text" },
                          options: { 
                            type: "array", 
                            items: { type: "string" },
                            description: "Array of 4 answer options" 
                          },
                          correctAnswer: { 
                            type: "number", 
                            description: "Index of the correct answer (0-3)" 
                          }
                        },
                        required: ["question", "options", "correctAnswer"]
                      }
                    }
                  },
                  required: ["title", "questions"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "create_quiz" } }
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        console.log("AI Response:", JSON.stringify(aiData));
        
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const quizData = JSON.parse(toolCall.function.arguments);
          
          // Save quiz to database
          const { data: quizRecord, error: quizError } = await supabase
            .from("quizzes")
            .insert({
              user_id: user.id,
              document_id: docRecord?.id,
              title: quizData.title || `Quiz from ${file.name}`,
              questions: quizData.questions || [],
            })
            .select()
            .single();

          if (quizError) {
            console.error("Quiz save error:", quizError);
          }

          return new Response(JSON.stringify({
            success: true,
            document: docRecord,
            quiz: quizRecord,
            quizData: quizData,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        console.error("AI response not ok:", await aiResponse.text());
      }
    }

    return new Response(JSON.stringify({
      success: true,
      document: docRecord,
      message: `Document "${file.name}" uploaded successfully.`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    // Log detailed error server-side for debugging
    console.error("Process document error:", error);
    // Return sanitized error message to client - don't expose internal details
    return new Response(JSON.stringify({ error: "An error occurred while processing the document. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
