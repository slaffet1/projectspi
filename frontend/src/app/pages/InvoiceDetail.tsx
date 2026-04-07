import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ArrowLeft, Download, Send, Trash, Check, X, CalendarClock, Languages } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Link, useParams } from "react-router";
import { invoiceService } from "@/app/services/invoiceService";
import { useBusiness } from "@/app/context/BusinessContext";
import { Separator } from "@/app/components/ui/separator";
import toast, { Toaster } from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TranslatedLabels {
  invoice_title: string;
  billed_to: string;
  due_date: string;
  product: string;
  qty: string;
  price: string;
  tax: string;
  total: string;
  subtotal: string;
  discount: string;
  adjustment: string;
  thank_you: string;
  professional_billing: string;
}

const DEFAULT_LABELS: TranslatedLabels = {
  invoice_title: "FACTURE",
  billed_to: "Facturé à",
  due_date: "Échéance",
  product: "Produit",
  qty: "Qté",
  price: "Prix",
  tax: "TVA",
  total: "Total",
  subtotal: "Sous-total",
  discount: "Remise",
  adjustment: "Ajustement",
  thank_you: "Merci pour votre confiance",
  professional_billing: "Facturation professionnelle",
};

const LANGUAGES = [
  { value: "fr", label: "🇫🇷 Français" },
  { value: "en", label: "🇬🇧 English" },
  { value: "ar", label: "🇸🇦 العربية" },
  { value: "it", label: "🇮🇹 Italiano" },
  { value: "de", label: "🇩🇪 Deutsch" },
  { value: "es", label: "🇪🇸 Español" },
];

// ─── Language Modal ───────────────────────────────────────────────────────────

