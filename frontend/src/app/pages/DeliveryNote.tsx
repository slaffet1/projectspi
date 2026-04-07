import { JSX, useEffect, useRef, useState } from "react";
import {
    Package, FileText, FilePlus, Plus, Receipt,
    ChevronLeft, ChevronRight, X, MapPin, Phone, Mail, User, Calendar, Download,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { SearchInput } from "@/app/components/SearchInput";
import { Link } from "react-router";
import { deliveryNoteService } from "@/app/services/deliveryNoteService";
import { invoiceService } from "@/app/services/invoiceService";
import { useBusiness } from "@/app/context/BusinessContext";
import { toast } from "sonner";

const PAGE_SIZE = 8;

interface Client {
    id: number; name: string; email?: string; phone?: string;
    address?: string; city?: string; country?: string; tax_number?: string;
}
interface Invoice {
    id: number; invoice_number: string; status: string;
    total_amount: number; issue_date: string; due_date: string;
}
interface DeliveryNoteRef { id: number; delivery_number: string; delivery_date: string; }
interface QuoteDetail { id: number; quantity: number; products: { id: number; name: string; unit_price: number }; }
interface Quote {
    id: number; quote_id: string; issue_date: string; expiration_date: string;
    total_amount: number; status: string; clients?: Client;
    invoices?: Invoice[]; delivery_notes?: DeliveryNoteRef[]; quote_details?: QuoteDetail[];
}
interface DeliveryNote {
    id: number; delivery_number: string; delivery_date: string; quote_id?: number;
    quotes?: Quote & { invoices?: Invoice[] };
    status: "PENDING" | "DELIVERED" | "CANCELLED";
}
interface InvoiceWithQuote extends Invoice {
    quote_id?: number; quotes?: Quote & { delivery_notes?: DeliveryNoteRef[] };
}
type Tab = "notes" | "quotes" | "invoices";

function safeArray(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
}

// ── Accessible Modal Hook ──────────────────────────────────────────────────────
// Traps focus inside modal and restores it on close
function useFocusTrap(isOpen: boolean) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement;
            const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            firstFocusable?.focus();
        } else {
            previousFocusRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab" || !modalRef.current) return;
            const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
            ));
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    return modalRef;
}

