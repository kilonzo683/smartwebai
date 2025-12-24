import { useState } from "react";
import { Download, Receipt, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  planName: string;
  invoiceNumber: string;
}

// Mock data - in production this would come from Stripe or your billing system
const mockInvoices: Invoice[] = [
  {
    id: "1",
    date: "2024-12-01",
    amount: 99,
    status: "paid",
    planName: "Professional",
    invoiceNumber: "INV-2024-001",
  },
  {
    id: "2",
    date: "2024-11-01",
    amount: 99,
    status: "paid",
    planName: "Professional",
    invoiceNumber: "INV-2024-002",
  },
  {
    id: "3",
    date: "2024-10-01",
    amount: 29,
    status: "paid",
    planName: "Starter",
    invoiceNumber: "INV-2024-003",
  },
];

const statusConfig = {
  paid: {
    icon: CheckCircle2,
    label: "Paid",
    variant: "default" as const,
    className: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    variant: "secondary" as const,
    className: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    variant: "destructive" as const,
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
};

export function InvoiceHistory() {
  const [invoices] = useState<Invoice[]>(mockInvoices);

  const handleDownload = (invoice: Invoice) => {
    // In production, this would generate/download a PDF
    console.log("Downloading invoice:", invoice.invoiceNumber);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoice History
        </CardTitle>
        <CardDescription>
          View and download your past invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No invoices yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const status = statusConfig[invoice.status];
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{invoice.planName}</TableCell>
                    <TableCell>${invoice.amount}</TableCell>
                    <TableCell>
                      <Badge className={status.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(invoice)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
