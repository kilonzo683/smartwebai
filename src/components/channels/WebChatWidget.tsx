import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, X, Send, Minimize2, Maximize2, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface WebChatWidgetProps {
  organizationId?: string;
  agentType?: string;
  primaryColor?: string;
  greeting?: string;
  position?: "bottom-right" | "bottom-left";
}

export function WebChatWidget({
  organizationId,
  agentType = "support",
  primaryColor = "#8b5cf6",
  greeting = "Hello! How can I help you today?",
  position = "bottom-right",
}: WebChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, greeting]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Create conversation if doesn't exist
      let convId = conversationId;
      if (!convId) {
        const { data: convData } = await supabase.auth.getUser();
        if (convData.user) {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert([{
              user_id: convData.user.id,
              agent_type: agentType,
              title: input.trim().slice(0, 50),
            }])
            .select()
            .single();

          if (newConv) {
            convId = newConv.id;
            setConversationId(newConv.id);
          }
        }
      }

      // Call chat function
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          message: input.trim(),
          agentType,
          conversationId: convId,
          channel: "webchat",
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || "I apologize, I couldn't process that request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I'm sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const positionClasses = position === "bottom-right" ? "right-4" : "left-4";

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform"
        style={{ backgroundColor: primaryColor, [position === "bottom-right" ? "right" : "left"]: "1rem" }}
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 ${positionClasses} z-50 transition-all duration-300`}
      style={{ width: isMinimized ? "300px" : "380px" }}
    >
      <div className="bg-background border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <span className="font-semibold">Chat Support</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <ScrollArea className="h-80 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-[10px] opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