// ── Print ──────────────────────────────────────────────────────────────────────
function printDeliveryNote(note: DeliveryNote) {
    const client = note.quotes?.clients;
    const invoice = note.quotes?.invoices?.[0];
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Delivery Note - ${note.delivery_number}</title>
<style>
  body{font-family:Arial,sans-serif;color:#000;background:#fff;padding:40px;line-height:1.4}
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;border-bottom:2px solid #000;padding-bottom:15px}
  .header h1{font-size:24px;font-weight:700}.badge{border:2px solid #000;border-radius:8px;padding:6px 16px;font-weight:600;font-size:14px}
  .section-title{font-size:12px;font-weight:700;text-transform:uppercase;margin-top:30px;margin-bottom:8px;border-bottom:1px solid #000;padding-bottom:4px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .info-box{border:1px solid #000;border-radius:8px;padding:12px 14px}
  .info-box .label{font-size:11px;margin-bottom:4px}.info-box .value{font-size:14px;font-weight:600}
  .total-box{border:1px solid #000;border-radius:8px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-top:20px;font-size:16px;font-weight:700}
  .client-block{border:1px solid #000;border-radius:8px;overflow:hidden;margin-top:10px}
  .client-row{display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #000;font-size:13px}
  .client-row:last-child{border-bottom:none}.row-label{font-weight:700}
  .invoice-box{border:1px solid #000;border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-top:10px}
  .signature-box{border:1px solid #000;width:150px;height:150px;margin-top:40px;margin-left:auto;font-size:12px;font-weight:600;display:flex;justify-content:center;align-items:center;text-align:center}
</style></head><body>
  <div class="header"><div><h1>Delivery Note</h1><p>Generated on ${new Date().toLocaleDateString("en-GB")}</p></div>
  <div><span class="badge">${note.delivery_number}</span></div></div>
  <div class="section-title">Delivery Information</div>
  <div class="info-grid">
    <div class="info-box"><div class="label">Delivery Date</div><div class="value">${new Date(note.delivery_date).toLocaleDateString("en-GB")}</div></div>
    <div class="info-box"><div class="label">Linked Quote</div><div class="value">${note.quotes?.quote_id ?? "—"}</div></div>
  </div>
  ${note.quotes?.total_amount !== undefined ? `<div class="total-box"><span>Total Amount (quote)</span><span>${Number(note.quotes.total_amount).toLocaleString("en")} DT</span></div>` : ""}
  ${client ? `<div class="section-title">Client Information</div><div class="client-block">
    <div class="client-row"><span class="row-label">Name</span><span>${client.name}</span></div>
    ${client.email ? `<div class="client-row"><span class="row-label">Email</span><span>${client.email}</span></div>` : ""}
    ${client.phone ? `<div class="client-row"><span class="row-label">Phone</span><span>${client.phone}</span></div>` : ""}
    ${(client.address || client.city || client.country) ? `<div class="client-row"><span class="row-label">Address</span><span>${[client.address, client.city, client.country].filter(Boolean).join(", ")}</span></div>` : ""}
    ${client.tax_number ? `<div class="client-row"><span class="row-label">Tax Number</span><span>${client.tax_number}</span></div>` : ""}
  </div>` : ""}
  ${invoice ? `<div class="section-title">Linked Invoice</div><div class="invoice-box">
    <div><div>Invoice Number</div><div>${invoice.invoice_number}</div></div><span>${invoice.status}</span></div>` : ""}
  <fieldset class="signature-box"><legend>Client signature</legend></fieldset>
</body></html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
}

// ── Reusable components ────────────────────────────────────────────────────────

function SpinnerRow({ cols }: { cols: number }) {
    return (
        <tr><td colSpan={cols} className="p-12 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm" role="status" aria-label="Loading">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Loading...</span>
            </div>
        </td></tr>
    );
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
    return <tr><td colSpan={cols} className="p-12 text-center text-muted-foreground text-sm" role="cell">{message}</td></tr>;
}

function THead({ cols }: { cols: string[] }) {
    return (
        <thead>
            <tr className="border-b bg-muted/40">
                {cols.map((h) => (
                    <th key={h} scope="col" className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
            </tr>
        </thead>
    );
}

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
    if (total <= 1) return null;
    return (
        <nav aria-label="Pagination" className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">Page {current} of {total}</p>
            <div className="flex gap-1" role="list">
                <Button size="sm" variant="ghost" disabled={current === 1} onClick={() => onChange(current - 1)}
                    className="w-8 h-8 p-0 rounded-lg" aria-label="Previous page">
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </Button>
                {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
                    <Button key={p} size="sm" variant={p === current ? "default" : "ghost"} onClick={() => onChange(p)}
                        aria-label={`Page ${p}`} aria-current={p === current ? "page" : undefined}
                        className={`w-8 h-8 p-0 rounded-lg text-xs ${p === current ? "shadow-sm" : "text-muted-foreground"}`}>{p}</Button>
                ))}
                <Button size="sm" variant="ghost" disabled={current === total} onClick={() => onChange(current + 1)}
                    className="w-8 h-8 p-0 rounded-lg" aria-label="Next page">
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Button>
            </div>
        </nav>
    );
}

function StatusBadge({ status }: { status: "PENDING" | "DELIVERED" | "CANCELLED" }) {
    const styles = {
        PENDING: "bg-amber-100 text-amber-700",
        DELIVERED: "bg-emerald-100 text-emerald-700",
        CANCELLED: "bg-red-100 text-red-700",
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`} aria-label={`Status: ${status}`}>
            {status}
        </span>
    );
}

// ── Convert to Invoice Modal ───────────────────────────────────────────────────
interface ConvertToInvoiceState {
    quoteId: number; quoteRef: string; clientName: string;
    totalAmount: number; deliveryNumber: string;
}

function ConvertToInvoiceModal({ data, businessId, onClose, onSuccess }: {
    data: ConvertToInvoiceState; businessId: number;
    onClose: () => void; onSuccess: () => void;
}) {
    const today = new Date().toISOString().split("T")[0];
    const defaultDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const [issueDate, setIssueDate] = useState(today);
    const [dueDate, setDueDate] = useState(defaultDue);
    const [loading, setLoading] = useState(false);
    const modalRef = useFocusTrap(true);
    const titleId = "convert-modal-title";

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const handleSubmit = async () => {
        if (!issueDate) { toast.error("Issue date is required"); return; }
        if (!dueDate) { toast.error("Due date is required"); return; }
        try {
            setLoading(true);
            await invoiceService.create(businessId, { quote_id: data.quoteId, issue_date: issueDate, due_date: dueDate });
            toast.success("Invoice created successfully!");
            onSuccess(); onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error creating invoice");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div ref={modalRef} className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-100" aria-hidden="true">
                            <Receipt className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <h2 id={titleId} className="text-base font-semibold">Convert to Invoice</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">From delivery note {data.deliveryNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="Close dialog"
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    </button>
                </div>
                <div className="px-6 py-4 bg-muted/30 border-b border-border grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Client</p><p className="font-semibold">{data.clientName}</p></div>
                    <div><p className="text-xs text-muted-foreground">Linked Quote</p><p className="font-semibold font-mono">{data.quoteRef}</p></div>
                </div>
                <div className="mx-6 mt-5 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3" role="note">
                    <p className="text-xs text-sky-700 font-medium">The invoice number, total amount and tax will be calculated automatically by the server from the quote line items.</p>
                </div>
                <div className="px-6 py-5 grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="issue-date" className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Issue Date <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
                        </label>
                        <input id="issue-date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required
                            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div>
                        <label htmlFor="due-date" className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Due Date <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
                        </label>
                        <input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required
                            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">Cancel</Button>
                    <Button size="sm" disabled={loading} onClick={handleSubmit}
                        aria-disabled={loading}
                        className="rounded-xl gap-2 min-w-[150px] bg-emerald-600 hover:bg-emerald-700 text-white">
                        {loading ? (
                            <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg><span>Creating...</span></>
                        ) : (<><Receipt className="w-3.5 h-3.5" aria-hidden="true" />Create Invoice</>)}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Details Modal ──────────────────────────────────────────────────────────────
function DetailsModal({ note, onClose }: { note: DeliveryNote; onClose: () => void }) {
    const client = note.quotes?.clients;
    const invoice = note.quotes?.invoices?.[0];
    const totalAmount = note.quotes?.total_amount;
    const modalRef = useFocusTrap(true);
    const titleId = "details-modal-title";

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div ref={modalRef} className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10" aria-hidden="true"><Package className="w-5 h-5 text-primary" /></div>
                        <div>
                            <h2 id={titleId} className="text-base font-semibold">{note.delivery_number}</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Delivery Note — {new Date(note.delivery_date).toLocaleDateString("en-GB")}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="Close dialog"
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    <dl className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/40 rounded-xl p-3">
                            <dt className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Calendar className="w-3 h-3" aria-hidden="true" />Delivery Date
                            </dt>
                            <dd className="text-sm font-semibold">{new Date(note.delivery_date).toLocaleDateString("en-GB")}</dd>
                        </div>
                        <div className="bg-muted/40 rounded-xl p-3">
                            <dt className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                                <FileText className="w-3 h-3" aria-hidden="true" />Linked Quote
                            </dt>
                            <dd className="text-sm font-semibold font-mono">{note.quotes?.quote_id ?? "—"}</dd>
                        </div>
                    </dl>

                    {totalAmount !== undefined && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between"
                            aria-label={`Total amount: ${Number(totalAmount).toLocaleString("en")} DT`}>
                            <p className="text-sm text-emerald-700 font-medium">Total Amount (quote)</p>
                            <p className="text-2xl font-bold text-emerald-700 tabular-nums" aria-hidden="true">
                                {Number(totalAmount).toLocaleString("en")} <span className="text-base font-normal">DT</span>
                            </p>
                        </div>
                    )}

                    {client && (
                        <section aria-label="Client information">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Client Information</h3>
                            <dl className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="p-1.5 rounded-lg bg-muted" aria-hidden="true"><User className="w-3.5 h-3.5 text-muted-foreground" /></div>
                                    <div><dt className="text-xs text-muted-foreground">Name</dt><dd className="text-sm font-medium">{client.name}</dd></div>
                                </div>
                                {client.email && (
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="p-1.5 rounded-lg bg-muted" aria-hidden="true"><Mail className="w-3.5 h-3.5 text-muted-foreground" /></div>
                                        <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="text-sm font-medium">{client.email}</dd></div>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="p-1.5 rounded-lg bg-muted" aria-hidden="true"><Phone className="w-3.5 h-3.5 text-muted-foreground" /></div>
                                        <div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="text-sm font-medium">{client.phone}</dd></div>
                                    </div>
                                )}
                                {(client.address || client.city || client.country) && (
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="p-1.5 rounded-lg bg-muted" aria-hidden="true"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /></div>
                                        <div><dt className="text-xs text-muted-foreground">Address</dt>
                                            <dd className="text-sm font-medium">{[client.address, client.city, client.country].filter(Boolean).join(", ")}</dd>
                                        </div>
                                    </div>
                                )}
                                {client.tax_number && (
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="p-1.5 rounded-lg bg-muted" aria-hidden="true"><Receipt className="w-3.5 h-3.5 text-muted-foreground" /></div>
                                        <div><dt className="text-xs text-muted-foreground">Tax Number</dt><dd className="text-sm font-medium font-mono">{client.tax_number}</dd></div>
                                    </div>
                                )}
                            </dl>
                        </section>
                    )}

                    {invoice && (
                        <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-xl px-4 py-3"
                            aria-label={`Linked invoice: ${invoice.invoice_number}, status: ${invoice.status}`}>
                            <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-sky-600" aria-hidden="true" />
                                <div>
                                    <p className="text-xs text-sky-600">Linked Invoice</p>
                                    <p className="text-sm font-semibold text-sky-700">{invoice.invoice_number}</p>
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${invoice.status === "paid" ? "bg-emerald-100 text-emerald-700" : invoice.status === "sent" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                                {invoice.status === "paid" ? "Paid" : invoice.status === "sent" ? "Sent" : invoice.status}
                            </span>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <Button size="sm" variant="outline" onClick={() => printDeliveryNote(note)}
                        aria-label={`Download PDF for delivery note ${note.delivery_number}`}
                        className="rounded-xl gap-2 border-border/70 text-muted-foreground hover:text-foreground">
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />Download PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">Close</Button>
                </div>
            </div>
        </div>
    );
}

// ── Create BL Modal ────────────────────────────────────────────────────────────
interface ModalState { quoteId: number; quoteRef: string; clientName: string; totalAmount: number; }

function CreateBLModal({ quoteId, quoteRef, clientName, totalAmount, businessId, onClose, onSuccess }: ModalState & {
    businessId: number; onClose: () => void; onSuccess: () => void;
}) {
    const [deliveryNumber, setDeliveryNumber] = useState(`BL-${quoteRef}-${Date.now().toString().slice(-4)}`);
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const modalRef = useFocusTrap(true);
    const titleId = "create-bl-modal-title";

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const handleSubmit = async () => {
        if (!deliveryNumber.trim()) { toast.error("Delivery number is required"); return; }
        try {
            setLoading(true);
            await deliveryNoteService.create(businessId, { delivery_number: deliveryNumber, delivery_date: deliveryDate, quote_id: quoteId });
            toast.success("Delivery note created successfully!");
            onSuccess(); onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error creating delivery note");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div ref={modalRef} className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                        <h2 id={titleId} className="text-base font-semibold">New Delivery Note</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Quote {quoteRef} — {clientName}</p>
                    </div>
                    <button onClick={onClose} aria-label="Close dialog"
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    </button>
                </div>
                <div className="px-6 py-4 bg-muted/30 border-b border-border grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Client</p><p className="font-medium">{clientName}</p></div>
                    <div><p className="text-xs text-muted-foreground">Quote Amount</p>
                        <p className="font-semibold text-emerald-600">{Number(totalAmount).toLocaleString("en")} DT</p>
                    </div>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label htmlFor="bl-number" className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Delivery Note Number <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
                        </label>
                        <input id="bl-number" value={deliveryNumber} onChange={(e) => setDeliveryNumber(e.target.value)} required
                            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div>
                        <label htmlFor="bl-date" className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Delivery Date <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
                        </label>
                        <input id="bl-date" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required
                            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">Cancel</Button>
                    <Button size="sm" disabled={loading} onClick={handleSubmit} aria-disabled={loading}
                        className="rounded-xl gap-2 min-w-[130px]">
                        {loading ? (<><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg><span>Creating...</span></>) : (<><Package className="w-3.5 h-3.5" aria-hidden="true" />Create Note</>)}
                    </Button>
                </div>
            </div>
        </div>
    );
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
    const [convertNote, setConvertNote] = useState<ConvertToInvoiceState | null>(null);

    // Live region ref for announcing dynamic content changes to screen readers
    const liveRegionRef = useRef<HTMLDivElement>(null);
    const announce = (msg: string) => {
        if (liveRegionRef.current) liveRegionRef.current.textContent = msg;
    };

    useEffect(() => {
        if (businessId) { fetchDeliveryNotes(); fetchQuotesNotInvoiced(); fetchInvoicesWithoutBL(); }
    }, [businessId]);

    const changeStatus = async (id: number, status: "DELIVERED" | "CANCELLED") => {
        try {
            await deliveryNoteService.changeStatus(businessId, id, status);
            toast.success("Status updated");
            announce(`Delivery note status updated to ${status}`);
            fetchDeliveryNotes();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to update status");
        }
    };

    const fetchDeliveryNotes = async () => {
        try { setLoadingNotes(true); const res = await deliveryNoteService.getAll(businessId!); setDeliveryNotes(safeArray(res)); }
        catch (err) { console.error(err); toast.error("Failed to load delivery notes"); }
        finally { setLoadingNotes(false); }
    };
    const fetchQuotesNotInvoiced = async () => {
        try { setLoadingQuotes(true); const res = await deliveryNoteService.getQuotesNotInvoiced(businessId!); setQuotesNotInvoiced(safeArray(res)); }
        catch (err) { console.error(err); toast.error("Failed to load quotes"); }
        finally { setLoadingQuotes(false); }
    };
    const fetchInvoicesWithoutBL = async () => {
        try { setLoadingInvoices(true); const res = await deliveryNoteService.getInvoicesWithoutBL(businessId!); setInvoicesWithoutBL(safeArray(res)); }
        catch (err) { console.error(err); toast.error("Failed to load invoices"); }
        finally { setLoadingInvoices(false); }
    };
    const refetchAll = () => { fetchDeliveryNotes(); fetchQuotesNotInvoiced(); fetchInvoicesWithoutBL(); };

    const switchTab = (t: Tab) => {
        setTab(t);
        setCurrentPage(1);
        setSearchQuery("");
        const labels: Record<Tab, string> = { notes: "Delivery Notes", quotes: "Quotes Without Invoice", invoices: "Invoices Without Note" };
        announce(`Switched to ${labels[t]} tab`);
    };

    const q = searchQuery.toLowerCase();
    const filteredNotes = deliveryNotes.filter((dn) =>
        dn.delivery_number?.toLowerCase().includes(q) ||
        dn.quotes?.clients?.name?.toLowerCase().includes(q) ||
        dn.quotes?.quote_id?.toLowerCase().includes(q)
    );
    const filteredQuotes = quotesNotInvoiced.filter((qt) =>
        qt.quote_id?.toLowerCase().includes(q) || qt.clients?.name?.toLowerCase().includes(q)
    );
    const filteredInvoices = invoicesWithoutBL.filter((inv) =>
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.quotes?.clients?.name?.toLowerCase().includes(q) ||
        inv.quotes?.quote_id?.toLowerCase().includes(q)
    );

    const activeList = tab === "notes" ? filteredNotes : tab === "quotes" ? filteredQuotes : filteredInvoices;
    const totalPages = Math.ceil(activeList.length / PAGE_SIZE);
    const paginated = activeList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className="space-y-8">
            {/* Screen reader live region */}
            <div ref={liveRegionRef} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />

            {detailNote && <DetailsModal note={detailNote} onClose={() => setDetailNote(null)} />}
            {modal && <CreateBLModal {...modal} businessId={businessId!} onClose={() => setModal(null)} onSuccess={refetchAll} />}
            {convertNote && <ConvertToInvoiceModal data={convertNote} businessId={businessId!} onClose={() => setConvertNote(null)} onSuccess={refetchAll} />}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Delivery Notes</h1>
                <p className="text-muted-foreground mt-1 text-sm">Manage your delivery notes and track the progress of your quotes and invoices</p>
            </div>

            {/* Stat cards — role=button + keyboard support */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="list" aria-label="Summary statistics">
                {([
                    { t: "notes" as Tab, label: "Delivery Notes", count: deliveryNotes.length, sub: "Total created", from: "slate-800", to: "slate-900", icon: <FileText className="h-5 w-5 text-slate-200" aria-hidden="true" /> },
                    { t: "quotes" as Tab, label: "Quotes Without Invoice", count: quotesNotInvoiced.length, sub: "Pending delivery note", from: "sky-500", to: "blue-700", icon: <Package className="h-5 w-5 text-white" aria-hidden="true" /> },
                    { t: "invoices" as Tab, label: "Invoices Without Note", count: invoicesWithoutBL.length, sub: "Pending delivery note", from: "amber-400", to: "amber-600", icon: <Receipt className="h-5 w-5 text-white" aria-hidden="true" /> },
                ]).map(({ t, label, count, sub, icon }) => (
                    <div key={t} role="listitem">
                        <Card
                            onClick={() => switchTab(t)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); switchTab(t); } }}
                            tabIndex={0}
                            role="button"
                            aria-label={`${label}: ${count}. ${sub}. Click to view tab.`}
                            aria-pressed={tab === t}
                            className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative cursor-pointer hover:scale-[1.01] transition-transform focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{label}</p>
                                        <p className="text-4xl font-bold mt-2 tabular-nums" aria-label={`${count} ${label}`}>{count}</p>
                                        <p className="text-xs text-slate-400 mt-2">{sub}</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/10">{icon}</div>
                                </div>
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5" aria-hidden="true" />
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div role="tablist" aria-label="Delivery notes sections" className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border/60">
                {([
                    { key: "notes" as Tab, icon: <FileText className="w-4 h-4" aria-hidden="true" />, label: "Delivery Notes", count: deliveryNotes.length, color: "bg-primary/10 text-primary" },
                    { key: "quotes" as Tab, icon: <Package className="w-4 h-4" aria-hidden="true" />, label: "Quotes Without Invoice", count: quotesNotInvoiced.length, color: "bg-sky-100 text-sky-700" },
                    { key: "invoices" as Tab, icon: <Receipt className="w-4 h-4" aria-hidden="true" />, label: "Invoices Without Note", count: invoicesWithoutBL.length, color: "bg-amber-100 text-amber-700" },
                ] as { key: Tab; icon: JSX.Element; label: string; count: number; color: string }[]).map(({ key, icon, label, count, color }) => (
                    <button key={key}
                        role="tab"
                        aria-selected={tab === key}
                        aria-controls={`tabpanel-${key}`}
                        id={`tab-${key}`}
                        onClick={() => switchTab(key)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${tab === key ? "bg-background text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"}`}>
                        {icon}{label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === key ? color : "bg-muted text-muted-foreground"}`}
                            aria-label={`${count} items`}>{count}</span>
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

            {/* ── TAB 1 ── */}
            {tab === "notes" && (
                <Card className="rounded-2xl shadow-sm border border-border/60 overflow-hidden">
                    <CardContent className="p-0">
                        <div role="tabpanel" id="tabpanel-notes" aria-labelledby="tab-notes">
                            <table className="w-full" aria-label="Delivery notes list">
                                <THead cols={["#", "Note #", "Client", "Linked Quote", "Delivery Date", "Linked Invoice", "Status", "Actions"]} />
                                <tbody className="divide-y divide-border/50">
                                    {loadingNotes ? <SpinnerRow cols={8} />
                                        : (paginated as DeliveryNote[]).length === 0 ? <EmptyRow cols={8} message="No delivery notes found." />
                                            : (paginated as DeliveryNote[]).map((dn, i) => {
                                                const invoice = dn.quotes?.invoices?.[0];
                                                const hasInvoice = !!invoice;
                                                const canConvert = !!dn.quotes && !hasInvoice;
                                                return (
                                                    <tr key={dn.id} className="hover:bg-muted/20 transition-colors">
                                                        <td className="p-4 text-sm text-muted-foreground font-mono" aria-label={`Row ${(currentPage - 1) * PAGE_SIZE + i + 1}`}>{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                                                        <td className="p-4"><span className="text-primary font-medium text-sm">{dn.delivery_number}</span></td>
                                                        <td className="p-4 text-sm font-medium">{dn.quotes?.clients?.name ?? "—"}</td>
                                                        <td className="p-4">
                                                            {dn.quotes ? (
                                                                <Link to={`/app/quotes/${dn.quotes.id}`}
                                                                    aria-label={`View quote ${dn.quotes.quote_id}`}
                                                                    className="text-xs font-mono text-muted-foreground hover:text-primary hover:underline underline-offset-4">
                                                                    {dn.quotes.quote_id}
                                                                </Link>
                                                            ) : <span className="text-xs text-muted-foreground" aria-label="No linked quote">—</span>}
                                                        </td>
                                                        <td className="p-4 text-sm text-muted-foreground">{new Date(dn.delivery_date).toLocaleDateString("en-GB")}</td>
                                                        <td className="p-4">
                                                            {hasInvoice ? (
                                                                <Link to={`/app/invoices/${invoice!.id}`} aria-label={`View invoice ${invoice!.invoice_number}`}>
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                                                        <Receipt className="w-3 h-3" aria-hidden="true" />{invoice!.invoice_number}
                                                                    </span>
                                                                </Link>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200" aria-label="No linked invoice">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />None
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4"><StatusBadge status={dn.status} /></td>
                                                        <td className="p-4">
                                                            <div className="flex gap-2 flex-wrap">
                                                                {dn.status === "PENDING" && (
                                                                    <>
                                                                        <Button size="sm"
                                                                            aria-label={`Mark delivery note ${dn.delivery_number} as delivered`}
                                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                            onClick={() => changeStatus(dn.id, "DELIVERED")}>
                                                                            Deliver
                                                                        </Button>
                                                                        <Button size="sm" variant="destructive"
                                                                            aria-label={`Cancel delivery note ${dn.delivery_number}`}
                                                                            onClick={() => changeStatus(dn.id, "CANCELLED")}>
                                                                            Cancel
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                <Button size="sm" variant="outline"
                                                                    aria-label={`View details for delivery note ${dn.delivery_number}`}
                                                                    onClick={() => setDetailNote(dn)}
                                                                    className="rounded-lg text-xs px-3 h-8 border-border/70 hover:bg-muted">
                                                                    Details
                                                                </Button>
                                                                <Button size="sm" variant="outline"
                                                                    onClick={() => printDeliveryNote(dn)}
                                                                    aria-label={`Download PDF for delivery note ${dn.delivery_number}`}
                                                                    className="rounded-lg h-8 w-8 p-0 border-border/70 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                                                                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                                                                </Button>
                                                                {canConvert && (
                                                                    <Button size="sm"
                                                                        aria-label={`Convert delivery note ${dn.delivery_number} to invoice`}
                                                                        onClick={() => setConvertNote({
                                                                            quoteId: dn.quotes!.id, quoteRef: dn.quotes!.quote_id,
                                                                            clientName: dn.quotes!.clients?.name ?? "",
                                                                            totalAmount: dn.quotes!.total_amount, deliveryNumber: dn.delivery_number,
                                                                        })}
                                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                                                                        <Receipt className="w-3.5 h-3.5" aria-hidden="true" />To Invoice
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                    </CardContent>
                </Card>
            )}

            {/* ── TAB 2 ── */}
            {tab === "quotes" && (
                <Card className="rounded-2xl shadow-sm border border-border/60 overflow-hidden">
                    <CardContent className="p-0">
                        <div role="tabpanel" id="tabpanel-quotes" aria-labelledby="tab-quotes">
                            <table className="w-full" aria-label="Quotes without invoice">
                                <THead cols={["#", "Quote #", "Client", "Date", "Expiry", "Amount", "Existing Note", "Actions"]} />
                                <tbody className="divide-y divide-border/50">
                                    {loadingQuotes ? <SpinnerRow cols={8} />
                                        : (paginated as Quote[]).length === 0 ? <EmptyRow cols={8} message="All accepted quotes already have an invoice." />
                                            : (paginated as Quote[]).map((qt, i) => {
                                                const existingBL = qt.delivery_notes?.[0];
                                                return (
                                                    <tr key={qt.id} className="hover:bg-muted/20 transition-colors">
                                                        <td className="p-4 text-sm text-muted-foreground font-mono">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                                                        <td className="p-4">
                                                            <Link to={`/app/quotes/${qt.id}`} aria-label={`View quote ${qt.quote_id}`}
                                                                className="text-primary font-medium text-sm hover:underline underline-offset-4 font-mono">{qt.quote_id}</Link>
                                                        </td>
                                                        <td className="p-4 text-sm font-medium">{qt.clients?.name ?? "—"}</td>
                                                        <td className="p-4 text-sm text-muted-foreground">{new Date(qt.issue_date).toLocaleDateString("en-GB")}</td>
                                                        <td className="p-4 text-sm text-muted-foreground">{new Date(qt.expiration_date).toLocaleDateString("en-GB")}</td>
                                                        <td className="p-4 text-sm font-semibold tabular-nums">{Number(qt.total_amount).toLocaleString("en")} DT</td>
                                                        <td className="p-4">
                                                            {existingBL ? (
                                                                <Link to={`/app/delivery-notes/${existingBL.id}`} aria-label={`View delivery note ${existingBL.delivery_number}`}>
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors">
                                                                        <Package className="w-3 h-3" aria-hidden="true" />{existingBL.delivery_number}
                                                                    </span>
                                                                </Link>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200" aria-label="No delivery note yet">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />None
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4">
                                                            {existingBL ? <span className="text-xs text-muted-foreground italic">Already created</span> : (
                                                                <Button size="sm"
                                                                    aria-label={`Create delivery note for quote ${qt.quote_id}`}
                                                                    onClick={() => setModal({ quoteId: qt.id, quoteRef: qt.quote_id, clientName: qt.clients?.name ?? "", totalAmount: qt.total_amount })}
                                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 h-8 bg-sky-600 hover:bg-sky-700 text-white">
                                                                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />Create Note
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                    </CardContent>
                </Card>
            )}

            {/* ── TAB 3 ── */}
            {tab === "invoices" && (
                <Card className="rounded-2xl shadow-sm border border-border/60 overflow-hidden">
                    <CardContent className="p-0">
                        <div role="tabpanel" id="tabpanel-invoices" aria-labelledby="tab-invoices">
                            <table className="w-full" aria-label="Invoices without delivery note">
                                <THead cols={["#", "Invoice #", "Client", "Linked Quote", "Date", "Due Date", "Amount", "Actions"]} />
                                <tbody className="divide-y divide-border/50">
                                    {loadingInvoices ? <SpinnerRow cols={8} />
                                        : (paginated as InvoiceWithQuote[]).length === 0 ? <EmptyRow cols={8} message="All invoices already have a delivery note." />
                                            : (paginated as InvoiceWithQuote[]).map((inv, i) => (
                                                <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="p-4 text-sm text-muted-foreground font-mono">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                                                    <td className="p-4">
                                                        <Link to={`/app/invoices/${inv.id}`} aria-label={`View invoice ${inv.invoice_number}`}
                                                            className="text-primary font-medium text-sm hover:underline underline-offset-4">{inv.invoice_number}</Link>
                                                    </td>
                                                    <td className="p-4 text-sm font-medium">{inv.quotes?.clients?.name ?? "—"}</td>
                                                    <td className="p-4">
                                                        {inv.quotes ? <Link to={`/app/quotes/${inv.quotes.id}`} aria-label={`View quote ${inv.quotes.quote_id}`}
                                                            className="text-xs font-mono text-muted-foreground hover:text-primary hover:underline underline-offset-4">{inv.quotes.quote_id}</Link>
                                                            : <span className="text-xs text-muted-foreground" aria-label="No linked quote">—</span>}
                                                    </td>
                                                    <td className="p-4 text-sm text-muted-foreground">{new Date(inv.issue_date).toLocaleDateString("en-GB")}</td>
                                                    <td className="p-4 text-sm text-muted-foreground">{new Date(inv.due_date).toLocaleDateString("en-GB")}</td>
                                                    <td className="p-4 text-sm font-semibold tabular-nums">{Number(inv.total_amount).toLocaleString("en")} DT</td>
                                                    <td className="p-4">
                                                        {inv.quotes ? (
                                                            <Button size="sm"
                                                                aria-label={`Create delivery note for invoice ${inv.invoice_number}`}
                                                                onClick={() => setModal({ quoteId: inv.quotes!.id, quoteRef: inv.quotes!.quote_id, clientName: inv.quotes!.clients?.name ?? "", totalAmount: inv.quotes!.total_amount })}
                                                                className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 h-8 bg-amber-500 hover:bg-amber-600 text-white">
                                                                <FilePlus className="w-3.5 h-3.5" aria-hidden="true" />Create Note
                                                            </Button>
                                                        ) : <span className="text-xs text-muted-foreground italic">Quote missing</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}