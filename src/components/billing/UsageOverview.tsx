import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bot, MessageSquare, Calendar } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";

export function UsageOverview() {
  const { currentOrg } = useOrganization();

  if (!currentOrg) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Select an organization to view usage
        </CardContent>
      </Card>
    );
  }

  const usageItems = [
    {
      icon: Users,
      label: "Team Members",
      used: 5, // This would come from actual data
      limit: currentOrg.max_users || 10,
      color: "bg-blue-500",
    },
    {
      icon: Bot,
      label: "AI Agents",
      used: 4,
      limit: currentOrg.max_agents || 4,
      color: "bg-purple-500",
    },
    {
      icon: MessageSquare,
      label: "Messages This Month",
      used: currentOrg.messages_used || 0,
      limit: currentOrg.max_messages_per_month || 1000,
      color: "bg-green-500",
    },
  ];

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 75) return "text-yellow-500";
    return "text-muted-foreground";
  };

  // Calculate billing period
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Billing Period
          </CardTitle>
          <CardDescription>
            {startOfMonth.toLocaleDateString()} - {endOfMonth.toLocaleDateString()} 
            ({daysLeft} days remaining)
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {usageItems.map((item) => {
          const percentage = getUsagePercentage(item.used, item.limit);
          const Icon = item.icon;
          
          return (
            <Card key={item.label}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={getUsageStatus(percentage)}>
                      {item.used.toLocaleString()} / {item.limit.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${percentage >= 90 ? '[&>div]:bg-destructive' : percentage >= 75 ? '[&>div]:bg-yellow-500' : ''}`}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
