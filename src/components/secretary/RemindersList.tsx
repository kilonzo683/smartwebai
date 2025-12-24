import { useState, useEffect } from "react";
import { Plus, Bell, BellOff, Trash2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  remind_at: string;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  is_completed: boolean;
  created_at: string;
}

export function RemindersList() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    remind_at: "",
    is_recurring: false,
    recurrence_pattern: "daily",
  });

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from("secretary_reminders")
        .select("*")
        .eq("user_id", user?.id)
        .order("remind_at", { ascending: true });

      if (error) throw error;
      setReminders((data || []) as Reminder[]);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.remind_at || !user) return;

    try {
      const { error } = await supabase
        .from("secretary_reminders")
        .insert({
          user_id: user.id,
          title: formData.title,
          remind_at: new Date(formData.remind_at).toISOString(),
          is_recurring: formData.is_recurring,
          recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
        });

      if (error) throw error;
      
      toast({ title: "Reminder created" });
      setFormData({ title: "", remind_at: "", is_recurring: false, recurrence_pattern: "daily" });
      setIsDialogOpen(false);
      fetchReminders();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create reminder", variant: "destructive" });
    }
  };

  const toggleReminder = async (reminder: Reminder) => {
    try {
      const { error } = await supabase
        .from("secretary_reminders")
        .update({ is_completed: !reminder.is_completed })
        .eq("id", reminder.id);

      if (error) throw error;
      fetchReminders();
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("secretary_reminders")
        .delete()
        .eq("id", reminderId);

      if (error) throw error;
      toast({ title: "Reminder deleted" });
      fetchReminders();
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const upcomingReminders = reminders.filter(r => !r.is_completed && new Date(r.remind_at) > new Date());
  const pastReminders = reminders.filter(r => r.is_completed || new Date(r.remind_at) <= new Date());

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
            <Bell className="w-5 h-5" />
            Reminders
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
                <DialogTitle>New Reminder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Reminder title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remind At</Label>
                  <Input
                    type="datetime-local"
                    value={formData.remind_at}
                    onChange={(e) => setFormData({ ...formData, remind_at: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Recurring</Label>
                  <Switch
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                  />
                </div>
                {formData.is_recurring && (
                  <div className="space-y-2">
                    <Label>Pattern</Label>
                    <select
                      value={formData.recurrence_pattern}
                      onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value })}
                      className="w-full bg-accent rounded-lg px-3 py-2"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
                <Button onClick={handleSubmit} className="w-full">
                  Create Reminder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-60 overflow-y-auto">
        {upcomingReminders.length === 0 && pastReminders.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No reminders</p>
        ) : (
          <>
            {upcomingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 group"
              >
                <Bell className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{reminder.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(reminder.remind_at).toLocaleString()}
                    {reminder.is_recurring && (
                      <span className="ml-2 text-primary">({reminder.recurrence_pattern})</span>
                    )}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => toggleReminder(reminder)}>
                    <BellOff className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteReminder(reminder.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {pastReminders.length > 0 && (
              <p className="text-xs text-muted-foreground pt-2">Completed ({pastReminders.length})</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
