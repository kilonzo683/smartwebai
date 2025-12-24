import { useState, useEffect } from "react";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Users, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  attendees: string[];
  is_all_day: boolean;
  created_at: string;
}

export function CalendarWidget() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    is_all_day: false,
  });

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from("secretary_calendar_events")
        .select("*")
        .eq("user_id", user?.id)
        .gte("start_time", today.toISOString())
        .order("start_time", { ascending: true })
        .limit(10);

      if (error) throw error;
      setEvents((data || []) as CalendarEvent[]);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.start_time || !user) return;

    try {
      const startTime = new Date(formData.start_time);
      const endTime = formData.end_time 
        ? new Date(formData.end_time) 
        : new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour

      const { error } = await supabase
        .from("secretary_calendar_events")
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          location: formData.location || null,
          is_all_day: formData.is_all_day,
        });

      if (error) throw error;
      
      toast({ title: "Event created" });
      setFormData({ title: "", description: "", start_time: "", end_time: "", location: "", is_all_day: false });
      setIsDialogOpen(false);
      fetchEvents();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("secretary_calendar_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
      toast({ title: "Event deleted" });
      fetchEvents();
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const formatEventTime = (start: string, end: string, isAllDay: boolean) => {
    if (isAllDay) return "All day";
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const groups: { [key: string]: CalendarEvent[] } = {};
    events.forEach((event) => {
      const date = new Date(event.start_time).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
    });
    return groups;
  };

  const groupedEvents = groupEventsByDate(events);

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Upcoming Events
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Meeting title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>All Day Event</Label>
                  <Switch
                    checked={formData.is_all_day}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_all_day: checked })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start</Label>
                    <Input
                      type={formData.is_all_day ? "date" : "datetime-local"}
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  {!formData.is_all_day && (
                    <div className="space-y-2">
                      <Label>End</Label>
                      <Input
                        type="datetime-local"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Optional location"
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 max-h-80 overflow-y-auto">
        {Object.keys(groupedEvents).length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No upcoming events</p>
        ) : (
          Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <div key={date}>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {new Date(date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </p>
              <div className="space-y-2">
                {dateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 group"
                  >
                    <div className="w-1 h-full min-h-[40px] bg-primary rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{event.title}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatEventTime(event.start_time, event.end_time, event.is_all_day)}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => deleteEvent(event.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
