import { useEffect, useState, useCallback } from "react";
import {
    Plus, Search, Trash2, FileText, Truck, ChevronLeft,
    ChevronRight, X, CheckSquare, Square, RefreshCw,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { SearchInput } from "@/app/components/SearchInput";
import { creditNoteService } from "@/app/services/creditNotesService";
import { useBusiness } from "@/app/context/BusinessContext";
import { toast } from "sonner";

const PAGE_SIZE = 10;

// ── Types ──────────────────────────────────────────────────────────────────────

interface Product { id: number; name: string; unit_price: number; unit?: string }
interface QuoteDetail { id: number; product_id: number; quantity: number; products: Product }
interface Client { id: number; name: string; email?: string; phone?: string; address?: string }

interface Invoice {
    id: number;
    invoice_number: string;
    total_amount: number;
    issue_date: string;
    quotes?: { clients?: Client; quote_details?: QuoteDetail[] };
}

interface DeliveryNote {
    id: number;
    delivery_number: string;
    delivery_date: string;
    quotes?: { clients?: Client; quote_details?: QuoteDetail[] };
}

interface CreditNoteItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    total: number;
    products: Product;
}

interface CreditNote {
    id: number;
    credit_number: string;
    return_date: string;
    reason: string;
    note?: string;
    total_amount: number;
    status: "DRAFT" | "CONFIRMED" | "CANCELLED";
    invoice_id?: number;
    delivery_note_id?: number;
    clients?: Client;
    invoices?: { id: number; invoice_number: string };
    delivery_notes?: { id: number; delivery_number: string };
    credit_note_items: CreditNoteItem[];
}

type SourceType = "invoice" | "delivery_note";

