import { CreditCard, Receipt, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanSelector } from "@/components/billing/PlanSelector";
import { UsageOverview } from "@/components/billing/UsageOverview";
import { InvoiceHistory } from "@/components/billing/InvoiceHistory";

export default function Billing() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your plan, monitor usage, and view invoices
          </p>
        </div>
      </div>

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <PlanSelector />
          </TabsContent>

          <TabsContent value="usage">
            <UsageOverview />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoiceHistory />
          </TabsContent>
      </Tabs>
    </div>
  );
}
