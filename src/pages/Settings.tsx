import { User, Bell, Shield, CreditCard, Palette, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const settingsSections = [
  {
    id: "profile",
    name: "Profile",
    description: "Manage your personal information and preferences",
    icon: User,
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Configure how and when you receive alerts",
    icon: Bell,
  },
  {
    id: "security",
    name: "Security",
    description: "Password, 2FA, and access management",
    icon: Shield,
  },
  {
    id: "billing",
    name: "Billing & Plans",
    description: "Subscription, invoices, and payment methods",
    icon: CreditCard,
  },
  {
    id: "appearance",
    name: "Appearance",
    description: "Customize the look and feel of your dashboard",
    icon: Palette,
  },
  {
    id: "integrations",
    name: "Integrations",
    description: "Connect with Google, Outlook, WhatsApp, and more",
    icon: Globe,
  },
];

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              className="glass rounded-2xl p-6 text-left hover:bg-card/80 transition-all duration-200 group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{section.name}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Plan Overview */}
      <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "600ms" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Current Plan</h3>
            <p className="text-muted-foreground text-sm">You're on the Pro plan</p>
          </div>
          <Button variant="glow">Upgrade Plan</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-accent/30">
            <p className="text-2xl font-bold text-foreground">4</p>
            <p className="text-xs text-muted-foreground">AI Agents</p>
          </div>
          <div className="p-4 rounded-xl bg-accent/30">
            <p className="text-2xl font-bold text-foreground">10K</p>
            <p className="text-xs text-muted-foreground">Messages/mo</p>
          </div>
          <div className="p-4 rounded-xl bg-accent/30">
            <p className="text-2xl font-bold text-foreground">5</p>
            <p className="text-xs text-muted-foreground">Team Members</p>
          </div>
          <div className="p-4 rounded-xl bg-accent/30">
            <p className="text-2xl font-bold text-foreground">∞</p>
            <p className="text-xs text-muted-foreground">Integrations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
