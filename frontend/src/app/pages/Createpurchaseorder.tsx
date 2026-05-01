import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Plus, Trash2, Save, Mic } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { purchaseOrderclientService } from "../services/purchaseOrdersClient";
import { productsService } from "@/app/services/productsService";
import { clientService } from "@/app/services/clientService";
import { useBusiness } from "@/app/context/BusinessContext";

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

export default function CreatePurchaseOrder() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id;
  const navigate = useNavigate();

  const [clientId, setClientId]   = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [expirationDate, setExpirationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [items, setItems] = useState<OrderItem[]>([
    { product_id: "", quantity: 1, unit_price: 0, tax_rate: 0 },
  ]);

  const [clients, setClients]   = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!businessId) return;
    const load = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          productsService.getProducts(businessId),
          clientService.getClients(),
        ]);
        setProducts(pRes.data);
        setClients(cRes.data);
      } catch {
        toast.error("Failed to load data");
      }
    };
    load();
  }, [businessId]);

  const totalHT = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const totalAmount = items.reduce((s, i) => {
    const ht = i.quantity * i.unit_price;
    return s + ht + ht * (i.tax_rate / 100);
  }, 0);

  const handleAddItem = () =>
    setItems([...items, { product_id: "", quantity: 1, unit_price: 0, tax_rate: 0 }]);

  const handleRemoveItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  const handleItemChange = (idx: number, field: keyof OrderItem, value: any) => {
    const next = [...items];
    if (field === "product_id") {
      const p = products.find((p) => p.id.toString() === value);
      next[idx].product_id = value;
      next[idx].unit_price = p ? Number(p.unit_price) : 0;
      next[idx].tax_rate   = p ? Number(p.tax_rate || 0) : 0;
    } else {
      (next[idx] as any)[field] = value;
    }
    setItems(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return toast.warning("Please select a client");
    if (items.some((i) => !i.product_id || i.quantity <= 0))
      return toast.warning("Please fill in all line items correctly");

    const today = new Date().toISOString().split("T")[0];
    if (expirationDate < today)
      return toast.error("Expiration date must be after today");

    setLoading(true);
    try {
      await purchaseOrderclientService.create(businessId!, {
        client_id:       Number(clientId),
        issue_date:      issueDate,
        expiration_date: expirationDate,
        total_amount:    totalAmount,
        status:          "draft",
        details: items.map((i) => ({
          product_id: Number(i.product_id),
          quantity:   Number(i.quantity),
        })),
      });
      toast.success("Purchase order created!");
      navigate("/app/purchase-orders-client");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error creating purchase order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/purchase-orders-client">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">New Purchase Order</h1>
            <p className="text-muted-foreground mt-1">Create a client purchase order</p>
          </div>
        </div>

        {/* ── Voice button ── */}
        <Link to="/app/purchase-orders-client/voice">
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2 border-dashed hover:border-solid transition-all group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <Mic className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Create by Voice</span>
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── General info ── */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">General Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={setClientId} required>
                <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Issue Date *</Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Expiration Date *</Label>
              <Input
                type="date"
                value={expirationDate}
                min={new Date().toLocaleDateString("fr-CA", { timeZone: "Africa/Tunis" })}
                onChange={(e) => setExpirationDate(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Line items ── */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Order Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" /> Add Line
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6">
                    <Select
                      value={item.product_id}
                      onValueChange={(val) => handleItemChange(idx, "product_id", val)}
                    >
                      <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                      className="text-center"
                    />
                  </div>
                  <div className="col-span-2 text-right text-sm">
                    {item.unit_price.toLocaleString("en-US")} DT
                  </div>
                  <div className="col-span-1 text-right text-sm font-medium">
                    {(item.quantity * item.unit_price).toLocaleString("en-US")} DT
                  </div>
                  <div className="col-span-1 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <div className="w-72 bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Subtotal excl. Tax:</span>
                  <span>{totalHT.toLocaleString("en-US", { minimumFractionDigits: 3 })} DT</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground border-b pb-2">
                  <span>VAT:</span>
                  <span>{(totalAmount - totalHT).toLocaleString("en-US", { minimumFractionDigits: 3 })} DT</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-1">
                  <span>Total incl. Tax:</span>
                  <span className="text-primary">{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 3 })} DT</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-4">
          <Link to="/app/purchase-orders-client">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Save Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}