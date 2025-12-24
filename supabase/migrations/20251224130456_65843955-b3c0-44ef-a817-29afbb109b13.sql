-- Create tasks table for Smart Secretary
CREATE TABLE public.secretary_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'voice', 'email', 'chat')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create reminders table for Smart Secretary
CREATE TABLE public.secretary_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- daily, weekly, monthly
  is_completed BOOLEAN DEFAULT false,
  task_id UUID REFERENCES public.secretary_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email drafts table for Smart Secretary
CREATE TABLE public.secretary_email_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'friendly', 'formal', 'casual')),
  recipient_email TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'archived')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar events table for Smart Secretary
CREATE TABLE public.secretary_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendees TEXT[] DEFAULT '{}',
  is_all_day BOOLEAN DEFAULT false,
  reminder_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.secretary_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretary_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretary_email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretary_calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for secretary_tasks
CREATE POLICY "Users can view their own tasks" ON public.secretary_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON public.secretary_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.secretary_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.secretary_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for secretary_reminders
CREATE POLICY "Users can view their own reminders" ON public.secretary_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders" ON public.secretary_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" ON public.secretary_reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON public.secretary_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for secretary_email_drafts
CREATE POLICY "Users can view their own email drafts" ON public.secretary_email_drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email drafts" ON public.secretary_email_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email drafts" ON public.secretary_email_drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email drafts" ON public.secretary_email_drafts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for secretary_calendar_events
CREATE POLICY "Users can view their own calendar events" ON public.secretary_calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar events" ON public.secretary_calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" ON public.secretary_calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" ON public.secretary_calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_secretary_tasks_updated_at
  BEFORE UPDATE ON public.secretary_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_secretary_reminders_updated_at
  BEFORE UPDATE ON public.secretary_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_secretary_email_drafts_updated_at
  BEFORE UPDATE ON public.secretary_email_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_secretary_calendar_events_updated_at
  BEFORE UPDATE ON public.secretary_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();