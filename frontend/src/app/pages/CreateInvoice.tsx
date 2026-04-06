import { useEffect, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router";
import { invoiceService } from "@/app/services/invoiceService";
import { quoteService } from "@/app/services/quoteService";
import { useBusiness } from "@/app/context/BusinessContext";
import { toast } from "react-toastify";

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const quoteId = params.get("quoteId");
const [banks, setBanks] = useState([]);
const [selectedBank, setSelectedBank] = useState("");
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id;

  const [items, setItems] = useState([]);
  const [invoiceDate] = useState(
    new Date().toLocaleDateString("fr-CA", { timeZone: "Africa/Tunis" })
  );
  const [dueDate, setDueDate] = useState("");
  const [client, setClient] = useState(null);

  const [discount, setDiscount] = useState("");

  useEffect(() => {
    if (quoteId && businessId) fetchQuote();
  }, [quoteId, businessId]);

  const fetchQuote = async () => {
    try {
      const res = await quoteService.getOne(businessId, +quoteId);
      const q = res.data;

      setClient(q.clients);

      const mapped = q.quote_details.map((d) => ({
        id: String(d.id),
        description: d.products?.name,
        quantity: d.quantity,
        unitPrice: Number(d.products?.unit_price),
        taxRate: Number(d.products?.tax_rate),
      }));

      setItems(mapped);
    } catch {
      toast.error("Erreur chargement devis");
    }
  };
useEffect(() => {
  if (businessId) fetchBanks();
}, [businessId]);

const fetchBanks = async () => {
  try {
    const res = await invoiceService.getBanksByBusiness(businessId);
    setBanks(res.data);
  } catch {
    toast.error("Erreur chargement banques");
  }
};
  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unitPrice;
    const tax = subtotal * (item.taxRate / 100);
    return subtotal + tax;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const tax = items.reduce(
      (sum, item) =>
        sum + item.quantity * item.unitPrice * (item.taxRate / 100),
      0
    );

    const total = subtotal + tax;
    const discountValue = parseFloat(discount) || 0;
    const finalTotal = Math.max(total - discountValue, 0);

    return { subtotal, tax, total, finalTotal, discountValue };
  };

  const totals = calculateTotals();

  const handleSendInvoice = async () => {
    if (!dueDate) {
      toast.error("La date d'échéance est obligatoire !");
      return;
    }

    const nowTunis = new Date().toLocaleDateString("fr-CA", {
      timeZone: "Africa/Tunis",
    });

    if (new Date(dueDate) < new Date(nowTunis)) {
      toast.error("La date d'échéance doit être supérieure à aujourd'hui !");
      return;
    }
    
if (!selectedBank) {
  toast.error("Veuillez choisir une banque");
  return;
}
    try {
      const res = await invoiceService.create(businessId, {
        quote_id: Number(quoteId),
        issue_date: invoiceDate,
        due_date: dueDate,
         bank_id: selectedBank ? Number(selectedBank) : null,
      });

      toast.success("Facture créée !");
      navigate(`/app/invoices/${res.data.id}`);
    } catch {
      toast.error("Erreur création facture");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/app/invoices">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Create Invoice</h1>
      </div>

      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent>
          {client ? (
            <div className="space-y-1">
              <p className="text-lg font-semibold">{client.name}</p>
              <p className="text-gray-500">{client.email}</p>
            </div>
          ) : (
            <p className="text-gray-400">No client selected</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader>
          <CardTitle>Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <Label>Invoice Date</Label>
            <Input value={invoiceDate} disabled className="bg-gray-100 mt-1" />
          </div>
          <div>
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              min={new Date().toLocaleDateString("fr-CA", {
                timeZone: "Africa/Tunis",
              })}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>
<div>
  <Label>Choisir une banque</Label>
  <select
    value={selectedBank}
    onChange={(e) => setSelectedBank(e.target.value)}
    className="w-full border rounded p-2"
    required
  >
    <option value="">-- Sélectionner une banque --</option>
    {banks.map((bank) => (
      <option key={bank.id} value={bank.id}>
        {bank.bank_name} ({bank.account_number})
      </option>
    ))}
  </select>
</div>
   
      <Card className="shadow-md rounded-xl border border-gray-200">
        <CardHeader>
          <CardTitle>Bank</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="w-full h-11 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
          >
            <option value="">Select a bank</option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.bank_name} ({bank.account_number})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`flex justify-between items-center px-4 py-3 rounded-lg ${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              }`}
            >
              <span className="text-gray-700">{item.description}</span>
              <span className="font-semibold text-gray-900">
                {(
                  item.quantity *
                  item.unitPrice *
                  (1 + item.taxRate / 100)
                ).toFixed(2)}{" "}
                DT
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0">
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Sous-total</span>
            <span>{totals.subtotal.toFixed(2)} DT</span>
          </div>

          <div className="flex justify-between">
            <span>TVA</span>
            <span>{totals.tax.toFixed(2)} DT</span>
          </div>

          <div className="flex justify-between items-center text-red-500">
            <span>Discount</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-28 text-right"
                placeholder="0"
              />
              <span>DT</span>
            </div>
          </div>

          <div className="flex justify-between text-lg font-bold border-t pt-3">
            <span>Total</span>
            <span className="text-blue-600">
              {totals.finalTotal.toFixed(2)} DT
            </span>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSendInvoice}
        className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-2"
      >
        <Send className="h-5 w-5" />
        Create & Send Invoice
      </Button>
    </div>
  );
}