function LanguageModal({
  open,
  onClose,
  onConfirm,
  title,
  confirmLabel,
  showToggle = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (lang: string) => void;
  title: string;
  confirmLabel: string;
  showToggle?: boolean;
}) {
  const [selectedLang, setSelectedLang] = useState("fr");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100">
              <Languages className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="font-semibold text-base text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Language selector — always visible */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Choisir la langue
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => setSelectedLang(lang.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium text-left transition-all border ${
                  selectedLang === lang.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="ghost"
            className="flex-1 rounded-xl"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => onConfirm(selectedLang)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InvoiceDetail() {
  const { id } = useParams();
  const { activeBusiness } = useBusiness();
  const [invoice, setInvoice] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [updatingDue, setUpdatingDue] = useState(false);
  const [showDueInput, setShowDueInput] = useState(false);
  const [dueDateInput, setDueDateInput] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");

  // Translation state
  const [labels, setLabels] = useState<TranslatedLabels>(DEFAULT_LABELS);
  const [translating, setTranslating] = useState(false);

  // Modals
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTranslateModal, setShowTranslateModal] = useState(false);

  useEffect(() => {
    if (id && activeBusiness?.id) fetchInvoice();
  }, [id, activeBusiness]);

  const fetchInvoice = async () => {
    try {
      const res = await invoiceService.getOne(activeBusiness.id, +id!);
      setInvoice(res.data);
      setDueDateInput(res.data?.due_date?.split("T")[0] || "");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger la facture.");
    }
  };

  // ── Translate labels via backend (NestJS → Gemini) ────────────────────────
  const fetchTranslatedLabels = async (language: string): Promise<TranslatedLabels> => {
    if (language === "fr") return DEFAULT_LABELS;
    const res = await invoiceService.translateLabels(activeBusiness.id, language);
    return res.data as TranslatedLabels;
  };

  const handleLiveTranslate = async (lang: string) => {
    setShowTranslateModal(false);
    if (lang === "fr") {
      setLabels(DEFAULT_LABELS);
      toast.success("Facture réinitialisée en français.");
      return;
    }
    setTranslating(true);
    try {
      const translated = await fetchTranslatedLabels(lang);
      setLabels(translated);
      toast.success("Traduction appliquée !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur de traduction");
    } finally {
      setTranslating(false);
    }
  };

  // ── Helper: extraire source (quote ou bon de commande) ────────────────────
  const resolveSource = (inv: any) => {
    const quote = Array.isArray(inv.quotes) ? inv.quotes[0] : inv.quotes;
    const purchaseOrder = Array.isArray(inv.purchase_orders_client)
      ? inv.purchase_orders_client[0]
      : inv.purchase_orders_client;
    const source = quote ?? purchaseOrder;
    const client = source?.clients || {};
    const items: any[] = quote?.quote_details || purchaseOrder?.order_details || [];
    return { quote, purchaseOrder, source, client, items };
  };

  // ── PDF 100% frontend : html2canvas → jsPDF ───────────────────────────────
  const downloadPDF = async (lang: string) => {
    if (!invoice) return toast.error("Facture non chargée");

    setShowPdfModal(false);
    setTranslating(true);

    try {
      // 1. Get translated labels if needed
      let pdfLabels: TranslatedLabels = DEFAULT_LABELS;
      if (lang !== "fr") {
        pdfLabels = await fetchTranslatedLabels(lang);
      }

      // 2. Build a standalone off-screen div with the invoice HTML
      const container = document.createElement("div");
      container.style.cssText = [
        "position:fixed",
        "left:-9999px",
        "top:0",
        "width:794px",
        "background:#ffffff",
        "padding:32px",
        "font-family:Arial,sans-serif",
        "color:#000000",
        "z-index:-1",
      ].join(";");

      // ✅ FIX : résolution de la source (quote ou bon de commande)
      const { client, items } = resolveSource(invoice);
      const bank = invoice.bank;

      const subtotal = items.reduce((s: number, i: any) => s + i.quantity * Number(i.products.unit_price), 0);
      const taxAmt = items.reduce(
        (s: number, i: any) => s + i.quantity * Number(i.products.unit_price) * (Number(i.products.tax_rate) / 100),
        0
      );
      const totaltax = subtotal + taxAmt;
      const total = Number(invoice.total_amount);
      const remise = totaltax - total;
      const businessName = JSON.parse(localStorage.getItem("activeBusiness") || "{}").name || "Mon entreprise";

      const fmt = (v: number) =>
        new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND", minimumFractionDigits: 2 }).format(v);

      const rows = items.map((i: any) => {
        const line = i.quantity * Number(i.products.unit_price) * (1 + Number(i.products.tax_rate) / 100);
        return `<tr>
          <td style="padding:8px;border:1px solid #ddd;">${i.products.name}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;">${i.quantity}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;">${Number(i.products.unit_price).toFixed(2)} DT</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;">${Number(i.products.tax_rate)}%</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">${line.toFixed(2)} DT</td>
        </tr>`;
      }).join("");

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
          <div>
            <div style="font-size:22px;font-weight:bold;">${businessName}</div>
            <div style="font-size:13px;color:#888;">${pdfLabels.professional_billing}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:bold;">${pdfLabels.invoice_title}</div>
            <div style="color:#888;">#${invoice.invoice_number}</div>
            <div style="color:#888;">${new Date(invoice.issue_date).toLocaleDateString("fr-FR")}</div>
            ${bank ? `<div style="margin-top:8px;"><b>${bank.bank_name}</b><br/>${bank.account_number}</div>` : ""}
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:24px;">
          <div>
            <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${pdfLabels.billed_to}</div>
            <div style="font-weight:600;">${client.name || ""}</div>
            <div style="color:#555;font-size:13px;">${client.email || ""}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">${pdfLabels.due_date}</div>
            <div style="font-weight:600;">${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("fr-FR") : "-"}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:10px;border:1px solid #ddd;text-align:left;">${pdfLabels.product}</th>
              <th style="padding:10px;border:1px solid #ddd;text-align:right;">${pdfLabels.qty}</th>
              <th style="padding:10px;border:1px solid #ddd;text-align:right;">${pdfLabels.price}</th>
              <th style="padding:10px;border:1px solid #ddd;text-align:right;">${pdfLabels.tax}</th>
              <th style="padding:10px;border:1px solid #ddd;text-align:right;">${pdfLabels.total}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="display:flex;justify-content:flex-end;">
          <div style="width:280px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px;">
              <span style="color:#888;">${pdfLabels.subtotal}</span><span>${fmt(subtotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px;">
              <span style="color:#888;">${pdfLabels.tax}</span><span>${fmt(taxAmt)}</span>
            </div>
            ${remise > 0 ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px;">
              <span style="color:#888;">${pdfLabels.discount}</span><span>-${fmt(remise)}</span>
            </div>` : ""}
            <hr style="margin:10px 0;border:none;border-top:1px solid #ddd;"/>
            <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:bold;">
              <span>${pdfLabels.total}</span><span>${fmt(total)}</span>
            </div>
          </div>
        </div>
        <div style="text-align:center;margin-top:48px;font-size:12px;color:#888;">
          ${pdfLabels.thank_you} — ${businessName}
        </div>
      `;

      document.body.appendChild(container);

      // 3. Capture
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      document.body.removeChild(container);

      // 4. Build A4 PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const finalHeight = imgHeight > pageHeight ? pageHeight : imgHeight;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, finalHeight);
      pdf.save(`facture-${invoice.invoice_number}.pdf`);

      toast.success("PDF téléchargé !");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erreur lors du téléchargement PDF");
    } finally {
      setTranslating(false);
    }
  };

  // ── Send email via backend ────────────────────────────────────────────────
  const sendEmail = async (lang: string) => {
    setShowEmailModal(false);
    if (!activeBusiness?.id || !invoice) return;
    setSending(true);
    try {
      await invoiceService.sendInvoice(activeBusiness.id, invoice.id, lang);
      toast.success("Facture envoyée avec succès !");
      fetchInvoice();
    } catch (err: any) {
      console.error(err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Impossible d'envoyer la facture.";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const validateDueDate = (value: string): string => {
    if (!value) return "Veuillez saisir une date.";
    const selected = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const issueDate = invoice?.issue_date ? new Date(invoice.issue_date) : null;
    if (issueDate) issueDate.setHours(0, 0, 0, 0);
    if (selected < today) return "La date d'échéance ne peut pas être antérieure à aujourd'hui.";
    if (issueDate && selected < issueDate) return "La date d'échéance ne peut pas être antérieure à la date de la facture.";
    return "";
  };

  const handleDueDateChange = (value: string) => {
    setDueDateInput(value);
    setDateError(validateDueDate(value));
  };

  const updateDueDate = async () => {
    const error = validateDueDate(dueDateInput);
    if (error) { setDateError(error); return; }
    if (!activeBusiness?.id || !invoice) return;
    setUpdatingDue(true);
    try {
      await invoiceService.updateDueDate(activeBusiness.id, invoice.id, dueDateInput);
      toast.success("Date d'échéance mise à jour !");
      setShowDueInput(false);
      setDateError("");
      fetchInvoice();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de mettre à jour la date.");
    } finally {
      setUpdatingDue(false);
    }
  };

  const deleteInvoice = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <span>Voulez-vous vraiment supprimer cette facture ?</span>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                try {
                  await invoiceService.deleteInvoice(activeBusiness.id, invoice.id);
                  toast.success("Facture supprimée !");
                  toast.dismiss(t.id);
                  window.location.href = "/app/invoices";
                } catch (err) {
                  console.error(err);
                  toast.error("Impossible de supprimer la facture.");
                }
              }}
            >
              Supprimer
            </Button>
            <Button size="sm" variant="secondary" onClick={() => toast.dismiss(t.id)}>
              Annuler
            </Button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  if (!invoice) return null;

  // ✅ FIX : résolution de la source (quote ou bon de commande client)
  const { client, items } = resolveSource(invoice);

  const subtotal = items.reduce((s: number, i: any) => s + i.quantity * Number(i.products.unit_price), 0);
  const tax = items.reduce(
    (s: number, i: any) => s + i.quantity * Number(i.products.unit_price) * (Number(i.products.tax_rate) / 100),
    0
  );
  const totaltax = subtotal + tax;
  const total = invoice.total_amount;
  const remise = totaltax - total;

  const business = JSON.parse(localStorage.getItem("activeBusiness") || "{}");
  const businessName = business?.name || "Mon entreprise";

  const statusStyles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    draft: "bg-slate-50 text-slate-600 border border-slate-200",
    sent: "bg-sky-50 text-sky-700 border border-sky-200",
    unpaid: "bg-rose-50 text-rose-700 border border-rose-200",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8">
      <Toaster position="top-right" />

      {/* Language Modals */}
      <LanguageModal
        open={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        onConfirm={downloadPDF}
        title="Télécharger en PDF"
        confirmLabel="Télécharger"
        showToggle={true}
      />
      <LanguageModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onConfirm={sendEmail}
        title="Envoyer par email"
        confirmLabel="Envoyer"
        showToggle={true}
      />
      <LanguageModal
        open={showTranslateModal}
        onClose={() => setShowTranslateModal(false)}
        onConfirm={handleLiveTranslate}
        title="Traduction en temps réel"
        confirmLabel="Appliquer"
        showToggle={false}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/app/invoices">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Facture <span className="text-primary">{invoice.invoice_number}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Détails et gestion de la facture</p>
          </div>
        </div>
      </div>

      {/* Bouton traduction en temps réel */}
      <Button
        variant="outline"
        className="flex items-center gap-2"
        disabled={translating}
        onClick={() => setShowTranslateModal(true)}
      >
        {translating ? (
          <div className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Languages className="h-4 w-4" />
        )}
        {translating ? "Traduction en cours..." : "🌍 Traduction en temps réel"}
      </Button>

      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-stretch divide-x divide-border/60">

            {/* Download PDF */}
            <button
              onClick={() => setShowPdfModal(true)}
              disabled={!invoice || translating}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4
                hover:bg-slate-50 transition-colors group disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors">
                {translating ? (
                  <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="h-4 w-4 text-slate-600" />
                )}
              </div>
              <span className="text-xs font-medium text-slate-600">
                {translating ? "Traduction..." : "Télécharger PDF"}
              </span>
            </button>

            {/* Send email */}
            <button
              onClick={() => !sending && invoice.status !== "sent" && setShowEmailModal(true)}
              disabled={sending || invoice.status === "sent"}
              className={`flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4
                transition-colors group
                ${invoice.status === "sent"
                  ? "opacity-50 cursor-not-allowed bg-transparent"
                  : "hover:bg-sky-50"
                }`}
            >
              <div className={`p-2.5 rounded-xl transition-colors
                ${invoice.status === "sent"
                  ? "bg-sky-100"
                  : "bg-sky-100 group-hover:bg-sky-200"
                }`}>
                {sending ? (
                  <div className="h-4 w-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4 text-sky-600" />
                )}
              </div>
              <span className="text-xs font-medium text-sky-600">
                {sending ? "Envoi..." : invoice.status === "sent" ? "Déjà envoyée" : "Envoyer par email"}
              </span>
            </button>

            <button
              onClick={() => { setShowDueInput(!showDueInput); setDateError(""); }}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4
                hover:bg-amber-50 transition-colors group"
            >
              <div className="p-2.5 rounded-xl bg-amber-100 group-hover:bg-amber-200 transition-colors">
                <CalendarClock className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-amber-600">Modifier échéance</span>
            </button>

            <button
              onClick={deleteInvoice}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4
                hover:bg-rose-50 transition-colors group"
            >
              <div className="p-2.5 rounded-xl bg-rose-100 group-hover:bg-rose-200 transition-colors">
                <Trash className="h-4 w-4 text-rose-600" />
              </div>
              <span className="text-xs font-medium text-rose-600">Supprimer</span>
            </button>

          </div>
        </CardContent>
      </Card>

      {/* ── Invoice Render ── */}
      <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
        <CardContent
          id="invoice"
          ref={invoiceRef}
          className="p-8"
          style={{ fontFamily: "Arial, sans-serif", color: "#000000", backgroundColor: "#ffffff" }}
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 style={{ color: "#000000" }} className="text-2xl font-bold">{businessName}</h2>
              <p style={{ color: "#888888" }} className="text-sm mt-1">{labels.professional_billing}</p>
            </div>
            <div className="text-right">
              <h3 style={{ color: "#000000" }} className="text-2xl font-bold">{labels.invoice_title}</h3>
              <p style={{ color: "#888888" }} className="text-sm">#{invoice.invoice_number}</p>
              <p style={{ color: "#888888" }} className="text-sm">
                {new Date(invoice.issue_date).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p style={{ color: "#888888" }} className="text-xs mb-1 uppercase tracking-widest">
                {labels.billed_to}
              </p>
              <p style={{ color: "#000000" }} className="font-semibold text-base">{client.name}</p>
              <p style={{ color: "#4b5563" }} className="text-sm mt-0.5">{client.email}</p>
            </div>

            <div className="text-right">
              <p style={{ color: "#888888" }} className="text-xs uppercase tracking-widest mb-1">
                {labels.due_date}
              </p>
              <p style={{ color: "#000000" }} className="font-semibold">
                {showDueInput ? (
                  <span className="flex flex-col items-end gap-1.5">
                    <input
                      type="date"
                      value={dueDateInput}
                      onChange={(e) => handleDueDateChange(e.target.value)}
                      className={`rounded-lg border px-2 py-1 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 transition-all
                        ${dateError
                          ? "border-rose-300 focus:ring-rose-200"
                          : "border-border focus:ring-amber-200 focus:border-amber-400"
                        }`}
                    />
                    {dateError && (
                      <span className="text-xs text-rose-600 flex items-center gap-1">
                        <X className="w-3 h-3" /> {dateError}
                      </span>
                    )}
                    <span className="flex gap-1.5 mt-1">
                      <Button
                        size="sm"
                        onClick={updateDueDate}
                        disabled={updatingDue || !!dateError}
                        className="rounded-lg h-7 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                      >
                        {updatingDue ? "..." : <><Check className="w-3 h-3 mr-1" />Enregistrer</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setShowDueInput(false); setDateError(""); }}
                        className="rounded-lg h-7 px-2 text-xs text-muted-foreground"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </span>
                  </span>
                ) : (
                  invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("fr-FR") : "-"
                )}
              </p>

              {invoice.bank && (
                <div className="mt-2 text-sm" style={{ color: "#000000" }}>
                  <p>{invoice.bank.bank_name}</p>
                  <p>{invoice.bank.account_number}</p>
                </div>
              )}
            </div>
          </div>

          <table className="w-full border-collapse mb-8">
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5", color: "#000000" }}>
                <th className="p-3 border text-left text-sm">{labels.product}</th>
                <th className="p-3 border text-right text-sm">{labels.qty}</th>
                <th className="p-3 border text-right text-sm">{labels.price}</th>
                <th className="p-3 border text-right text-sm">{labels.tax}</th>
                <th className="p-3 border text-right text-sm">{labels.total}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i: any) => {
                const totalLine =
                  i.quantity * Number(i.products.unit_price) * (1 + Number(i.products.tax_rate) / 100);
                return (
                  <tr key={i.id}>
                    <td className="p-3 border font-medium text-sm" style={{ color: "#000000" }}>{i.products.name}</td>
                    <td className="p-3 border text-right text-sm" style={{ color: "#000000" }}>{i.quantity}</td>
                    <td className="p-3 border text-right text-sm" style={{ color: "#000000" }}>{Number(i.products.unit_price).toFixed(2)} DT</td>
                    <td className="p-3 border text-right text-sm" style={{ color: "#000000" }}>{Number(i.products.tax_rate)}%</td>
                    <td className="p-3 border text-right font-semibold text-sm" style={{ color: "#000000" }}>{totalLine.toFixed(2)} DT</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm" style={{ color: "#000000" }}>
                <span style={{ color: "#888888" }}>{labels.subtotal}</span>
                <span>{subtotal.toLocaleString("fr-TN")} DT</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "#000000" }}>
                <span style={{ color: "#888888" }}>{labels.tax}</span>
                <span>{tax.toLocaleString("fr-TN")} DT</span>
              </div>

              {remise > 0 && (
                <div className="flex justify-between text-sm" style={{ color: "#000000" }}>
                  <span style={{ color: "#888888" }}>{remise > 0 ? labels.discount : labels.adjustment}</span>
                  <span>-{remise.toLocaleString("fr-TN")} DT</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold" style={{ color: "#000000" }}>
                <span>{labels.total}</span>
                <span>{total.toLocaleString("fr-TN")} DT</span>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-xs" style={{ color: "#888888" }}>
            {labels.thank_you} — {businessName}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}