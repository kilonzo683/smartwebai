import { useState, useEffect } from "react";
import { Check, Sparkles, Zap, Building2, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

interface PlanFeatures {
  support?: string;
  analytics?: string;
  channels?: string[];
  custom_branding?: boolean;
  api_access?: boolean;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  max_users: number;
  max_agents: number;
  max_messages: number;
  features: PlanFeatures;
  is_active: boolean | null;
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Sparkles className="h-6 w-6" />,
  starter: <Zap className="h-6 w-6" />,
  professional: <Building2 className="h-6 w-6" />,
  enterprise: <Crown className="h-6 w-6" />,
};

export function PlanSelector() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { currentOrg } = useOrganization();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      const typedPlans: Plan[] = (data || []).map((p) => ({
        ...p,
        features: (p.features || {}) as PlanFeatures,
      }));
      setPlans(typedPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (plan: Plan) => {
    if (!currentOrg) {
      toast.error("Please select an organization first");
      return;
    }

    setUpgrading(plan.id);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          subscription_plan: plan.slug,
          max_users: plan.max_users,
          max_agents: plan.max_agents,
          max_messages_per_month: plan.max_messages,
        })
        .eq("id", currentOrg.id);

      if (error) throw error;
      toast.success(`Successfully switched to ${plan.name} plan`);
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to update plan");
    } finally {
      setUpgrading(null);
    }
  };

  const getPrice = (plan: Plan) => {
    if (isYearly && plan.price_yearly) {
      return plan.price_yearly / 12;
    }
    return plan.price_monthly;
  };

  const formatFeatures = (plan: Plan) => {
    const features = [];
    features.push(`${plan.max_users === 999 ? 'Unlimited' : plan.max_users} team members`);
    features.push(`${plan.max_agents === 999 ? 'Unlimited' : plan.max_agents} AI agents`);
    features.push(`${plan.max_messages >= 100000 ? 'Unlimited' : plan.max_messages.toLocaleString()} messages/month`);
    
    if (plan.features.support) {
      features.push(`${plan.features.support.charAt(0).toUpperCase() + plan.features.support.slice(1)} support`);
    }
    if (plan.features.analytics) {
      features.push(`${plan.features.analytics.charAt(0).toUpperCase() + plan.features.analytics.slice(1)} analytics`);
    }
    if (plan.features.channels) {
      features.push(`${plan.features.channels.length} communication channels`);
    }
    if (plan.features.custom_branding) {
      features.push("Custom branding");
    }
    if (plan.features.api_access) {
      features.push("API access");
    }
    
    return features;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4">
        <Label htmlFor="billing-toggle" className={!isYearly ? "font-semibold" : "text-muted-foreground"}>
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label htmlFor="billing-toggle" className={isYearly ? "font-semibold" : "text-muted-foreground"}>
          Yearly
          <Badge variant="secondary" className="ml-2">Save 17%</Badge>
        </Label>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrentPlan = currentOrg?.subscription_plan === plan.slug;
          const price = getPrice(plan);
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.slug === 'professional' ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.slug === 'professional' && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  {planIcons[plan.slug]}
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">${price}</span>
                  <span className="text-muted-foreground">/month</span>
                  {isYearly && plan.price_yearly && (
                    <div className="text-sm text-muted-foreground">
                      Billed annually (${plan.price_yearly}/year)
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {formatFeatures(plan).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : plan.slug === 'professional' ? "default" : "secondary"}
                  disabled={isCurrentPlan || upgrading === plan.id}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {upgrading === plan.id ? (
                    "Processing..."
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    `Select ${plan.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