interface SelectedItem {
    product_id: number;
    name: string;
    unit_price: number;
    max_quantity: number;
    quantity: number;
    unit?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function safeArray(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
}




function CreateCreditNoteModal({
    businessId,
    onClose,
    onSuccess,
}: {
    businessId: number;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [step, setStep] = useState<"source" | "select_doc" | "select_items" | "details">("source");
    const [sourceType, setSourceType] = useState<SourceType | null>(null);

  
    const [docQuery, setDocQuery] = useState("");
    const [docResults, setDocResults] = useState<(Invoice | DeliveryNote)[]>([]);
    const [docLoading, setDocLoading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Invoice | DeliveryNote | null>(null);

   
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);


    const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
    const [reason, setReason] = useState("");
    const [noteText, setNoteText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const searchDocs = useCallback(async (q: string) => {
        if (!sourceType) return;
        setDocLoading(true);
        try {
            const res = sourceType === "invoice"
                ? await creditNoteService.searchInvoices(businessId, q)
                : await creditNoteService.searchDeliveryNotes(businessId, q);
            setDocResults(safeArray(res));
        } catch { toast.error("Search failed"); }
        finally { setDocLoading(false); }
    }, [businessId, sourceType]);
    useEffect(() => {
        if (step === "select_doc") searchDocs(docQuery);
    }, [step, docQuery, searchDocs]);
    const handleSelectDoc = (doc: Invoice | DeliveryNote) => {
        setSelectedDoc(doc);
        if (sourceType === "invoice") {
            
            const inv = doc as Invoice;
            const details = inv.quotes?.quote_details ?? [];
            setSelectedItems(details.map((d) => ({
                product_id: d.product_id,
                name: d.products.name,
                unit_price: Number(d.products.unit_price),
                max_quantity: d.quantity,
                quantity: d.quantity,
                unit: d.products.unit,
            })));
        }
        setStep("select_items");
    };
    const toggleItem = (d: QuoteDetail) => {
        setSelectedItems((prev) => {
            const exists = prev.find((i) => i.product_id === d.product_id);
            if (exists) return prev.filter((i) => i.product_id !== d.product_id);
            return [...prev, {
                product_id: d.product_id,
                name: d.products.name,
                unit_price: Number(d.products.unit_price),
                max_quantity: d.quantity,
                quantity: d.quantity,
                unit: d.products.unit,
            }];
        });
    };

    const updateQty = (product_id: number, qty: number) => {
        setSelectedItems((prev) =>
            prev.map((i) =>
                i.product_id === product_id
                    ? { ...i, quantity: Math.max(1, Math.min(qty, i.max_quantity)) }
                    : i,
            ),
        );
    };

    const selectAll = () => {
        const inv = selectedDoc as Invoice;
        setSelectedItems((inv.quotes?.quote_details ?? []).map((d) => ({
            product_id: d.product_id,
            name: d.products.name,
            unit_price: Number(d.products.unit_price),
            max_quantity: d.quantity,
            quantity: d.quantity,
            unit: d.products.unit,
        })));
    };

    const totalAmount =
        sourceType === "invoice"
            ? selectedItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)
            : (() => {
                const dn = selectedDoc as DeliveryNote;
                return (dn?.quotes?.quote_details ?? []).reduce(
                    (s, d) => s + d.quantity * Number(d.products.unit_price),
                    0,
                );
            })();

    const clientName =
        (sourceType === "invoice"
            ? (selectedDoc as Invoice)?.quotes?.clients?.name
            : (selectedDoc as DeliveryNote)?.quotes?.clients?.name) ?? "—";

    const handleSubmit = async () => {
        if (!reason.trim()) { toast.error("Reason is required"); return; }
        if (sourceType === "invoice" && selectedItems.length === 0) {
            toast.error("Select at least one product"); return;
        }
        try {
            setSubmitting(true);
            await creditNoteService.create(businessId, {
                return_date: returnDate,
                reason,
                note: noteText || undefined,
                invoice_id: sourceType === "invoice" ? (selectedDoc as Invoice).id : undefined,
                delivery_note_id: sourceType === "delivery_note" ? (selectedDoc as DeliveryNote).id : undefined,
                items: sourceType === "invoice"
                    ? selectedItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price }))
                    : undefined,
            });
            toast.success("Credit note created successfully!");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error creating credit note");
        } finally { setSubmitting(false); }
    };

    const quoteDetails =
        sourceType === "invoice"
            ? (selectedDoc as Invoice)?.quotes?.quote_details ?? []
            : (selectedDoc as DeliveryNote)?.quotes?.quote_details ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20 shrink-0">
                    <div>
                        <h2 className="text-base font-semibold">New Credit Note</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {step === "source" && "Step 1 — Choose source type"}
                            {step === "select_doc" && `Step 2 — Search ${sourceType === "invoice" ? "invoice" : "delivery note"}`}
                            {step === "select_items" && sourceType === "invoice" && "Step 3 — Select returned products"}
                            {step === "select_items" && sourceType === "delivery_note" && "Step 3 — Confirm return"}
                            {step === "details" && "Step 4 — Return details"}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

                    {/* STEP 1: Choose source */}
                    {step === "source" && (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => { setSourceType("invoice"); setStep("select_doc"); }}
                                className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all"
                            >
                                <div className="p-3 rounded-xl bg-sky-100"><FileText className="w-6 h-6 text-sky-600" /></div>
                                <div className="text-center">
                                    <p className="font-semibold text-sm">From Invoice</p>
                                    <p className="text-xs text-muted-foreground mt-1">Select specific products & quantities to return</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { setSourceType("delivery_note"); setStep("select_doc"); }}
                                className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all"
                            >
                                <div className="p-3 rounded-xl bg-amber-100"><Truck className="w-6 h-6 text-amber-600" /></div>
                                <div className="text-center">
                                    <p className="font-semibold text-sm">From Delivery Note</p>
                                    <p className="text-xs text-muted-foreground mt-1">Return all products from a delivery note</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* STEP 2: Search document */}
                    {step === "select_doc" && (
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    value={docQuery}
                                    onChange={(e) => setDocQuery(e.target.value)}
                                    placeholder={sourceType === "invoice" ? "Search invoice number..." : "Search delivery note number..."}
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                {docLoading && (
                                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Searching...
                                    </div>
                                )}
                                {!docLoading && docResults.length === 0 && (
                                    <p className="text-center py-8 text-sm text-muted-foreground">No results found</p>
                                )}
                                {!docLoading && docResults.map((doc) => {
                                    const isInvoice = sourceType === "invoice";
                                    const num = isInvoice ? (doc as Invoice).invoice_number : (doc as DeliveryNote).delivery_number;
                                    const client = isInvoice ? (doc as Invoice).quotes?.clients?.name : (doc as DeliveryNote).quotes?.clients?.name;
                                    const amount = isInvoice ? Number((doc as Invoice).total_amount) : undefined;
                                    return (
                                        <button
                                            key={doc.id}
                                            onClick={() => handleSelectDoc(doc)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                                        >
                                            <div>
                                                <p className="font-medium text-sm font-mono">{num}</p>
                                                <p className="text-xs text-muted-foreground">{client ?? "—"}</p>
                                            </div>
                                            {amount !== undefined && (
                                                <p className="text-sm font-semibold">{amount.toLocaleString("en")} DT</p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 3A: Select items from invoice */}
                    {step === "select_items" && sourceType === "invoice" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Select products to return</p>
                                <div className="flex gap-2">
                                    <button onClick={selectAll} className="text-xs text-primary hover:underline">Select all</button>
                                    <button onClick={() => setSelectedItems([])} className="text-xs text-muted-foreground hover:underline">Clear</button>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {quoteDetails.map((d) => {
                                    const selected = selectedItems.find((i) => i.product_id === d.product_id);
                                    return (
                                        <div
                                            key={d.product_id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                                            onClick={() => toggleItem(d)}
                                        >
                                            <div className="shrink-0">
                                                {selected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{d.products.name}</p>
                                                <p className="text-xs text-muted-foreground">{Number(d.products.unit_price).toLocaleString("en")} DT × max {d.quantity}</p>
                                            </div>
                                            {selected && (
                                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-xs hover:bg-muted"
                                                        onClick={() => updateQty(d.product_id, selected.quantity - 1)}
                                                    >−</button>
                                                    <input
                                                        type="number"
                                                        value={selected.quantity}
                                                        min={1}
                                                        max={d.quantity}
                                                        onChange={(e) => updateQty(d.product_id, Number(e.target.value))}
                                                        className="w-12 text-center text-sm border border-border rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                    <button
                                                        className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-xs hover:bg-muted"
                                                        onClick={() => updateQty(d.product_id, selected.quantity + 1)}
                                                    >+</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {selectedItems.length > 0 && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
                                    <span className="text-sm text-emerald-700">{selectedItems.length} product(s) selected</span>
                                    <span className="font-bold text-emerald-700">{totalAmount.toLocaleString("en")} DT</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3B: Confirm delivery note return */}
                    {step === "select_items" && sourceType === "delivery_note" && (
                        <div className="space-y-3">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                <p className="text-xs text-amber-700 font-medium">All products from this delivery note will be returned automatically.</p>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {quoteDetails.map((d) => (
                                    <div key={d.product_id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                                        <div>
                                            <p className="text-sm font-medium">{d.products.name}</p>
                                            <p className="text-xs text-muted-foreground">{d.quantity} × {Number(d.products.unit_price).toLocaleString("en")} DT</p>
                                        </div>
                                        <p className="text-sm font-semibold">{(d.quantity * Number(d.products.unit_price)).toLocaleString("en")} DT</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
                                <span className="text-sm text-emerald-700 font-medium">Total to credit</span>
                                <span className="font-bold text-emerald-700 text-lg">{totalAmount.toLocaleString("en")} DT</span>
                            </div>
                        </div>
                    )}

                   
                    {step === "details" && (
                        <div className="space-y-4">
                            {/* Summary card */}
                            <div className="bg-muted/40 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground">Client</p>
                                    <p className="font-semibold">{clientName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Source</p>
                                    <p className="font-semibold font-mono">
                                        {sourceType === "invoice"
                                            ? (selectedDoc as Invoice).invoice_number
                                            : (selectedDoc as DeliveryNote).delivery_number}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Products</p>
                                    <p className="font-semibold">
                                        {sourceType === "invoice" ? selectedItems.length : quoteDetails.length}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Credit Total</p>
                                    <p className="font-bold text-emerald-600">{totalAmount.toLocaleString("en")} DT</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Return Date *</label>
                                <input
                                    type="date"
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Reason *</label>
                                <input
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Defective product, Wrong item shipped..."
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Additional Notes</label>
                                <textarea
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    rows={3}
                                    placeholder="Any additional comments..."
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
                    <div>
                        {step !== "source" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (step === "select_doc") { setStep("source"); setDocResults([]); setDocQuery(""); }
                                    if (step === "select_items") setStep("select_doc");
                                    if (step === "details") setStep("select_items");
                                }}
                                className="text-muted-foreground"
                            >
                                ← Back
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">Cancel</Button>
                        {step === "select_items" && (
                            <Button
                                size="sm"
                                disabled={sourceType === "invoice" && selectedItems.length === 0}
                                onClick={() => setStep("details")}
                                className="rounded-xl gap-2"
                            >
                                Continue →
                            </Button>
                        )}
                        {step === "details" && (
                            <Button
                                size="sm"
                                disabled={submitting || !reason.trim()}
                                onClick={handleSubmit}
                                className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
                            >
                                {submitting ? (
                                    <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Creating...</>
                                ) : (
                                    <><RefreshCw className="w-3.5 h-3.5" />Create Credit Note</>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────

function DeleteModal({
    creditNote,
    businessId,
    onClose,
    onSuccess,
}: {
    creditNote: CreditNote;
    businessId: number;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        try {
            setLoading(true);
            await creditNoteService.remove(businessId, creditNote.id);
            toast.success("Credit note cancelled.");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error cancelling credit note");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                <div className="px-6 py-5 space-y-3">
                    <div className="p-3 w-fit rounded-xl bg-rose-100"><Trash2 className="w-5 h-5 text-rose-600" /></div>
                    <h2 className="text-base font-semibold">Cancel Credit Note</h2>
                    <p className="text-sm text-muted-foreground">
                        This will cancel <span className="font-semibold text-foreground">{creditNote.credit_number}</span>.
                        This action cannot be undone.
                    </p>
                </div>
                <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">Keep</Button>
                    <Button size="sm" disabled={loading} onClick={handleDelete}
                        className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white gap-2">
                        {loading ? "Cancelling..." : <><Trash2 className="w-3.5 h-3.5" />Cancel Note</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function CreditNotes() {
    const { activeBusiness } = useBusiness();
    const businessId = activeBusiness?.id;

    const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreate, setShowCreate] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<CreditNote | null>(null);

    useEffect(() => {
        if (businessId) fetchCreditNotes();
    }, [businessId]);

    const fetchCreditNotes = async () => {
        try {
            setLoading(true);
            const res = await creditNoteService.getAll(businessId!);
            setCreditNotes(safeArray(res));
        } catch (err) {
            console.error(err);
            toast.error("Failed to load credit notes");
        } finally { setLoading(false); }
    };

    const q = searchQuery.toLowerCase();
    const filtered = creditNotes.filter((cn) =>
        cn.credit_number?.toLowerCase().includes(q) ||
        cn.clients?.name?.toLowerCase().includes(q) ||
        cn.reason?.toLowerCase().includes(q) ||
        cn.invoices?.invoice_number?.toLowerCase().includes(q) ||
        cn.delivery_notes?.delivery_number?.toLowerCase().includes(q)
    );

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const total = creditNotes.length;
    const totalVal = creditNotes
        .filter((c) => c.status !== "CANCELLED")
        .reduce((s, c) => s + Number(c.total_amount), 0);

    return (
        <div className="space-y-8">

            {showCreate && (
                <CreateCreditNoteModal
                    businessId={businessId!}
                    onClose={() => setShowCreate(false)}
                    onSuccess={fetchCreditNotes}
                />
            )}

            {deleteTarget && (
                <DeleteModal
                    creditNote={deleteTarget}
                    businessId={businessId!}
                    onClose={() => setDeleteTarget(null)}
                    onSuccess={fetchCreditNotes}
                />
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Credit Notes</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage product returns and credit notes</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-xl">
                    <Plus className="w-4 h-4" />New Credit Note
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Total</p>
                                <h2 className="text-4xl font-bold mt-2 tabular-nums">{total}</h2>
                                <p className="text-xs text-slate-400 mt-2">All credit notes</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/10"><RefreshCw className="h-5 w-5 text-slate-200" /></div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5" />
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-700 text-white overflow-hidden relative">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-emerald-100 uppercase tracking-widest">Total Value</p>
                                <h2 className="text-3xl font-bold mt-2 tabular-nums">{totalVal.toFixed(0)}<span className="text-base font-normal ml-1">DT</span></h2>
                                <p className="text-xs text-emerald-200 mt-2">Active credit notes</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/20"><FileText className="h-5 w-5 text-white" /></div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-2xl shadow-sm border border-border/60">
                <CardContent className="pt-5 pb-5">
                    <SearchInput
                        placeholder="Search by number, client, reason..."
                        value={searchQuery}
                        onChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
                    />
                </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm border border-border/60 overflow-hidden">
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/40">
                                {["#", "Credit #", "Client", "Source", "Return Date", "Amount", "Reason", "Actions"].map((h) => (
                                    <th key={h} className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan={9} className="p-12 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Loading...
                                    </div>
                                </td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={9} className="p-12 text-center text-muted-foreground text-sm">No credit notes found.</td></tr>
                            ) : paginated.map((cn, i) => (
                                <tr key={cn.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="p-4 text-sm text-muted-foreground font-mono">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                                    <td className="p-4 text-sm font-medium font-mono">{cn.credit_number}</td>
                                    <td className="p-4 text-sm font-medium">{cn.clients?.name ?? "—"}</td>
                                    <td className="p-4">
                                        {cn.invoices ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-sky-600 font-medium">
                                                <FileText className="w-3 h-3" />{cn.invoices.invoice_number}
                                            </span>
                                        ) : cn.delivery_notes ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                                                <Truck className="w-3 h-3" />{cn.delivery_notes.delivery_number}
                                            </span>
                                        ) : <span className="text-xs text-muted-foreground">—</span>}
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {new Date(cn.return_date).toLocaleDateString("en-GB")}
                                    </td>
                                    <td className="p-4 text-sm font-semibold tabular-nums">
                                        {Number(cn.total_amount).toLocaleString("en")} DT
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground max-w-[160px] truncate" title={cn.reason}>
                                        {cn.reason}
                                    </td>

                                    <td className="p-4">
                                        {cn.status !== "CANCELLED" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setDeleteTarget(cn)}
                                                className="rounded-lg h-8 w-8 p-0 border-border/70 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                                                title="Cancel credit note"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        {cn.status === "CANCELLED" && (
                                            <span className="text-xs text-muted-foreground italic">Cancelled</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
                            <div className="flex gap-1">
                                <Button size="sm" variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="w-8 h-8 p-0 rounded-lg">
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <Button key={p} size="sm" variant={p === currentPage ? "default" : "ghost"} onClick={() => setCurrentPage(p)}
                                        className={`w-8 h-8 p-0 rounded-lg text-xs ${p === currentPage ? "shadow-sm" : "text-muted-foreground"}`}>{p}</Button>
                                ))}
                                <Button size="sm" variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="w-8 h-8 p-0 rounded-lg">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
