import { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash2, Loader2, Save, X, Check, Sparkles, 
  Zap, Building2, Crown 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  max_users: number;
  max_agents: number;
  max_messages: number;
  features: Json;
  is_active: boolean | null;
}

const planIcons: Record<string, typeof Sparkles> = {
  free: Sparkles,
  starter: Zap,
  professional: Building2,
  enterprise: Crown,
};

const defaultPlan: Omit<Plan, "id"> = {
  name: "",
  slug: "",
  price_monthly: 0,
  price_yearly: null,
  max_users: 5,
  max_agents: 2,
  max_messages: 1000,
  features: {},
  is_active: true,
};

export function PlanControl() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<Omit<Plan, "id">>(defaultPlan);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      setPlans((data || []).map(p => ({
        ...p,
        features: p.features || {},
      })));
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        slug: plan.slug,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        max_users: plan.max_users,
        max_agents: plan.max_agents,
        max_messages: plan.max_messages,
        features: plan.features,
        is_active: plan.is_active,
      });
    } else {
      setEditingPlan(null);
      setFormData(defaultPlan);
    }
    setDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        name: formData.name,
        slug: formData.slug,
        price_monthly: formData.price_monthly,
        price_yearly: formData.price_yearly,
        max_users: formData.max_users,
        max_agents: formData.max_agents,
        max_messages: formData.max_messages,
        features: formData.features,
        is_active: formData.is_active,
      };
      
      if (editingPlan) {
        const { error } = await supabase
          .from("subscription_plans")
          .update(saveData)
          .eq("id", editingPlan.id);

        if (error) throw error;
        toast.success("Plan updated successfully");
      } else {
        const { error } = await supabase
          .from("subscription_plans")
          .insert(saveData);

        if (error) throw error;
        toast.success("Plan created successfully");
      }

      setDialogOpen(false);
      fetchPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ is_active: !plan.is_active })
        .eq("id", plan.id);

      if (error) throw error;
      
      setPlans(prev => prev.map(p => 
        p.id === plan.id ? { ...p, is_active: !p.is_active } : p
      ));
      
      toast.success(`Plan ${!plan.is_active ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error toggling plan:", error);
      toast.error("Failed to update plan");
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;
      
      setPlans(prev => prev.filter(p => p.id !== planId));
      toast.success("Plan deleted successfully");
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Subscription Plans</h2>
          <p className="text-sm text-muted-foreground">
            Manage pricing tiers and feature limits
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {/* Plans Table */}
      <Card className="glass">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Price (Monthly)</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Agents</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => {
                const IconComponent = planIcons[plan.slug] || Sparkles;
                return (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-xs text-muted-foreground">{plan.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">${plan.price_monthly}</span>
                      {plan.price_yearly && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (${plan.price_yearly}/yr)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{plan.max_users === 999 ? "Unlimited" : plan.max_users}</TableCell>
                    <TableCell>{plan.max_agents === 999 ? "Unlimited" : plan.max_agents}</TableCell>
                    <TableCell>
                      {plan.max_messages >= 100000 ? "Unlimited" : plan.max_messages.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={plan.is_active ?? false}
                          onCheckedChange={() => handleToggleActive(plan)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Edit Plan" : "Create New Plan"}
            </DialogTitle>
            <DialogDescription>
              Configure the plan details and limits
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Professional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="professional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceMonthly">Monthly Price ($)</Label>
                <Input
                  id="priceMonthly"
                  type="number"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_monthly: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceYearly">Yearly Price ($)</Label>
                <Input
                  id="priceYearly"
                  type="number"
                  value={formData.price_yearly || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_yearly: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_users: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAgents">Max Agents</Label>
                <Input
                  id="maxAgents"
                  type="number"
                  value={formData.max_agents}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_agents: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMessages">Max Messages</Label>
                <Input
                  id="maxMessages"
                  type="number"
                  value={formData.max_messages}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_messages: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editingPlan ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
