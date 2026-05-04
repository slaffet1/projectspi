import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  CheckCircle2,
  Receipt,
  Banknote,
  Smartphone,
  PenLine,
  Calendar,
  Hash,
  Building2,
  FileText,
  CreditCard,
  Clock,
  ImageIcon,
  X,
} from "lucide-react";
import { useState } from "react";

interface PaymentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  invoice: any;
  paymentTrace?: any;
}

const METHOD_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  cheque:   { label: "Chèque",           icon: Receipt,    color: "text-violet-700", bg: "bg-violet-100" },
  espece:   { label: "Espèces",          icon: Banknote,   color: "text-emerald-700", bg: "bg-emerald-100" },
  virement: { label: "Virement bancaire",icon: Smartphone, color: "text-sky-700",    bg: "bg-sky-100" },
  other:    { label: "Autre",            icon: PenLine,    color: "text-slate-700",  bg: "bg-slate-100" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  paid:      { label: "Payé",            color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  late_paid: { label: "Payé en retard",  color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200" },
};

// ✅ FIX: Prefix relative paths with backend base URL
const BACKEND_URL = "http://localhost:3001";
function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BACKEND_URL}${url}`;
}

export default function PaymentDetailsModal({
  open,
  onClose,
  invoice,
  paymentTrace,
}: PaymentDetailsModalProps) {
  const [imageFullscreen, setImageFullscreen] = useState(false);

  if (!invoice) return null;

  const trace     = paymentTrace || invoice?.payment_trace;
  const proofUrl  = resolveImageUrl(trace?.proof_image_url); // ✅ resolved URL
  const status    = invoice?.status;
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG["paid"];
  const method    = trace?.payment_method;
  const methodCfg = METHOD_CONFIG[method] || METHOD_CONFIG["other"];
  const MethodIcon = methodCfg.icon;

  const clientName =
    invoice?.quotes?.clients?.name ||
    invoice?.purchase_orders_client?.clients?.name ||
    "—";

  const DetailRow = ({
    icon: Icon,
    label,
    value,
    mono = false,
  }: {
    icon: any;
    label: string;
    value?: string | null;
    mono?: boolean;
  }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-2.5 py-2 border-b border-border/40 last:border-0">
        <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="w-3 h-3 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground shrink-0">{label}</p>
          <p className={`text-xs font-medium truncate text-right ${mono ? "font-mono" : ""}`}>{value}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        {/* ✅ Reduced max-w and removed overflow so content stays compact */}
        <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">

          {/* Header — compact */}
          <div className={`px-5 py-4 ${statusCfg.bg} ${statusCfg.border} border-b`}>
            <DialogHeader>
              <DialogTitle className={`text-sm font-bold ${statusCfg.color} flex items-center gap-2`}>
                <CheckCircle2 className="w-4 h-4" />
                Détails du paiement
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className={`text-xl font-bold tabular-nums ${statusCfg.color}`}>
                  {Number(invoice?.total_amount || 0).toLocaleString("fr-TN")} DT
                </p>
                <p className="text-xs text-muted-foreground">{clientName}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* ✅ Scrollable body with max-height */}
          <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto">

            {/* Invoice Info — compact */}
            <div className="bg-muted/30 rounded-xl px-3 py-1 divide-y divide-border/30">
              <DetailRow icon={FileText} label="Facture" value={invoice?.invoice_number} mono />
              <DetailRow
                icon={Calendar}
                label="Émission"
                value={invoice?.issue_date ? new Date(invoice.issue_date).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" }) : undefined}
              />
              <DetailRow
                icon={Clock}
                label="Échéance"
                value={invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" }) : undefined}
              />
            </div>

            {/* Payment Trace */}
            {trace ? (
              <>
                {/* Method badge — compact */}
                <div className={`flex items-center gap-2.5 p-2.5 rounded-xl ${methodCfg.bg}`}>
                  <div className={`w-8 h-8 rounded-lg ${methodCfg.bg} border border-white/60 flex items-center justify-center`}>
                    <MethodIcon className={`w-4 h-4 ${methodCfg.color}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${methodCfg.color}`}>{methodCfg.label}</p>
                    {trace.payment_date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(trace.payment_date).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Trace details */}
                <div className="bg-muted/30 rounded-xl px-3 py-1 divide-y divide-border/30">
                  <DetailRow
                    icon={CreditCard}
                    label="Montant payé"
                    value={trace.amount ? `${Number(trace.amount).toLocaleString("fr-TN")} DT` : undefined}
                  />
                  <DetailRow icon={Hash}      label="Référence"    value={trace.reference}    mono />
                  <DetailRow icon={Receipt}   label="N° chèque"    value={trace.cheque_number} mono />
                  <DetailRow icon={Building2} label="Banque"       value={trace.bank_name} />
                  <DetailRow icon={FileText}  label="Notes"        value={trace.notes} />
                </div>

              
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-5 text-center text-muted-foreground">
                <ImageIcon className="w-7 h-7 opacity-30" />
                <p className="text-xs">Aucune trace de paiement enregistrée</p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full h-9 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Fermer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen overlay — uses resolved URL */}
      {imageFullscreen && proofUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImageFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            onClick={() => setImageFullscreen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          
        </div>
      )}
    </>
  );
}