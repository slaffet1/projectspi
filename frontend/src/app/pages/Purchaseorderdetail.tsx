import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Download, Send, Trash, FileText,
  CheckCircle, XCircle, ReceiptText, Pencil, Save, X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { Link, useNavigate, useParams } from "react-router";
import { purchaseOrderclientService } from "../services/purchaseOrdersClient";
import { invoiceService } from "@/app/services/invoiceService";
import { productsService } from "@/app/services/productsService";
import { useBusiness } from "@/app/context/BusinessContext";
import { Separator } from "@/app/components/ui/separator";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface EditItem {
  id?: number;
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}


export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const { activeBusiness } = useBusiness();
  const navigate = useNavigate();

  const [order, setOrder]         = useState<any>(null);
  const [sending, setSending]     = useState(false);
  const [converting, setConverting] = useState(false);
  const [downloading, setDownloading] = useState(false);


  const [editMode, setEditMode]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [editIssueDate, setEditIssueDate]           = useState("");
  const [editExpirationDate, setEditExpirationDate] = useState("");
  const [editDeliveryDate, setEditDeliveryDate]     = useState("");
  const [editItems, setEditItems]   = useState<EditItem[]>([]);
  const [products, setProducts]     = useState<any[]>([]);

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate]     = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [banks, setBanks]   = useState<any[]>([]);
  const [bankId, setBankId] = useState<number | undefined>();

  const pdfRef = useRef<HTMLDivElement>(null);

  

  useEffect(() => {
    if (id && activeBusiness?.id) {
      fetchOrder();
      fetchBanks();
      productsService.getProducts(activeBusiness.id).then((r) => setProducts(r.data || []));
    }
  }, [id, activeBusiness]);

  const fetchOrder = async () => {
    try {
      const res = await purchaseOrderclientService.getOne(activeBusiness.id, +id!);
      setOrder(res.data);
    } catch {
      toast.error("Failed to load purchase order");
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await invoiceService.getBanksByBusiness(activeBusiness.id);
      setBanks(res.data || []);
    } catch {}
  };

 

  const enterEditMode = () => {
    if (!order) return;
    setEditIssueDate(order.issue_date?.split("T")[0] || "");
    setEditExpirationDate(order.expiration_date?.split("T")[0] || "");
    setEditDeliveryDate(order.delivery_date?.split("T")[0] || "");
    setEditItems(
      (order.order_details || []).map((i: any) => ({
        id:         i.id,
        product_id: String(i.product_id || i.products?.id || ""),
        quantity:   i.quantity,
        unit_price: Number(i.products?.unit_price || 0),
        tax_rate:   Number(i.products?.tax_rate || 0),
      }))
    );
    setEditMode(true);
  };

  const handleEditItemChange = (idx: number, field: keyof EditItem, value: any) => {
    const next = [...editItems];
    if (field === "product_id") {
      const p = products.find((p) => p.id.toString() === value);
      next[idx].product_id = value;
      next[idx].unit_price = p ? Number(p.unit_price) : 0;
      next[idx].tax_rate   = p ? Number(p.tax_rate || 0) : 0;
    } else {
      (next[idx] as any)[field] = value;
    }
    setEditItems(next);
  };

  const editSubtotal = editItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const editTotal    = editItems.reduce((s, i) => {
    const ht = i.quantity * i.unit_price;
    return s + ht + ht * (i.tax_rate / 100);
  }, 0);

  const handleSaveEdit = async () => {
    if (editItems.some((i) => !i.product_id || i.quantity <= 0))
      return toast.warning("Please fill in all line items correctly");
    setSaving(true);
    try {
      await purchaseOrderclientService.update(activeBusiness.id, +id!, {
        issue_date:      editIssueDate,
        expiration_date: editExpirationDate,
        delivery_date:   editDeliveryDate || undefined,
        total_amount:    editTotal,
        details: editItems.map((i) => ({
          product_id: Number(i.product_id),
          quantity:   Number(i.quantity),
        })),
      });
      toast.success("Purchase order updated!");
      setEditMode(false);
      fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  // ── PDF (frontend only — captures the document card) ─────────────────────

  const downloadPDF = async () => {
    if (!pdfRef.current || !order) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth  = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio      = canvas.height / canvas.width;
      const imgWidth   = pageWidth;
      const imgHeight  = imgWidth * ratio;

      let yPos = 0;
      let remaining = imgHeight;
      while (remaining > 0) {
        pdf.addImage(imgData, "PNG", 0, -yPos, imgWidth, imgHeight);
        remaining -= pageHeight;
        yPos      += pageHeight;
        if (remaining > 0) pdf.addPage();
      }

      pdf.save(`purchase-order-${order.order_number}.pdf`);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

 

  const sendEmail = async () => {
    setSending(true);
    try {
      await purchaseOrderclientService.sendByEmail(activeBusiness.id, +id!);
      toast.success("Purchase order sent by email with accept/reject links!");
      fetchOrder();
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };



  const handleConvert = async () => {
  const today = new Date().toISOString().split("T")[0];

  if (!issueDate) {
    toast.error("Issue date is required");
    return;
  }



  if (!dueDate) {
    toast.error("Due date is required");
    return;
  }


  if (dueDate < today) {
    toast.error("Due date must be today or later");
    return;
  }

  if (!bankId) {
    toast.error("Please select a bank");
    return;
  }

  setConverting(true);

  try {
    const res = await purchaseOrderclientService.convertToInvoice(
      activeBusiness.id,
      +id!,
      {
        issue_date: issueDate,
        due_date: dueDate,
        bank_id: bankId,
      }
    );

    toast.success("Invoice created successfully!");
    setShowConvertModal(false);
    navigate(`/app/invoices/${res.data.id}`);
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Failed to convert");
  } finally {
    setConverting(false);
  }
};;

  // ── Delete ────────────────────────────────────────────────────────────────

  const deleteOrder = () => {
    toast(
      <div className="flex flex-col gap-2">
        <span>Delete this purchase order?</span>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="destructive" onClick={async () => {
            try {
              await purchaseOrderclientService.remove(activeBusiness.id, +id!);
              toast.success("Purchase order deleted!");
              navigate("/app/purchase-orders-client");
            } catch { toast.error("Failed to delete"); }
          }}>Delete</Button>
          <Button size="sm" variant="secondary" onClick={() => toast.dismiss()}>Cancel</Button>
        </div>
      </div>
    );
  };



  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      draft:     "bg-slate-50 text-slate-600 border border-slate-200",
      sent:      "bg-sky-50 text-sky-700 border border-sky-200",
      confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      invoiced:  "bg-violet-50 text-violet-700 border border-violet-200",
      cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
    };
    const labels: Record<string, string> = {
      draft: "Draft", sent: "Sent", confirmed: "Confirmed", invoiced: "Invoiced", cancelled: "Cancelled",
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${styles[status ?? ""] || ""}`}>
        {labels[status ?? ""] || status}
      </span>
    );
  };

  if (!order) return null;

  const client   = order.clients;
  const items    = order.order_details || [];
  const subtotal = items.reduce((s: number, i: any) => s + i.quantity * Number(i.products?.unit_price || 0), 0);
  const tax      = items.reduce((s: number, i: any) => {
    const ht = i.quantity * Number(i.products?.unit_price || 0);
    return s + ht * (Number(i.products?.tax_rate || 0) / 100);
  }, 0);
  const total = subtotal + tax;


  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">

      
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-violet-600" /> Convert to Invoice
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Issue Date</label>
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
              </div>
              {banks.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Bank Account (optional)</label>
                  <select value={bankId ?? ""} onChange={(e) => setBankId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
                    <option value="">No bank</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>{b.bank_name} — {b.account_number}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleConvert} disabled={converting}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
                {converting ? "Converting..." : "Convert"}
              </Button>
              <Button variant="ghost" onClick={() => setShowConvertModal(false)} className="flex-1 rounded-xl">Cancel</Button>
            </div>
          </div>
        </div>
      )}

  
      <div className="flex items-center gap-4">
        <Link to="/app/purchase-orders-client">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{order.order_number}</h1>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            {client?.name} · {new Date(order.issue_date).toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>

      
      <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="flex divide-x divide-border/50 flex-wrap">

            <button onClick={downloadPDF} disabled={downloading}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4 hover:bg-violet-50 transition-colors group min-w-[100px]">
              <div className="p-2.5 rounded-xl bg-violet-100 group-hover:bg-violet-200 transition-colors">
                <Download className="h-4 w-4 text-violet-600" />
              </div>
              <span className="text-xs font-medium text-violet-600">{downloading ? "Generating..." : "Download PDF"}</span>
            </button>

            <button onClick={sendEmail} disabled={sending || order.status === "sent" || order.status === "confirmed" || order.status === "invoiced" || order.status === "cancelled"}
              className={`flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4 transition-colors group min-w-[100px]
                ${["sent","confirmed","invoiced","cancelled"].includes(order.status) ? "opacity-50 cursor-not-allowed" : "hover:bg-sky-50"}`}>
              <div className={`p-2.5 rounded-xl transition-colors ${["sent","confirmed"].includes(order.status) ? "bg-sky-100" : "bg-sky-100 group-hover:bg-sky-200"}`}>
                <Send className="h-4 w-4 text-sky-600" />
              </div>
              <span className="text-xs font-medium text-sky-600">
                {sending ? "Sending..." : order.status === "sent" ? "Already Sent" : "Send by Email"}
              </span>
            </button>

   
            {order.status === "draft" && !editMode && (
              <button onClick={enterEditMode}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4 hover:bg-amber-50 transition-colors group min-w-[100px]">
                <div className="p-2.5 rounded-xl bg-amber-100 group-hover:bg-amber-200 transition-colors">
                  <Pencil className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-amber-600">Edit Order</span>
              </button>
            )}

            
            {(order.status === "confirmed") ||(order.status === "draft") || (order.status === "sent")   && (
              <button onClick={() => setShowConvertModal(true)}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4 hover:bg-emerald-50 transition-colors group min-w-[100px]">
                <div className="p-2.5 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <ReceiptText className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-emerald-600">Convert to Invoice</span>
              </button>
            )}

            {["draft", "cancelled"].includes(order.status) && !editMode && (
              <button onClick={deleteOrder}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4 hover:bg-rose-50 transition-colors group min-w-[100px]">
                <div className="p-2.5 rounded-xl bg-rose-100 group-hover:bg-rose-200 transition-colors">
                  <Trash className="h-4 w-4 text-rose-600" />
                </div>
                <span className="text-xs font-medium text-rose-600">Delete</span>
              </button>
            )}

          </div>
        </CardContent>
      </Card>

      {order.status === "invoiced" && order.invoices?.[0] && (
        <Card className="border-violet-200 bg-violet-50 rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-violet-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-violet-800">This order has been invoiced</p>
              <p className="text-xs text-violet-600">{order.invoices[0].invoice_number}</p>
            </div>
            <Link to={`/app/invoices/${order.invoices[0].id}`}>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs">
                View Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

     
      {editMode && (
        <Card className="border-amber-200 rounded-2xl shadow-sm">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-amber-700 flex items-center gap-2">
                <Pencil className="h-4 w-4" /> Edit Purchase Order
              </h2>
              <button onClick={() => setEditMode(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

      
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Issue Date</Label>
                <Input type="date" value={editIssueDate} onChange={(e) => setEditIssueDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expiration Date</Label>
                <Input type="date" value={editExpirationDate} onChange={(e) => setEditExpirationDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Delivery Date (optional)</Label>
                <Input type="date" value={editDeliveryDate} onChange={(e) => setEditDeliveryDate(e.target.value)} />
              </div>
            </div>

      
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Line Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={() =>
                  setEditItems([...editItems, { product_id: "", quantity: 1, unit_price: 0, tax_rate: 0 }])
                }>+ Add Line</Button>
              </div>

              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-1 border-b">
                <div className="col-span-5">Product</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Line Total</div>
                <div className="col-span-1" />
              </div>

              {editItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Select value={item.product_id} onValueChange={(v) => handleEditItemChange(idx, "product_id", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min="1" value={item.quantity} className="h-8 text-xs text-center"
                      onChange={(e) => handleEditItemChange(idx, "quantity", Number(e.target.value))} />
                  </div>
                  <div className="col-span-2 text-right text-xs text-muted-foreground">
                    {item.unit_price.toFixed(2)} DT
                  </div>
                  <div className="col-span-2 text-right text-xs font-medium">
                    {(item.quantity * item.unit_price).toFixed(2)} DT
                  </div>
                  <div className="col-span-1 text-center">
                    <button onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                      disabled={editItems.length === 1} className="text-rose-400 hover:text-rose-600 disabled:opacity-30">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-2">
                <div className="text-sm text-right space-y-1">
                  <div className="text-muted-foreground">Subtotal: <span className="font-medium text-foreground">{editSubtotal.toFixed(3)} DT</span></div>
                  <div className="text-lg font-bold">Total: {editTotal.toFixed(3)} DT</div>
                </div>
              </div>
            </div>

         
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving}
                className="bg-amber-600 hover:bg-amber-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      
      <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
        <div
          ref={pdfRef}
          style={{ fontFamily: "Arial, sans-serif", color: "#000", backgroundColor: "#fff", padding: "32px" }}
        >
     
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "bold", margin: 0 }}>
                {client?.businesses?.name || activeBusiness?.name}
              </h2>
              <p style={{ color: "#888", margin: "4px 0 0", fontSize: "13px" }}>Purchase Order</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <h3 style={{ fontSize: "22px", fontWeight: "bold", margin: 0 }}>PURCHASE ORDER</h3>
              <p style={{ color: "#888", margin: "4px 0 0", fontSize: "13px" }}>#{order.order_number}</p>
              <p style={{ color: "#888", margin: "2px 0 0", fontSize: "13px" }}>
                {new Date(order.issue_date).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>

          {/* Client Info */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "28px" }}>
            <div>
              <p style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px" }}>Ordered by</p>
              <p style={{ fontWeight: "600", fontSize: "15px", margin: 0 }}>{client?.name}</p>
              <p style={{ color: "#4b5563", fontSize: "13px", margin: "2px 0 0" }}>{client?.email}</p>
              {client?.phone && <p style={{ color: "#4b5563", fontSize: "13px", margin: "2px 0 0" }}>{client?.phone}</p>}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px" }}>Expiration</p>
              <p style={{ fontWeight: "600", fontSize: "14px", margin: 0 }}>
                {new Date(order.expiration_date).toLocaleDateString("en-GB")}
              </p>
              {order.delivery_date && (
                <>
                  <p style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: "12px 0 4px" }}>Delivery Date</p>
                  <p style={{ fontWeight: "600", fontSize: "14px", margin: 0 }}>
                    {new Date(order.delivery_date).toLocaleDateString("en-GB")}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "28px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ padding: "10px 12px", border: "1px solid #ddd", textAlign: "left", fontSize: "13px" }}>Product</th>
                <th style={{ padding: "10px 12px", border: "1px solid #ddd", textAlign: "right", fontSize: "13px" }}>Qty</th>
                <th style={{ padding: "10px 12px", border: "1px solid #ddd", textAlign: "right", fontSize: "13px" }}>Unit Price</th>
                <th style={{ padding: "10px 12px", border: "1px solid #ddd", textAlign: "right", fontSize: "13px" }}>VAT</th>
                <th style={{ padding: "10px 12px", border: "1px solid #ddd", textAlign: "right", fontSize: "13px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i: any) => {
                const lineTotal = i.quantity * Number(i.products?.unit_price || 0) * (1 + Number(i.products?.tax_rate || 0) / 100);
                return (
                  <tr key={i.id}>
                    <td style={{ padding: "10px 12px", border: "1px solid #ddd", fontSize: "13px" }}>{i.products?.name}</td>
                    <td style={{ padding: "10px 12px", border: "1px solid #ddd", textAlign: "right", fontSize: "13px" }}>{i.quantity}</td>
                    <td style={{ padding: "10px 12px", border: "1px solid #ddd", textAlign: "right", fontSize: "13px" }}>{Number(i.products?.unit_price || 0).toFixed(2)} DT</td>
                    <td style={{ padding: "10px 12px", border: "1px solid #ddd", textAlign: "right", fontSize: "13px" }}>{Number(i.products?.tax_rate || 0)}%</td>
                    <td style={{ padding: "10px 12px", border: "1px solid #ddd", textAlign: "right", fontWeight: "600", fontSize: "13px" }}>{lineTotal.toFixed(2)} DT</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "280px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "14px" }}>
                <span style={{ color: "#888" }}>Subtotal</span>
                <span>{subtotal.toLocaleString("fr-TN")} DT</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px" }}>
                <span style={{ color: "#888" }}>VAT</span>
                <span>{tax.toLocaleString("fr-TN")} DT</span>
              </div>
              <hr style={{ margin: "8px 0", borderColor: "#ddd" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold" }}>
                <span>Total</span>
                <span>{total.toLocaleString("fr-TN")} DT</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "48px", textAlign: "center", fontSize: "12px", color: "#888" }}>
            Thank you for your order — {client?.businesses?.name || activeBusiness?.name}
          </div>
        </div>
      </Card>
    </div>
  );
}