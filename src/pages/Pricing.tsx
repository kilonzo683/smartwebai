import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, Zap, Building2, Crown, ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";

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

const faqs = [
  {
    question: "What's included in the free trial?",
    answer: "The free trial gives you full access to all features of the Professional plan for 14 days. No credit card required to start."
  },
  {
    question: "Can I change plans anytime?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the next billing cycle."
  },
  {
    question: "How do AI agents work?",
    answer: "Each AI agent is specialized for specific tasks. The Smart Secretary handles emails and scheduling, Customer Support manages tickets and FAQs, Social Media Agent creates and schedules content, and the Lecturer Assistant helps with educational content and assessments."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use end-to-end encryption, are SOC2 compliant, and never share your data with third parties. All data is stored in secure, enterprise-grade infrastructure."
  },
  {
    question: "Do you offer discounts for nonprofits or education?",
    answer: "Yes! We offer special pricing for nonprofit organizations and educational institutions. Contact our sales team for more information."
  },
  {
    question: "What happens if I exceed my message limit?",
    answer: "We'll notify you when you're approaching your limit. You can upgrade to a higher plan or purchase additional message credits to continue using the service."
  },
];

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/landing" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xl font-bold text-foreground">AI Work Assistant</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/landing" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Back to Home
              </Link>
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Choose the plan that fits your team. All plans include a 14-day free trial.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Label htmlFor="billing-toggle" className={!isYearly ? "font-semibold text-foreground" : "text-muted-foreground"}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={isYearly ? "font-semibold text-foreground" : "text-muted-foreground"}>
              Yearly
              <Badge variant="secondary" className="ml-2">Save 17%</Badge>
            </Label>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => {
                const price = getPrice(plan);
                const isPro = plan.slug === 'professional';
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative ${isPro ? 'border-primary shadow-xl scale-105' : ''}`}
                  >
                    {isPro && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader className="text-center">
                      <div className={`w-14 h-14 rounded-2xl ${isPro ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'} flex items-center justify-center mx-auto mb-4`}>
                        {planIcons[plan.slug]}
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>
                        <span className="text-4xl font-bold text-foreground">${price}</span>
                        <span className="text-muted-foreground">/month</span>
                        {isYearly && plan.price_yearly && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Billed ${plan.price_yearly}/year
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {formatFeatures(plan).map((feature, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link to="/auth" className="w-full">
                        <Button
                          className="w-full"
                          variant={isPro ? "default" : "outline"}
                          size="lg"
                        >
                          Start Free Trial
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-accent/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            All Plans Include
          </h2>
          <p className="text-muted-foreground mb-12">
            Every plan comes with these essential features
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              "All 4 AI Agents",
              "Real-time Chat",
              "File Uploads",
              "Mobile Access",
              "SSL Encryption",
              "Daily Backups",
              "99.9% Uptime",
              "Email Support",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 justify-center">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <HelpCircle className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-muted-foreground">
              Got questions? We've got answers.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-accent/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Still Have Questions?
          </h2>
          <p className="text-muted-foreground mb-8">
            Our team is happy to help. Contact us for a personalized demo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Button size="lg" variant="outline">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">AI Work Assistant</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 AI Work Assistant. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
