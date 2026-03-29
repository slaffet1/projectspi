import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import {
  ArrowLeft, Download, Send, Edit, Trash2, FileCheck,
  X, Save, Loader2, Printer, CheckCircle, XCircle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import { QuoteStatusBadge } from "@/app/components/QuoteStatusBadge";
import { quoteService } from "@/app/services/quoteService";
import { useBusiness } from "@/app/context/BusinessContext";
import { toast } from "react-toastify";
import QuotePDF from "./QuotePDF";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ─── Types ────────────────────────────────────────────────────────────────────
type LineItem = {
  _id: string;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
};

const calcLine = (qty: number, price: number, tax: number) => {
  const ht = qty * price;
  return { ht, tax: ht * (tax / 100), ttc: ht * (1 + tax / 100) };
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeBusiness, hasPermission } = useBusiness();
  const [isClient, setIsClient] = useState(false);
  const businessId = activeBusiness?.id;

  const [quote,   setQuote]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [editing, setEditing] = useState(false);

  // Edit state
  const [editItems,      setEditItems]      = useState<LineItem[]>([]);
  const [editExpiration, setEditExpiration] = useState("");
/*
  const canUpdate  = hasPermission('quote:update');
  const canDelete  = hasPermission('quote:delete');
  const canConvert = hasPermission('invoice:create');
*/
const canConvert = true;
const canDelete = true;
const canUpdate = true;
  useEffect(() => {
    setIsClient(true);
    if (!businessId || !id) return;
    fetchQuote();
  }, [businessId, id]);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const res = await quoteService.getOne(businessId!, +id!);
      setQuote(res.data);
    } catch {
      toast.error("Devis introuvable");
      navigate("/app/quotes");
    } finally {
      setLoading(false);
    }
  };

  // ── Computed totals ─────────────────────────────────────────────────────
  const getTotals = (items: any[]) => {
    const ht  = items.reduce((s, d) => s + d.quantity * Number(d.unit_price ?? d.products?.unit_price ?? 0), 0);
    const tax = items.reduce((s, d) => {
      const price   = Number(d.unit_price ?? d.products?.unit_price ?? 0);
      const taxRate = Number(d.tax_rate  ?? d.products?.tax_rate   ?? 0);
      return s + d.quantity * price * (taxRate / 100);
    }, 0);
    return { ht, tax, ttc: ht + tax };
  };

  // ── Edit mode ───────────────────────────────────────────────────────────
  const startEdit = () => {
    setEditItems(quote.quote_details.map((d: any) => ({
      _id:          String(d.id),
      product_id:   d.product_id,
      product_name: d.products?.name ?? '',
      quantity:     d.quantity,
      unit_price:   Number(d.products?.unit_price ?? 0),
      tax_rate:     Number(d.products?.tax_rate   ?? 0),
    })));
    setEditExpiration(quote.expiration_date?.split('T')[0] ?? '');
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    const totals = getTotals(editItems.map(i => ({
      quantity: i.quantity, unit_price: i.unit_price, tax_rate: i.tax_rate,
    })));
    setSaving(true);
    try {
      const res = await quoteService.update(businessId!, +id!, {
        expiration_date: editExpiration,
        total_amount:    totals.ttc,
        client_id:       quote.client_id,
        issue_date:      quote.issue_date?.split('T')[0],
        details: editItems.map(i => ({
          product_id: i.product_id,
          quantity:   i.quantity,
          unit_price: i.unit_price,
          tax_rate:   i.tax_rate,
        })),
      });
      setQuote(res.data);
      setEditing(false);
      toast.success("Devis mis à jour");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleSend = async () => {
    try {
      const res = await quoteService.send(businessId!, +id!);
      setQuote(res.data);
      toast.success("Devis envoyé");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erreur");
    }
  };

  const handleStatus = async (status: string) => {
    try {
      const res = await quoteService.updateStatus(businessId!, +id!, status);
      setQuote(res.data);
      toast.success(`Statut mis à jour : ${status}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erreur");
    }
  };

const handleConvert = () => {
  navigate(`/app/invoices/new?quoteId=${id}`);
};

  const handleDelete = async () => {
    if (!confirm("Supprimer ce devis définitivement ?")) return;
    try {
      await quoteService.remove(businessId!, +id!);
      toast.success("Devis supprimé");
      navigate("/app/quotes");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erreur");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  if (!quote) return null;

  const details = editing ? editItems : quote.quote_details;
  const totals  = getTotals(
    editing
      ? editItems.map(i => ({ quantity: i.quantity, unit_price: i.unit_price, tax_rate: i.tax_rate }))
      : quote.quote_details.map((d: any) => ({
          quantity:   d.quantity,
          unit_price: d.products?.unit_price ?? 0,
          tax_rate:   d.products?.tax_rate   ?? 0,
        }))
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/app/quotes">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Devis {quote.quote_id}</h1>
            <p className="text-muted-foreground mt-1">Détails du devis</p>
          </div>
        </div>
        <QuoteStatusBadge status={quote.status} />
      </div>

      {/* Action bar */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            {/* PDF Download — US-41 */}
            {isClient && (
              <PDFDownloadLink
                document={<QuotePDF quote={quote} business={activeBusiness} />}
                fileName={`${quote.quote_id}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <Button variant="outline" disabled={pdfLoading}>
                    <Download className="h-4 w-4 mr-2" />
                    {pdfLoading ? "Génération..." : "Télécharger PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
            {/* Send — US-35 */}
            {canUpdate && quote.status === 'draft' && (
              <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-2" />
                Envoyer au client
              </Button>
            )}

            {/* Accept / Reject — when sent */}
            {canUpdate && quote.status === 'sent' && (
              <>
                <Button onClick={() => handleStatus('accepted')} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accepter
                </Button>
                <Button onClick={() => handleStatus('rejected')} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser
                </Button>
              </>
            )}

            {/* Convert — US-38 */}
            {canConvert && quote.status === 'accepted' && (
              <Button onClick={handleConvert} className="bg-purple-600 hover:bg-purple-700">
                <FileCheck className="h-4 w-4 mr-2" />
                Convertir en facture
              </Button>
            )}

            {/* Edit — US-34 */}
            {canUpdate && quote.status === 'draft' && !editing && (
              <Button onClick={startEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}

            {/* Save edit */}
            {editing && (
              <>
                <Button onClick={handleSaveEdit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer
                </Button>
                <Button onClick={() => setEditing(false)} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </>
            )}

            {/* Delete — US-39 */}
            {canDelete && ['draft', 'cancelled'].includes(quote.status) && !editing && (
              <Button onClick={handleDelete} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quote document preview */}
      <Card className="border-border shadow-sm" id="quote-preview">
        <CardContent className="p-8 md:p-12">
          {/* Document header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-xl font-bold text-white">B</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  Business<span className="text-primary">Manager</span>
                </span>
              </div>
              {activeBusiness?.address && <p className="text-sm text-muted-foreground">{activeBusiness.address}</p>}
              {activeBusiness?.city    && <p className="text-sm text-muted-foreground">{activeBusiness.city}, {activeBusiness.country}</p>}
              {activeBusiness?.phone   && <p className="text-sm text-muted-foreground">{activeBusiness.phone}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-primary mb-2">DEVIS</h2>
              <p className="text-sm text-muted-foreground">N° {quote.quote_id}</p>
              <QuoteStatusBadge status={quote.status} />
            </div>
          </div>

          {/* Client + Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">ADRESSÉ À</h3>
              <p className="font-semibold text-foreground">{quote.clients?.name}</p>
              <p className="text-sm text-muted-foreground">{quote.clients?.email}</p>
              <p className="text-sm text-muted-foreground">{quote.clients?.phone}</p>
            </div>
            <div className="text-left md:text-right">
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">Date d'émission</p>
                <p className="font-medium">
                  {new Date(quote.issue_date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date d'expiration</p>
                {editing ? (
                  <Input
                    type="date"
                    value={editExpiration}
                    onChange={e => setEditExpiration(e.target.value)}
                    className="mt-1 max-w-[180px] ml-auto h-8 text-sm"
                  />
                ) : (
                  <p className="font-medium">
                    {new Date(quote.expiration_date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-3 text-sm font-semibold text-muted-foreground">PRODUIT</th>
                  <th className="text-right py-3 text-sm font-semibold text-muted-foreground">QTÉ</th>
                  <th className="text-right py-3 text-sm font-semibold text-muted-foreground">PRIX UNIT.</th>
                  <th className="text-right py-3 text-sm font-semibold text-muted-foreground">TVA</th>
                  <th className="text-right py-3 text-sm font-semibold text-muted-foreground">TOTAL TTC</th>
                </tr>
              </thead>
              <tbody>
                {editing
                  ? editItems.map(item => {
                      const line = calcLine(item.quantity, item.unit_price, item.tax_rate);
                      return (
                        <tr key={item._id} className="border-b border-border">
                          <td className="py-3 text-sm">{item.product_name}</td>
                          <td className="py-3 text-right">
                            <Input
                              type="number" min="1" value={item.quantity}
                              onChange={e => setEditItems(editItems.map(i =>
                                i._id === item._id ? { ...i, quantity: Math.max(1, +e.target.value) } : i
                              ))}
                              className="w-16 h-7 text-sm text-center ml-auto"
                            />
                          </td>
                          <td className="py-3 text-right text-sm">{item.unit_price.toFixed(2)} DT</td>
                          <td className="py-3 text-right text-sm">{item.tax_rate}%</td>
                          <td className="py-3 text-right text-sm font-medium">{line.ttc.toFixed(2)} DT</td>
                        </tr>
                      );
                    })
                  : quote.quote_details.map((d: any) => {
                      const price   = Number(d.products?.unit_price ?? 0);
                      const taxRate = Number(d.products?.tax_rate   ?? 0);
                      const line    = calcLine(d.quantity, price, taxRate);
                      return (
                        <tr key={d.id} className="border-b border-border">
                          <td className="py-4 text-sm">{d.products?.name}</td>
                          <td className="py-4 text-right text-sm">{d.quantity}</td>
                          <td className="py-4 text-right text-sm">{price.toFixed(2)} DT</td>
                          <td className="py-4 text-right text-sm">{taxRate}%</td>
                          <td className="py-4 text-right text-sm font-medium">{line.ttc.toFixed(2)} DT</td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span className="font-medium">{totals.ht.toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA</span>
                <span className="font-medium">{totals.tax.toFixed(2)} DT</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-lg font-semibold">Total TTC</span>
                <span className="text-2xl font-bold text-primary">{totals.ttc.toFixed(2)} DT</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Validité :</strong> Ce devis est valable jusqu'au{" "}
              {new Date(quote.expiration_date).toLocaleDateString("fr-FR")}.
              Merci pour votre confiance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}