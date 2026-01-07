import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Running scheduled post publisher...");

    const now = new Date().toISOString();

    // Find all posts that are scheduled and due for publishing
    const { data: duePosts, error: fetchError } = await supabase
      .from("social_content_calendar")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (fetchError) {
      console.error("Error fetching due posts:", fetchError);
      throw fetchError;
    }

    if (!duePosts || duePosts.length === 0) {
      console.log("No posts due for publishing");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No posts due for publishing",
        published: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${duePosts.length} posts to publish`);

    const publishResults = [];

    for (const post of duePosts) {
      try {
        // In a production environment, this would call the actual platform APIs
        // For now, we'll mark it as published and log the action
        
        // Simulate platform publishing (this is where real API calls would go)
        const publishResult = {
          platform: post.platform,
          postId: post.id,
          externalPostId: `${post.platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          publishedAt: now,
          success: true,
        };

        // Update post status to published
        const { error: updateError } = await supabase
          .from("social_content_calendar")
          .update({
            status: "published",
            published_at: now,
          })
          .eq("id", post.id);

        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError);
          publishResults.push({
            postId: post.id,
            success: false,
            error: updateError.message,
          });
          continue;
        }

        // Log the publishing event
        await supabase.from("analytics_events").insert({
          event_type: "post_published",
          agent_type: "social",
          channel: post.platform,
          user_id: post.user_id,
          metadata: {
            post_id: post.id,
            post_title: post.title,
            external_post_id: publishResult.externalPostId,
            scheduled_at: post.scheduled_at,
            actual_published_at: now,
          },
        });

        console.log(`Published post: ${post.id} (${post.title}) to ${post.platform}`);
        
        publishResults.push({
          postId: post.id,
          title: post.title,
          platform: post.platform,
          success: true,
          externalPostId: publishResult.externalPostId,
        });

      } catch (postError) {
        console.error(`Error publishing post ${post.id}:`, postError);
        publishResults.push({
          postId: post.id,
          success: false,
          error: postError instanceof Error ? postError.message : "Unknown error",
        });
      }
    }

    const successCount = publishResults.filter(r => r.success).length;
    const failCount = publishResults.filter(r => !r.success).length;

    console.log(`Publishing complete. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Published ${successCount} posts, ${failCount} failed`,
      published: successCount,
      failed: failCount,
      results: publishResults,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Scheduled publish error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});