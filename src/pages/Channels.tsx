import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChannelManager } from "@/components/channels/ChannelManager";
import { ChannelRouting } from "@/components/channels/ChannelRouting";
import { MessageSquare, Route } from "lucide-react";

export default function Channels() {
  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Communication Channels</h1>
            <p className="text-muted-foreground">Manage channels and message routing</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="channels" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <TabsList>
          <TabsTrigger value="channels" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="routing" className="gap-2">
            <Route className="w-4 h-4" />
            Routing
          </TabsTrigger>
        </TabsList>
        <TabsContent value="channels" className="mt-6">
          <ChannelManager />
        </TabsContent>
        <TabsContent value="routing" className="mt-6">
          <ChannelRouting />
        </TabsContent>
      </Tabs>
    </div>
  );
}
