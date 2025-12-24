import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  otp: string;
  type: "signup" | "login";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, type }: VerificationEmailRequest = await req.json();

    console.log(`Sending ${type} verification email to ${email}`);

    const subject = type === "signup" 
      ? "Verify your AI Work Assistant account" 
      : "Your login verification code";

    const emailResponse = await resend.emails.send({
      from: "AI Work Assistant <onboarding@resend.dev>",
      to: [email],
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                  <span style="font-size: 28px;">✨</span>
                </div>
                <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0;">AI Work Assistant</h1>
              </div>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                ${type === "signup" 
                  ? "Welcome! Use this verification code to complete your registration:" 
                  : "Use this code to sign in to your account:"}
              </p>
              
              <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #18181b; font-family: monospace;">${otp}</span>
              </div>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
                This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            
            <p style="text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 24px;">
              © ${new Date().getFullYear()} AI Work Assistant. All rights reserved.
            </p>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);