import { JSX, useEffect, useState } from "react";
import {
    Package, FileText, FilePlus, Plus, Receipt,
    ChevronLeft, ChevronRight, X, MapPin, Phone, Mail, User, Calendar, Download,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { SearchInput } from "@/app/components/SearchInput";
import { Link } from "react-router";
import { deliveryNoteService } from "@/app/services/deliveryNoteService";
import { useBusiness } from "@/app/context/BusinessContext";
import { toast } from "sonner";

const PAGE_SIZE = 8;

// ── Types ──────────────────────────────────────────────────────────────────────

interface Client {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    tax_number?: string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    status: string;
    total_amount: number;
    issue_date: string;
    due_date: string;
}

interface DeliveryNoteRef {
    id: number;
    delivery_number: string;
    delivery_date: string;
}

interface QuoteDetail {
    id: number;
    quantity: number;
    products: { id: number; name: string; unit_price: number };
}

interface Quote {
    id: number;
    quote_id: string;
    issue_date: string;
    expiration_date: string;
    total_amount: number;
    status: string;
    clients?: Client;
    invoices?: Invoice[];
    delivery_notes?: DeliveryNoteRef[];
    quote_details?: QuoteDetail[];
}

interface DeliveryNote {
    id: number;
    delivery_number: string;
    delivery_date: string;
    quote_id?: number;
    quotes?: Quote & { invoices?: Invoice[] };
}

interface InvoiceWithQuote extends Invoice {
    quote_id?: number;
    quotes?: Quote & { delivery_notes?: DeliveryNoteRef[] };
}

type Tab = "notes" | "quotes" | "invoices";

// ── Helpers ────────────────────────────────────────────────────────────────────

function safeArray(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
}

// ── Standalone print function ──────────────────────────────────────────────────

function printDeliveryNote(note: DeliveryNote) {
    const client = note.quotes?.clients;
    const invoice = note.quotes?.invoices?.[0];
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>Delivery Note - ${note.delivery_number}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#111;background:#fff;padding:40px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:20px;border-bottom:2px solid #e5e7eb}
      .header h1{font-size:22px;font-weight:700}
      .header p{font-size:13px;color:#6b7280;margin-top:4px}
      .badge{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;padding:4px 14px;border-radius:999px;font-size:13px;font-weight:600}
      .section-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin:24px 0 8px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .info-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px}
      .info-box .label{font-size:11px;color:#9ca3af;margin-bottom:3px}
      .info-box .value{font-size:14px;font-weight:600}
      .total-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-top:20px}
      .total-box .label{font-size:13px;color:#15803d;font-weight:500}
      .total-box .amount{font-size:26px;font-weight:700;color:#15803d}
      .client-block{border:1px solid #e5e7eb;border-radius:10px;overflow:hidden}
      .client-row{padding:10px 14px;font-size:13px;border-bottom:1px solid #f3f4f6;display:flex;gap:12px}
      .client-row:last-child{border-bottom:none}
      .row-label{color:#9ca3af;min-width:120px;font-size:12px}
      .row-value{font-weight:500}
      .invoice-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}
      .footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
    </style>
  </head><body>
    <div class="header">
      <div><h1>Delivery Note</h1><p>Generated on ${new Date().toLocaleDateString("en-GB")}</p></div>
      <div><span class="badge">${note.delivery_number}</span></div>
    </div>
    <div class="section-title">Delivery Information</div>
    <div class="info-grid">
      <div class="info-box"><div class="label">Delivery Date</div><div class="value">${new Date(note.delivery_date).toLocaleDateString("en-GB")}</div></div>
      <div class="info-box"><div class="label">Linked Quote</div><div class="value">${note.quotes?.quote_id ?? "—"}</div></div>
    </div>
    ${note.quotes?.total_amount !== undefined ? `<div class="total-box"><span class="label">Total Amount (quote)</span><span class="amount">${Number(note.quotes.total_amount).toLocaleString("en")} DT</span></div>` : ""}
    ${client ? `
    <div class="section-title">Client Information</div>
    <div class="client-block">
      <div class="client-row"><span class="row-label">Name</span><span class="row-value">${client.name}</span></div>
      ${client.email ? `<div class="client-row"><span class="row-label">Email</span><span class="row-value">${client.email}</span></div>` : ""}
      ${client.phone ? `<div class="client-row"><span class="row-label">Phone</span><span class="row-value">${client.phone}</span></div>` : ""}
      ${(client.address || client.city || client.country) ? `<div class="client-row"><span class="row-label">Address</span><span class="row-value">${[client.address, client.city, client.country].filter(Boolean).join(", ")}</span></div>` : ""}
      ${client.tax_number ? `<div class="client-row"><span class="row-label">Tax Number</span><span class="row-value">${client.tax_number}</span></div>` : ""}
    </div>` : ""}
    ${invoice ? `
    <div class="section-title">Linked Invoice</div>
    <div class="invoice-box">
      <div><div style="font-size:12px;color:#3b82f6">Invoice Number</div><div style="font-size:14px;font-weight:700;color:#1d4ed8">${invoice.invoice_number}</div></div>
      <span style="font-size:12px;background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:999px;font-weight:600">${invoice.status === "paid" ? "Paid" : invoice.status === "sent" ? "Sent" : invoice.status}</span>
    </div>` : ""}
    <div class="footer">Auto-generated document — ${note.delivery_number}</div>
  </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
}

// ── Spinner row ────────────────────────────────────────────────────────────────

function SpinnerRow({ cols }: { cols: number }) {
    return (
        <tr>
            <td colSpan={cols} className="p-12 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Loading...
                </div>
            </td>
        </tr>
    );
}

// ── Empty row ──────────────────────────────────────────────────────────────────

function EmptyRow({ cols, message }: { cols: number; message: string }) {
    return (
        <tr>
            <td colSpan={cols} className="p-12 text-center text-muted-foreground text-sm">
                {message}
            </td>
        </tr>
    );
}

// ── THead ──────────────────────────────────────────────────────────────────────

function THead({ cols }: { cols: string[] }) {
    return (
        <thead>
            <tr className="border-b bg-muted/40">
                {cols.map((h) => (
                    <th key={h} className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {h}
                    </th>
                ))}
            </tr>
        </thead>
    );
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({
    current, total, onChange,
}: { current: number; total: number; onChange: (p: number) => void }) {
    if (total <= 1) return null;
    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">Page {current} of {total}</p>
            <div className="flex gap-1">
                <Button size="sm" variant="ghost" disabled={current === 1}
                    onClick={() => onChange(current - 1)} className="w-8 h-8 p-0 rounded-lg">
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
                    <Button key={p} size="sm" variant={p === current ? "default" : "ghost"}
                        onClick={() => onChange(p)}
                        className={`w-8 h-8 p-0 rounded-lg text-xs ${p === current ? "shadow-sm" : "text-muted-foreground"}`}>
                        {p}
                    </Button>
                ))}
                <Button size="sm" variant="ghost" disabled={current === total}
                    onClick={() => onChange(current + 1)} className="w-8 h-8 p-0 rounded-lg">
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

// ── Details Modal ──────────────────────────────────────────────────────────────

function DetailsModal({ note, onClose }: { note: DeliveryNote; onClose: () => void }) {
    const client = note.quotes?.clients;
    const invoice = note.quotes?.invoices?.[0];
    const totalAmount = note.quotes?.total_amount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold">{note.delivery_number}</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Delivery Note — {new Date(note.delivery_date).toLocaleDateString("en-GB")}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">

                    {/* BL Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/40 rounded-xl p-3">
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Calendar className="w-3 h-3" />Delivery Date
                            </p>
                            <p className="text-sm font-semibold">
                                {new Date(note.delivery_date).toLocaleDateString("en-GB")}
                            </p>
                        </div>
                        <div className="bg-muted/40 rounded-xl p-3">
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                                <FileText className="w-3 h-3" />Linked Quote
                            </p>
                            <p className="text-sm font-semibold font-mono">
                                {note.quotes?.quote_id ?? "—"}
                            </p>
                        </div>
                    </div>

                    {/* Total */}
                    {totalAmount !== undefined && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                            <p className="text-sm text-emerald-700 font-medium">Total Amount (quote)</p>
                            <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                                {Number(totalAmount).toLocaleString("en")} <span className="text-base font-normal">DT</span>
                            </p>
                        </div>
                    )}

                    {/* Client */}
                    {client && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Client Information
                            </p>
                            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="p-1.5 rounded-lg bg-muted">
                                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Name</p>
                                        <p className="text-sm font-medium">{client.name}</p>
                                    </div>
                                </div>
                                {client.email && (
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="p-1.5 rounded-lg bg-muted">
                                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Email</p>
                                            <p className="text-sm font-medium">{client.email}</p>
                                        </div>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="p-1.5 rounded-lg bg-muted">
                                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Phone</p>
                                            <p className="text-sm font-medium">{client.phone}</p>
                                        </div>
                                    </div>
                                )}
                                {(client.address || client.city || client.country) && (
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="p-1.5 rounded-lg bg-muted">
                                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Address</p>
                                            <p className="text-sm font-medium">
                                                {[client.address, client.city, client.country].filter(Boolean).join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {client.tax_number && (
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="p-1.5 rounded-lg bg-muted">
                                            <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tax Number</p>
                                            <p className="text-sm font-medium font-mono">{client.tax_number}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Linked invoice */}
                    {invoice && (
                        <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-sky-600" />
                                <div>
                                    <p className="text-xs text-sky-600">Linked Invoice</p>
                                    <p className="text-sm font-semibold text-sky-700">{invoice.invoice_number}</p>
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                invoice.status === "paid"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : invoice.status === "sent"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-600"
                            }`}>
                                {invoice.status === "paid" ? "Paid" : invoice.status === "sent" ? "Sent" : invoice.status}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printDeliveryNote(note)}
                        className="rounded-xl gap-2 border-border/70 text-muted-foreground hover:text-foreground"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Create BL Modal ────────────────────────────────────────────────────────────

function CreateBLModal({
    quoteId,
    quoteRef,
    clientName,
    totalAmount,
    businessId,
    onClose,
    onSuccess,
}: {
    quoteId: number;
    quoteRef: string;
    clientName: string;
    totalAmount: number;
    businessId: number;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [deliveryNumber, setDeliveryNumber] = useState(
        `BL-${quoteRef}-${Date.now().toString().slice(-4)}`
    );
    const [deliveryDate, setDeliveryDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!deliveryNumber.trim()) { toast.error("Delivery number is required"); return; }
        try {
            setLoading(true);
            await deliveryNoteService.create(businessId, {
                delivery_number: deliveryNumber,
                delivery_date: deliveryDate,
                quote_id: quoteId,
            });
            toast.success("Delivery note created successfully!");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error creating delivery note");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                        <h2 className="text-base font-semibold">New Delivery Note</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Quote {quoteRef} — {clientName}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Summary */}
                <div className="px-6 py-4 bg-muted/30 border-b border-border grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-xs text-muted-foreground">Client</p>
                        <p className="font-medium">{clientName}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Quote Amount</p>
                        <p className="font-semibold text-emerald-600">
                            {Number(totalAmount).toLocaleString("en")} DT
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Delivery Note Number *
                        </label>
                        <input
                            value={deliveryNumber}
                            onChange={(e) => setDeliveryNumber(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Delivery Date *
                        </label>
                        <input
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                        Cancel
                    </Button>
                    <Button size="sm" disabled={loading} onClick={handleSubmit} className="rounded-xl gap-2 min-w-[130px]">
                        {loading ? (
                            <>
                                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Creating...
                            </>
                        ) : (
                            <><Package className="w-3.5 h-3.5" />Create Note</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Modal state type ───────────────────────────────────────────────────────────

interface ModalState {
    quoteId: number;
    quoteRef: string;
    clientName: string;
    totalAmount: number;
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function DeliveryNotes() {
    const { activeBusiness } = useBusiness();
    const businessId = activeBusiness?.id;

    const [tab, setTab] = useState<Tab>("notes");

    const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
    const [quotesNotInvoiced, setQuotesNotInvoiced] = useState<Quote[]>([]);
    const [invoicesWithoutBL, setInvoicesWithoutBL] = useState<InvoiceWithQuote[]>([]);

    const [loadingNotes, setLoadingNotes] = useState(true);
    const [loadingQuotes, setLoadingQuotes] = useState(true);
    const [loadingInvoices, setLoadingInvoices] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [modal, setModal] = useState<ModalState | null>(null);
    const [detailNote, setDetailNote] = useState<DeliveryNote | null>(null);

    useEffect(() => {
        if (businessId) {
            fetchDeliveryNotes();
            fetchQuotesNotInvoiced();
            fetchInvoicesWithoutBL();
        }
    }, [businessId]);

    const fetchDeliveryNotes = async () => {
        try {
            setLoadingNotes(true);
            const res = await deliveryNoteService.getAll(businessId!);
            setDeliveryNotes(safeArray(res));
        } catch (err) {
            console.error(err);
            toast.error("Failed to load delivery notes");
        } finally {
            setLoadingNotes(false);
        }
    };

    const fetchQuotesNotInvoiced = async () => {
        try {
            setLoadingQuotes(true);
            const res = await deliveryNoteService.getQuotesNotInvoiced(businessId!);
            setQuotesNotInvoiced(safeArray(res));
        } catch (err) {
            console.error(err);
            toast.error("Failed to load quotes");
        } finally {
            setLoadingQuotes(false);
        }
    };

    const fetchInvoicesWithoutBL = async () => {
        try {
            setLoadingInvoices(true);
            const res = await deliveryNoteService.getInvoicesWithoutBL(businessId!);
            setInvoicesWithoutBL(safeArray(res));
        } catch (err) {
            console.error(err);
            toast.error("Failed to load invoices");
        } finally {
            setLoadingInvoices(false);
        }
    };

    const refetchAll = () => {
        fetchDeliveryNotes();
        fetchQuotesNotInvoiced();
        fetchInvoicesWithoutBL();
    };

    const switchTab = (t: Tab) => {
        setTab(t);
        setCurrentPage(1);
        setSearchQuery("");
    };

    const openModal = (state: ModalState) => setModal(state);

    const q = searchQuery.toLowerCase();

    const filteredNotes = deliveryNotes.filter((dn) =>
        dn.delivery_number?.toLowerCase().includes(q) ||
        dn.quotes?.clients?.name?.toLowerCase().includes(q) ||
        dn.quotes?.quote_id?.toLowerCase().includes(q)
    );

    const filteredQuotes = quotesNotInvoiced.filter((qt) =>
        qt.quote_id?.toLowerCase().includes(q) ||
        qt.clients?.name?.toLowerCase().includes(q)
    );

    const filteredInvoices = invoicesWithoutBL.filter((inv) =>
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.quotes?.clients?.name?.toLowerCase().includes(q) ||
        inv.quotes?.quote_id?.toLowerCase().includes(q)
    );

    const activeList =
        tab === "notes" ? filteredNotes :
            tab === "quotes" ? filteredQuotes :
                filteredInvoices;

    const totalPages = Math.ceil(activeList.length / PAGE_SIZE);
    const paginated = activeList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className="space-y-8">

            {detailNote && (
                <DetailsModal
                    note={detailNote}
                    onClose={() => setDetailNote(null)}
                />
            )}

            {modal && (
                <CreateBLModal
                    {...modal}
                    businessId={businessId!}
                    onClose={() => setModal(null)}
                    onSuccess={refetchAll}
                />
            )}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Delivery Notes</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Manage your delivery notes and track the progress of your quotes and invoices
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card
                    onClick={() => switchTab("notes")}
                    className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative cursor-pointer hover:scale-[1.01] transition-transform"
                >
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Delivery Notes</p>
                                <h2 className="text-4xl font-bold mt-2 tabular-nums">{deliveryNotes.length}</h2>
                                <p className="text-xs text-slate-400 mt-2">Total created</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/10">
                                <FileText className="h-5 w-5 text-slate-200" />
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5" />
                    </CardContent>
                </Card>

                <Card
                    onClick={() => switchTab("quotes")}
                    className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-sky-500 to-blue-700 text-white overflow-hidden relative cursor-pointer hover:scale-[1.01] transition-transform"
                >
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-sky-100 uppercase tracking-widest">Quotes Without Invoice</p>
                                <h2 className="text-4xl font-bold mt-2 tabular-nums">{quotesNotInvoiced.length}</h2>
                                <p className="text-xs text-sky-200 mt-2">Pending delivery note</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/20">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                    </CardContent>
                </Card>

                <Card
                    onClick={() => switchTab("invoices")}
                    className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-amber-400 to-amber-600 text-white overflow-hidden relative cursor-pointer hover:scale-[1.01] transition-transform"
                >
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-amber-100 uppercase tracking-widest">Invoices Without Note</p>
                                <h2 className="text-4xl font-bold mt-2 tabular-nums">{invoicesWithoutBL.length}</h2>
                                <p className="text-xs text-amber-100 mt-2">Pending delivery note</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/20">
                                <Receipt className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border/60">
                {([
                    { key: "notes",    icon: <FileText className="w-4 h-4" />, label: "Delivery Notes",          count: deliveryNotes.length,      color: "bg-primary/10 text-primary" },
                    { key: "quotes",   icon: <Package className="w-4 h-4" />,  label: "Quotes Without Invoice",  count: quotesNotInvoiced.length,   color: "bg-sky-100 text-sky-700" },
                    { key: "invoices", icon: <Receipt className="w-4 h-4" />,  label: "Invoices Without Note",   count: invoicesWithoutBL.length,   color: "bg-amber-100 text-amber-700" },
                ] as { key: Tab; icon: JSX.Element; label: string; count: number; color: string }[]).map(({ key, icon, label, count, color }) => (
                    <button
                        key={key}
                        onClick={() => switchTab(key)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            tab === key
                                ? "bg-background text-foreground shadow-sm border border-border/60"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {icon}
                        {label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === key ? color : "bg-muted text-muted-foreground"}`}>
                            {count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <Card className="rounded-2xl shadow-sm border border-border/60">
                <CardContent className="pt-5 pb-5">
                    <SearchInput
                        placeholder="Search by number, client..."
                        value={searchQuery}
                        onChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
                    />
                </CardContent>
            </Card>

            {/* ── TAB 1: Delivery Notes ── */}
            {tab === "notes" && (
                <Card className="rounded-2xl shadow-sm border border-border/60 overflow-hidden">
                    <CardContent className="p-0">
                        <table className="w-full">
                            <THead cols={["#", "Note #", "Client", "Linked Quote", "Delivery Date", "Linked Invoice", "Actions"]} />
                            <tbody className="divide-y divide-border/50">
                                {loadingNotes
                                    ? <SpinnerRow cols={7} />
                                    : (paginated as DeliveryNote[]).length === 0
                                        ? <EmptyRow cols={7} message="No delivery notes found." />
                                        : (paginated as DeliveryNote[]).map((dn, i) => {
                                            const invoice = dn.quotes?.invoices?.[0];
                                            return (
                                                <tr key={dn.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="p-4 text-sm text-muted-foreground font-mono">
                                                        {(currentPage - 1) * PAGE_SIZE + i + 1}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-primary font-medium text-sm">
                                                            {dn.delivery_number}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm font-medium">
                                                        {dn.quotes?.clients?.name ?? "—"}
                                                    </td>
                                                    <td className="p-4">
                                                        {dn.quotes ? (
                                                            <Link to={`/app/quotes/${dn.quotes.id}`}
                                                                className="text-xs font-mono text-muted-foreground hover:text-primary hover:underline underline-offset-4">
                                                                {dn.quotes.quote_id}
                                                            </Link>
                                                        ) : <span className="text-xs text-muted-foreground">—</span>}
                                                    </td>
                                                    <td className="p-4 text-sm text-muted-foreground">
                                                        {new Date(dn.delivery_date).toLocaleDateString("en-GB")}
                                                    </td>
                                                    <td className="p-4">
                                                        {invoice ? (
                                                            <Link to={`/app/invoices/${invoice.id}`}>
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                                                    <Receipt className="w-3 h-3" />{invoice.invoice_number}
                                                                </span>
                                                            </Link>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />None
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setDetailNote(dn)}
                                                                className="rounded-lg text-xs px-3 h-8 border-border/70 hover:bg-muted"
                                                            >
                                                                Details
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => printDeliveryNote(dn)}
                                                                title="Download PDF"
                                                                className="rounded-lg h-8 w-8 p-0 border-border/70 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                }
                            </tbody>
                        </table>
                        <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                    </CardContent>
                </Card>
            )}

            {/* ── TAB 2: Quotes without invoice → create delivery note ── */}
            {tab === "quotes" && (
                <Card className="rounded-2xl shadow-sm border border-border/60 overflow-hidden">
                    <CardContent className="p-0">
                        <table className="w-full">
                            <THead cols={["#", "Quote #", "Client", "Date", "Expiry", "Amount", "Existing Note", "Actions"]} />
                            <tbody className="divide-y divide-border/50">
                                {loadingQuotes
                                    ? <SpinnerRow cols={8} />
                                    : (paginated as Quote[]).length === 0
                                        ? <EmptyRow cols={8} message="All accepted quotes already have an invoice." />
                                        : (paginated as Quote[]).map((qt, i) => {
                                            const existingBL = qt.delivery_notes?.[0];
                                            return (
                                                <tr key={qt.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="p-4 text-sm text-muted-foreground font-mono">
                                                        {(currentPage - 1) * PAGE_SIZE + i + 1}
                                                    </td>
                                                    <td className="p-4">
                                                        <Link to={`/app/quotes/${qt.id}`}
                                                            className="text-primary font-medium text-sm hover:underline underline-offset-4 font-mono">
                                                            {qt.quote_id}
                                                        </Link>
                                                    </td>
                                                    <td className="p-4 text-sm font-medium">{qt.clients?.name ?? "—"}</td>
                                                    <td className="p-4 text-sm text-muted-foreground">
                                                        {new Date(qt.issue_date).toLocaleDateString("en-GB")}
                                                    </td>
                                                    <td className="p-4 text-sm text-muted-foreground">
                                                        {new Date(qt.expiration_date).toLocaleDateString("en-GB")}
                                                    </td>
                                                    <td className="p-4 text-sm font-semibold tabular-nums">
                                                        {Number(qt.total_amount).toLocaleString("en")} DT
                                                    </td>
                                                    <td className="p-4">
                                                        {existingBL ? (
                                                            <Link to={`/app/delivery-notes/${existingBL.id}`}>
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors">
                                                                    <Package className="w-3 h-3" />{existingBL.delivery_number}
                                                                </span>
                                                            </Link>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />None
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {existingBL ? (
                                                            <span className="text-xs text-muted-foreground italic">Already created</span>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => openModal({
                                                                    quoteId: qt.id,
                                                                    quoteRef: qt.quote_id,
                                                                    clientName: qt.clients?.name ?? "",
                                                                    totalAmount: qt.total_amount,
                                                                })}
                                                                className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 h-8 bg-sky-600 hover:bg-sky-700 text-white"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />Create Note
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                }
                            </tbody>
                        </table>
                        <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                    </CardContent>
                </Card>
            )}

            {/* ── TAB 3: Invoices whose quote has no delivery note yet ── */}
            {tab === "invoices" && (
                <Card className="rounded-2xl shadow-sm border border-border/60 overflow-hidden">
                    <CardContent className="p-0">
                        <table className="w-full">
                            <THead cols={["#", "Invoice #", "Client", "Linked Quote", "Date", "Due Date", "Amount", "Actions"]} />
                            <tbody className="divide-y divide-border/50">
                                {loadingInvoices
                                    ? <SpinnerRow cols={8} />
                                    : (paginated as InvoiceWithQuote[]).length === 0
                                        ? <EmptyRow cols={8} message="All invoices already have a delivery note." />
                                        : (paginated as InvoiceWithQuote[]).map((inv, i) => (
                                            <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-4 text-sm text-muted-foreground font-mono">
                                                    {(currentPage - 1) * PAGE_SIZE + i + 1}
                                                </td>
                                                <td className="p-4">
                                                    <Link to={`/app/invoices/${inv.id}`}
                                                        className="text-primary font-medium text-sm hover:underline underline-offset-4">
                                                        {inv.invoice_number}
                                                    </Link>
                                                </td>
                                                <td className="p-4 text-sm font-medium">
                                                    {inv.quotes?.clients?.name ?? "—"}
                                                </td>
                                                <td className="p-4">
                                                    {inv.quotes ? (
                                                        <Link to={`/app/quotes/${inv.quotes.id}`}
                                                            className="text-xs font-mono text-muted-foreground hover:text-primary hover:underline underline-offset-4">
                                                            {inv.quotes.quote_id}
                                                        </Link>
                                                    ) : <span className="text-xs text-muted-foreground">—</span>}
                                                </td>
                                                <td className="p-4 text-sm text-muted-foreground">
                                                    {new Date(inv.issue_date).toLocaleDateString("en-GB")}
                                                </td>
                                                <td className="p-4 text-sm text-muted-foreground">
                                                    {new Date(inv.due_date).toLocaleDateString("en-GB")}
                                                </td>
                                                <td className="p-4 text-sm font-semibold tabular-nums">
                                                    {Number(inv.total_amount).toLocaleString("en")} DT
                                                </td>
                                                <td className="p-4">
                                                    {inv.quotes ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openModal({
                                                                quoteId: inv.quotes!.id,
                                                                quoteRef: inv.quotes!.quote_id,
                                                                clientName: inv.quotes!.clients?.name ?? "",
                                                                totalAmount: inv.quotes!.total_amount,
                                                            })}
                                                            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 h-8 bg-amber-500 hover:bg-amber-600 text-white"
                                                        >
                                                            <FilePlus className="w-3.5 h-3.5" />Create Note
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Quote missing</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                }
                            </tbody>
                        </table>
                        <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}