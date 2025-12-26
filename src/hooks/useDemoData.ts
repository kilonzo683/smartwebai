import { usePlatformStatus } from "@/contexts/PlatformStatusContext";

// Demo conversations
export const demoConversations = [
  {
    id: "demo-conv-1",
    title: "Help with account setup",
    agent_type: "support",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    sentiment: "positive",
    is_escalated: false,
    confidence_score: 0.92,
  },
  {
    id: "demo-conv-2",
    title: "Schedule meeting with team",
    agent_type: "secretary",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    sentiment: "neutral",
    is_escalated: false,
    confidence_score: 0.88,
  },
  {
    id: "demo-conv-3",
    title: "Create Instagram post for product launch",
    agent_type: "social",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    sentiment: "positive",
    is_escalated: false,
    confidence_score: 0.95,
  },
  {
    id: "demo-conv-4",
    title: "Generate quiz from lecture notes",
    agent_type: "lecturer",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    sentiment: "positive",
    is_escalated: false,
    confidence_score: 0.91,
  },
  {
    id: "demo-conv-5",
    title: "Billing inquiry - payment failed",
    agent_type: "support",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    sentiment: "negative",
    is_escalated: true,
    confidence_score: 0.75,
  },
];

// Demo messages for conversations
export const demoMessages = [
  { id: "demo-msg-1", role: "user", content: "I need help setting up my account", conversation_id: "demo-conv-1" },
  { id: "demo-msg-2", role: "assistant", content: "I'd be happy to help you set up your account! Let me guide you through the process step by step.", conversation_id: "demo-conv-1" },
  { id: "demo-msg-3", role: "user", content: "Schedule a meeting with the marketing team for next Tuesday at 2pm", conversation_id: "demo-conv-2" },
  { id: "demo-msg-4", role: "assistant", content: "I've scheduled a meeting with the marketing team for Tuesday at 2:00 PM. I've sent calendar invites to all team members.", conversation_id: "demo-conv-2" },
];

// Demo quick stats
export const demoQuickStats = {
  totalConversations: 1247,
  activeUsers: 89,
  avgResponseTime: "1.2s",
  satisfactionScore: 94.5,
  messagesThisWeek: 3421,
  resolvedTickets: 156,
  pendingTickets: 12,
  agentsActive: 4,
};

// Demo analytics data
export const demoAnalytics = {
  conversationsByDay: [
    { date: "Mon", count: 145 },
    { date: "Tue", count: 189 },
    { date: "Wed", count: 167 },
    { date: "Thu", count: 234 },
    { date: "Fri", count: 198 },
    { date: "Sat", count: 87 },
    { date: "Sun", count: 65 },
  ],
  messagesByAgent: [
    { agent: "Secretary", messages: 892, color: "#3B82F6" },
    { agent: "Support", messages: 1245, color: "#10B981" },
    { agent: "Social", messages: 567, color: "#F59E0B" },
    { agent: "Lecturer", messages: 423, color: "#8B5CF6" },
  ],
  satisfactionTrend: [
    { month: "Jan", score: 88 },
    { month: "Feb", score: 91 },
    { month: "Mar", score: 89 },
    { month: "Apr", score: 93 },
    { month: "May", score: 94 },
    { month: "Jun", score: 95 },
  ],
  topIssues: [
    { issue: "Account Setup", count: 234, percentage: 28 },
    { issue: "Billing Questions", count: 189, percentage: 23 },
    { issue: "Feature Requests", count: 156, percentage: 19 },
    { issue: "Technical Support", count: 134, percentage: 16 },
    { issue: "General Inquiries", count: 112, percentage: 14 },
  ],
  responseTimeByHour: Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}:00`,
    avgTime: Math.random() * 3 + 0.5,
  })),
};

// Demo recent activity
export const demoRecentActivity = [
  {
    id: "demo-activity-1",
    type: "conversation",
    title: "New support conversation started",
    description: "Customer inquired about premium features",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    agent: "support",
  },
  {
    id: "demo-activity-2",
    type: "task",
    title: "Meeting scheduled",
    description: "Team sync for Q4 planning - Tomorrow 10:00 AM",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    agent: "secretary",
  },
  {
    id: "demo-activity-3",
    type: "post",
    title: "Social post published",
    description: "Product launch announcement on Instagram",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    agent: "social",
  },
  {
    id: "demo-activity-4",
    type: "quiz",
    title: "Quiz generated",
    description: "15 questions from Chapter 5 lecture notes",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    agent: "lecturer",
  },
  {
    id: "demo-activity-5",
    type: "ticket",
    title: "Ticket resolved",
    description: "Password reset issue for user@example.com",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    agent: "support",
  },
  {
    id: "demo-activity-6",
    type: "email",
    title: "Email draft created",
    description: "Follow-up email for client meeting",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    agent: "secretary",
  },
];

// Demo tasks
export const demoTasks = [
  {
    id: "demo-task-1",
    title: "Review Q4 marketing strategy",
    status: "pending",
    priority: "high",
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "demo-task-2",
    title: "Prepare presentation slides",
    status: "in_progress",
    priority: "medium",
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "demo-task-3",
    title: "Send weekly report to stakeholders",
    status: "completed",
    priority: "medium",
    due_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

// Demo calendar events
export const demoCalendarEvents = [
  {
    id: "demo-event-1",
    title: "Team Standup",
    start_time: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    end_time: new Date(Date.now() + 1000 * 60 * 60 * 2.5).toISOString(),
    location: "Conference Room A",
  },
  {
    id: "demo-event-2",
    title: "Client Call - Acme Corp",
    start_time: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    end_time: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
    location: "Zoom",
  },
  {
    id: "demo-event-3",
    title: "Product Demo",
    start_time: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    end_time: new Date(Date.now() + 1000 * 60 * 60 * 49).toISOString(),
    location: "Main Office",
  },
];

// Demo tickets
export const demoTickets = [
  {
    id: "demo-ticket-1",
    title: "Cannot access dashboard",
    status: "open",
    priority: "high",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    description: "User reports blank screen when loading dashboard",
  },
  {
    id: "demo-ticket-2",
    title: "Feature request: Dark mode",
    status: "in_progress",
    priority: "medium",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    description: "Multiple users requesting dark mode option",
  },
  {
    id: "demo-ticket-3",
    title: "Billing discrepancy",
    status: "resolved",
    priority: "low",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    description: "Invoice amount doesn't match subscription",
  },
];

// Hook to get demo data with demo mode status
export function useDemoData() {
  const { demoMode } = usePlatformStatus();

  return {
    isDemoMode: demoMode,
    conversations: demoMode ? demoConversations : [],
    messages: demoMode ? demoMessages : [],
    quickStats: demoMode ? demoQuickStats : null,
    analytics: demoMode ? demoAnalytics : null,
    recentActivity: demoMode ? demoRecentActivity : [],
    tasks: demoMode ? demoTasks : [],
    calendarEvents: demoMode ? demoCalendarEvents : [],
    tickets: demoMode ? demoTickets : [],
  };
}
