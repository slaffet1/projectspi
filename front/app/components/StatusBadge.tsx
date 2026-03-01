import { Badge } from "@/app/components/ui/badge";

export type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    paid: {
      label: "Payée",
      className: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
    },
    pending: {
      label: "En attente",
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
    },
    overdue: {
      label: "En retard",
      className: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
    },
    draft: {
      label: "Brouillon",
      className: "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={`${config.className} ${className || ""}`}>
      {config.label}
    </Badge>
  );
}
