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
    new Date().toLocaleDateString("fr-CA", { timeZone: "Africa/Tunis" }) // date locale Tunis YYYY-MM-DD
  );
  const [dueDate, setDueDate] = useState("");
  const [client, setClient] = useState(null);

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
    return { subtotal, tax, total: subtotal + tax };
  };

  const totals = calculateTotals();

  const handleSendInvoice = async () => {
    if (!dueDate) {
      toast.error("La date d'échéance est obligatoire !");
      return;
    }
    const nowTunis = new Date().toLocaleDateString("fr-CA", { timeZone: "Africa/Tunis" });
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
        quote_id: +quoteId,
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
    <div className="space-y-8 max-w-6xl mx-auto py-6">
  
      <div className="flex items-center gap-4 mb-4">
        <Link to="/app/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Nouvelle facture</h1>
          <p className="text-gray-500 mt-1">Générée à partir du devis</p>
        </div>
      </div>

    
      <Card className="shadow-md rounded-xl border border-gray-200">
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent>
          {client ? (
            <div className="space-y-1">
              <p className="font-semibold text-lg">{client.name}</p>
              <p className="text-gray-500">{client.email}</p>
            </div>
          ) : (
            <p className="text-gray-400">Aucun client sélectionné</p>
          )}
        </CardContent>
      </Card>

   
      <Card className="shadow-md rounded-xl border border-gray-200">
        <CardHeader>
          <CardTitle>Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date facture</Label>
            <Input type="date" value={invoiceDate} disabled className="bg-gray-100" />
          </div>
          <div>
            <Label>Date échéance</Label>
            <Input
              type="date"
              value={dueDate}
              min={new Date().toLocaleDateString("fr-CA", { timeZone: "Africa/Tunis" })}
              required
              onChange={(e) => setDueDate(e.target.value)}
              className="border-blue-400 focus:border-blue-500 focus:ring focus:ring-blue-100"
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
          <CardTitle>Articles</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-200">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`flex justify-between py-2 px-2 ${
                index % 2 === 0 ? "bg-gray-50" : ""
              }`}
            >
              <span>{item.description}</span>
              <span className="font-medium">{calculateItemTotal(item).toFixed(2)} DT</span>
            </div>
          ))}
        </CardContent>
      </Card>

     
      <Card className="shadow-md rounded-xl border border-gray-200">
        <CardContent className="space-y-2">
          <div className="flex justify-between text-gray-700">
            <span>Sous-total</span>
            <span>{totals.subtotal.toFixed(2)} DT</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>TVA</span>
            <span>{totals.tax.toFixed(2)} DT</span>
          </div>
          <div className="flex justify-between font-bold text-xl text-blue-600 border-t pt-2 mt-2">
            <span>Total</span>
            <span>{totals.total.toFixed(2)} DT</span>
          </div>
        </CardContent>
      </Card>

   
      <Button
        onClick={handleSendInvoice}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 flex items-center justify-center gap-2"
      >
        <Send className="h-5 w-5" />
        Valider et envoyer
      </Button>
    </div>
  );
}