import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Send, Trash, Edit, Check, X, CalendarClock } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Link, useParams } from "react-router";
import { invoiceService } from "@/app/services/invoiceService";
import { useBusiness } from "@/app/context/BusinessContext";
import { Separator } from "@/app/components/ui/separator";
import toast, { Toaster } from "react-hot-toast";

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

  useEffect(() => {
    if (id && activeBusiness?.id) fetchInvoice();
  }, [id, activeBusiness]);

  const fetchInvoice = async () => {
    try {
      const res = await invoiceService.getOne(activeBusiness.id, +id);
      setInvoice(res.data);
      setDueDateInput(res.data?.due_date?.split("T")[0] || "");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger la facture.");
    }
  };

  const downloadPDF = async () => {
    if (!invoice) return toast.error("Facture non chargée");
    const element = document.getElementById("invoice");
    if (!element) return toast.error("Facture introuvable");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      // Fix: replace all oklch colors with rgb equivalents so html2canvas can parse them
      const allElements = element.querySelectorAll("*");
      const overrides: Array<{ el: HTMLElement; props: Record<string, string> }> = [];

      const fixOklch = (el: HTMLElement) => {
        const computed = window.getComputedStyle(el);
        const props: Record<string, string> = {};
        const toFix = ["color", "background-color", "border-color", "border-top-color", "border-bottom-color", "border-left-color", "border-right-color"];
        toFix.forEach((prop) => {
          const val = computed.getPropertyValue(prop);
          if (val && val.includes("oklch")) {
            props[prop] = "#000000";
          }
        });
        if (Object.keys(props).length > 0) {
          const original: Record<string, string> = {};
          Object.keys(props).forEach((p) => {
            original[p] = (el.style as any)[p] || "";
            (el.style as any)[p] = props[p];
          });
          overrides.push({ el, props: original });
        }
      };

      fixOklch(element);
      allElements.forEach((el) => fixOklch(el as HTMLElement));

      element.style.backgroundColor = "#ffffff";
      element.style.color = "#000000";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

     
      overrides.forEach(({ el, props }) => {
        Object.keys(props).forEach((p) => {
          (el.style as any)[p] = props[p];
        });
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`facture-${invoice.invoice_number}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de générer le PDF.");
    }
  };

  const sendEmail = async () => {
    if (!activeBusiness?.id || !invoice) return;
    setSending(true);
    try {
      await invoiceService.sendInvoice(activeBusiness.id, invoice.id);
      toast.success("Facture envoyée avec succès !");
      fetchInvoice();
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'envoyer la facture.");
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

    if (selected < today) {
      return "La date d'échéance ne peut pas être antérieure à aujourd'hui.";
    }
    if (issueDate && selected < issueDate) {
      return "La date d'échéance ne peut pas être antérieure à la date de la facture.";
    }
    return "";
  };

  const handleDueDateChange = (value: string) => {
    setDueDateInput(value);
    setDateError(validateDueDate(value));
  };

  const updateDueDate = async () => {
    const error = validateDueDate(dueDateInput);
    if (error) {
      setDateError(error);
      return;
    }
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

  const quote = Array.isArray(invoice.quotes) ? invoice.quotes[0] : invoice.quotes;
  const client = quote?.clients || { name: "Nom client", email: "Email client" };
  const items = quote?.quote_details || [];

  const subtotal = items.reduce((s, i) => s + i.quantity * Number(i.products.unit_price), 0);
  const tax = items.reduce(
    (s, i) => s + i.quantity * Number(i.products.unit_price) * (Number(i.products.tax_rate) / 100),
    0
  );
  const total = subtotal + tax;

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


      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-stretch divide-x divide-border/60">

            {/* Download */}
            <button
              onClick={downloadPDF}
              disabled={!invoice}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4
                hover:bg-slate-50 transition-colors group disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors">
                <Download className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-xs font-medium text-slate-600">Télécharger PDF</span>
            </button>

      
            <button
              onClick={sendEmail}
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
                <Send className="h-4 w-4 text-sky-600" />
              </div>
              <span className="text-xs font-medium text-sky-600">
                {sending ? "Envoi..." : invoice.status === "sent" ? "Déjà envoyée" : "Envoyer par email"}
              </span>
            </button>

            {}
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

            {/* Delete */}
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
              <p style={{ color: "#888888" }} className="text-sm mt-1">Facturation professionnelle</p>
            </div>
            <div className="text-right">
              <h3 style={{ color: "#000000" }} className="text-2xl font-bold">FACTURE</h3>
              <p style={{ color: "#888888" }} className="text-sm">#{invoice.invoice_number}</p>
              <p style={{ color: "#888888" }} className="text-sm">
                {new Date(invoice.issue_date).toLocaleDateString("fr-FR")}
              </p>
           
            </div>
          </div>

          {/* CLIENT + DATES */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p style={{ color: "#888888" }} className="text-xs mb-1 uppercase tracking-widest">Facturé à</p>
              <p style={{ color: "#000000" }} className="font-semibold text-base">{client.name}</p>
              <p style={{ color: "#4b5563" }} className="text-sm mt-0.5">{client.email}</p>
            </div>
            <div className="text-right">
              <p style={{ color: "#888888" }} className="text-xs uppercase tracking-widest mb-1">Échéance</p>
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
            </div>
          </div>

         
          <table className="w-full border-collapse mb-8">
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5", color: "#000000" }}>
                <th className="p-3 border text-left text-sm">Produit</th>
                <th className="p-3 border text-right text-sm">Qté</th>
                <th className="p-3 border text-right text-sm">Prix</th>
                <th className="p-3 border text-right text-sm">TVA</th>
                <th className="p-3 border text-right text-sm">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
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
                <span style={{ color: "#888888" }}>Sous-total</span>
                <span>{subtotal.toLocaleString("fr-TN")} DT</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "#000000" }}>
                <span style={{ color: "#888888" }}>TVA</span>
                <span>{tax.toLocaleString("fr-TN")} DT</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold" style={{ color: "#000000" }}>
                <span>Total</span>
                <span>{total.toLocaleString("fr-TN")} DT</span>
              </div>
            </div>
          </div>

       
          <div className="mt-12 text-center text-xs" style={{ color: "#888888" }}>
            Merci pour votre confiance — {businessName}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}