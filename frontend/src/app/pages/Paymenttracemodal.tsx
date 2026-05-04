// PaymentTraceModal.tsx
import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Upload,
  ScanLine,
  PenLine,
  CheckCircle2,
  X,
  Loader2,
  Banknote,
  Receipt,
  Smartphone,
  AlertCircle,
  Sparkles,
  Lock,
} from "lucide-react";
import { invoiceService } from "@/app/services/invoiceService";
import { toast } from "sonner";

interface PaymentTraceModalProps {
  open: boolean;
  onClose: () => void;
  invoice: any;
  businessId: number;
  mode: "paid" | "late_paid";
  onSuccess: (invoiceId: number, status: string, paymentData: any) => void;
}

type PaymentMethod = "cheque" | "espece" | "virement" | "other";
type EntryMode = "choose" | "manual" | "ocr";

interface PaymentFormData {
  payment_method: PaymentMethod | "";
  payment_date: string;
  amount: string;
  reference: string;
  cheque_number: string;
  bank_name: string;
  notes: string;
}

const PAYMENT_METHODS = [
  { value: "cheque", label: "Chèque", icon: Receipt },
  { value: "espece", label: "Espèces", icon: Banknote },
  { value: "virement", label: "Virement", icon: Smartphone },
  { value: "other", label: "Autre", icon: PenLine },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: get the JWT token from wherever your app stores it.
// Adjust this to match your auth implementation (localStorage, cookie, zustand, etc.)
// ─────────────────────────────────────────────────────────────────────────────
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  // ✅ Common patterns — uncomment the one that matches your app:

  // Pattern 1: stored directly in localStorage
  return localStorage.getItem("token");

  // Pattern 2: stored under a nested key
  // const raw = localStorage.getItem("auth");
  // return raw ? JSON.parse(raw)?.token : null;

  // Pattern 3: from a cookie (if httpOnly=false)
  // const match = document.cookie.match(/access_token=([^;]+)/);
  // return match ? match[1] : null;
}

export default function PaymentTraceModal({
  open,
  onClose,
  invoice,
  businessId,
  mode,
  onSuccess,
}: PaymentTraceModalProps) {
  const invoiceBankName: string = invoice?.bank?.bank_name || "";

  const makeInitialForm = (): PaymentFormData => ({
    payment_method: "",
    payment_date: new Date().toISOString().split("T")[0],
    amount: String(invoice?.total_amount || ""),
    reference: "",
    cheque_number: "",
    bank_name: invoiceBankName,
    notes: "",
  });

  const [entryMode, setEntryMode] = useState<EntryMode>("choose");
  const [form, setForm] = useState<PaymentFormData>(makeInitialForm);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setEntryMode("choose");
    setForm(makeInitialForm());
    setProofImage(null);
    setProofFile(null);
    setOcrLoading(false);
    setOcrDone(false);
    onClose();
  };

  /**
   * POST image to NestJS OCR endpoint with JWT token in Authorization header.
   *
   * ✅ FIX: The route `/ocr/extract` is proxied by next.config.ts to the NestJS backend.
   * ✅ FIX: JWT token is added to the Authorization header so the AuthGuard passes.
   */
  const runOCR = async (file: File) => {
    setOcrLoading(true);
    setOcrDone(false);

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Session expirée, veuillez vous reconnecter.");
        setOcrLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file); // ✅ field name MUST be "file" — matches FileInterceptor("file")

      const response = await fetch("/api/ocr/extract", {
        method: "POST",
        headers: {
         
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        toast.error("Non autorisé. Veuillez vous reconnecter.");
        setOcrLoading(false);
        return;
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          errorBody?.message || `OCR error: HTTP ${response.status}`
        );
      }

      const parsed = await response.json();

      // ✅ Merge OCR result into form — never overwrite the locked bank name
      setForm((prev) => ({
        ...prev,
        payment_method:
          (parsed.payment_method as PaymentMethod) || prev.payment_method,
        payment_date: parsed.payment_date || prev.payment_date,
        amount: parsed.amount ? String(parsed.amount) : prev.amount,
        reference: parsed.reference || prev.reference,
        cheque_number: parsed.cheque_number || prev.cheque_number,
        bank_name: invoiceBankName || parsed.bank_name || prev.bank_name,
        notes: parsed.notes || prev.notes,
      }));

      setOcrDone(true);
      toast.success("Données extraites automatiquement !");
    } catch (err: any) {
      console.error("[OCR] Error:", err);
      toast.error(
        err?.message?.includes("Failed to fetch")
          ? "Impossible de joindre le serveur OCR. Vérifiez que le backend tourne."
          : "Erreur OCR. Vous pouvez corriger manuellement."
      );
      // ✅ Show the form anyway so user can fill manually
      setOcrDone(true);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez uploader une image (JPG, PNG, WEBP)");
        return;
      }
      setProofFile(file);
      setProofImage(URL.createObjectURL(file));
      await runOCR(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoice, invoiceBankName]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async () => {
    if (!form.payment_method) {
      toast.error("Veuillez sélectionner un mode de paiement");
      return;
    }
    if (!form.payment_date) {
      toast.error("La date de paiement est obligatoire");
      return;
    }
    if (!form.amount) {
      toast.error("Le montant est obligatoire");
      return;
    }

    setSubmitting(true);
    try {
      const paymentTrace = {
        payment_method: form.payment_method,
        payment_date: form.payment_date,
        amount: parseFloat(form.amount),
        reference: form.reference || null,
        cheque_number: form.cheque_number || null,
        bank_name: form.bank_name || null,
        notes: form.notes || null,
        proof_image_url: null as string | null,
      };

      // Upload proof image if present
      if (proofFile) {
        try {
          const uploadRes = await invoiceService.uploadPaymentProof(
            businessId,
            invoice.id,
            proofFile
          );
          paymentTrace.proof_image_url = uploadRes?.data?.url || null;
        } catch {
          // Non-blocking: continue even if image upload fails
        }
      }

      await invoiceService.markAsPaidWithTrace(
        invoice.id,
        businessId,
        mode === "late_paid" ? "late_paid" : "paid",
        paymentTrace
      );

      onSuccess(
        invoice.id,
        mode === "late_paid" ? "late_paid" : "paid",
        paymentTrace
      );

      toast.success(
        mode === "late_paid"
          ? "Facture marquée payée en retard !"
          : "Facture marquée comme payée !"
      );
      handleClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Erreur lors de l'enregistrement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = Number(invoice?.total_amount || 0).toLocaleString("fr-TN");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div
          className={`px-6 py-5 ${
            mode === "late_paid"
              ? "bg-gradient-to-r from-orange-500 to-amber-500"
              : "bg-gradient-to-r from-emerald-500 to-teal-600"
          } text-white`}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {mode === "late_paid" ? "Marquer payé en retard" : "Marquer comme payé"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-1 opacity-90">
            Facture{" "}
            <span className="font-semibold">{invoice?.invoice_number}</span> —{" "}
            <span className="font-semibold">{totalAmount} DT</span>
          </p>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Choose entry mode */}
          {entryMode === "choose" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-medium">
                Comment souhaitez-vous enregistrer la trace de paiement ?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setEntryMode("ocr")}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                    <ScanLine className="w-6 h-6 text-violet-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">OCR Automatique</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upload une photo, l'IA lit tout
                    </p>
                  </div>
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Groq IA
                  </span>
                </button>

                <button
                  onClick={() => {
                    setForm(makeInitialForm());
                    setEntryMode("manual");
                  }}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                    <PenLine className="w-6 h-6 text-sky-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">Saisie manuelle</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Remplir le formulaire
                    </p>
                  </div>
                  <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">
                    Manuel
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2a: OCR upload zone */}
          {entryMode === "ocr" && !ocrDone && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEntryMode("choose")}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  ← Retour
                </button>
                <span className="text-sm font-medium">Upload preuve de paiement</span>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => !ocrLoading && fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  ocrLoading
                    ? "cursor-wait"
                    : "cursor-pointer hover:border-violet-300 hover:bg-violet-50/40"
                } ${dragOver ? "border-violet-400 bg-violet-50" : "border-border"}`}
              >
                {ocrLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-violet-700">
                      Analyse en cours...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Groq lit votre document
                    </p>
                  </div>
                ) : proofImage ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={proofImage}
                      alt="Preuve"
                      className="max-h-32 rounded-lg object-contain border"
                    />
                    <p className="text-xs text-muted-foreground">Cliquez pour changer</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        Glissez ou cliquez pour uploader
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Photo chèque · Reçu espèces · Capture virement
                      </p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {[
                        { icon: Receipt, label: "Chèque" },
                        { icon: Banknote, label: "Espèces" },
                        { icon: Smartphone, label: "Virement" },
                      ].map(({ icon: Icon, label }) => (
                        <span
                          key={label}
                          className="text-xs bg-muted px-2 py-1 rounded-lg flex items-center gap-1 text-muted-foreground"
                        >
                          <Icon className="w-3 h-3" />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                  // ✅ Reset input value so same file can be re-selected
                  e.target.value = "";
                }}
              />

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  L'IA (Groq) extrait automatiquement numéro, montant, date et référence via
                  Tesseract + Groq LLM. Vous pourrez vérifier et corriger avant de valider.
                </span>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    setForm(makeInitialForm());
                    setEntryMode("manual");
                  }}
                  className="text-xs text-muted-foreground hover:text-primary underline"
                >
                  Passer à la saisie manuelle
                </button>
              </div>
            </div>
          )}

          {/* Step 2b/3: Form (manual OR after OCR) */}
          {(entryMode === "manual" || (entryMode === "ocr" && ocrDone)) && (
            <div className="space-y-4">
              {/* Back button + OCR badge */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setEntryMode("choose");
                    setOcrDone(false);
                    setProofImage(null);
                    setProofFile(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  ← Retour
                </button>
                {ocrDone && entryMode === "ocr" && (
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Données extraites par Groq IA
                  </span>
                )}
              </div>

              {/* Proof thumbnail (OCR mode) */}
              {entryMode === "ocr" && proofImage && (
                <div className="relative w-full rounded-lg overflow-hidden border bg-muted/30">
                  <img
                    src={proofImage}
                    alt="Preuve"
                    className="max-h-24 w-full object-contain"
                  />
                  <button
                    onClick={() => {
                      setProofImage(null);
                      setProofFile(null);
                      setOcrDone(false);
                    }}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Mode de paiement */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mode de paiement *</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setForm((f) => ({ ...f, payment_method: value as PaymentMethod }))
                      }
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                        form.payment_method === value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date + Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Date de paiement *</Label>
                  <Input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, payment_date: e.target.value }))
                    }
                    className="rounded-lg h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Montant (DT) *</Label>
                  <Input
                    type="number"
                    placeholder={totalAmount}
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    className="rounded-lg h-9 text-sm"
                  />
                </div>
              </div>

              {/* Reference + Cheque number */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Référence / N° transaction</Label>
                  <Input
                    placeholder="REF-2024..."
                    value={form.reference}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, reference: e.target.value }))
                    }
                    className="rounded-lg h-9 text-sm"
                  />
                </div>
                {form.payment_method === "cheque" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Numéro chèque</Label>
                    <Input
                      placeholder="123456789"
                      value={form.cheque_number}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, cheque_number: e.target.value }))
                      }
                      className="rounded-lg h-9 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Bank name — locked if invoice has a linked bank */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  Banque / Établissement
                  {invoiceBankName && (
                    <span className="text-[10px] font-normal text-muted-foreground ml-1">
                      (enregistrée sur la facture)
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    value={invoiceBankName || form.bank_name}
                    disabled={!!invoiceBankName}
                    placeholder={invoiceBankName || "BNA, STB, Attijari..."}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bank_name: e.target.value }))
                    }
                    className={`rounded-lg h-9 text-sm pr-9 ${
                      invoiceBankName
                        ? "bg-muted/60 text-muted-foreground cursor-not-allowed"
                        : ""
                    }`}
                  />
                  {invoiceBankName && (
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
                  )}
                </div>
                {invoiceBankName && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    La banque est celle liée à cette facture et ne peut pas être modifiée ici.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Notes</Label>
                <Input
                  placeholder="Informations complémentaires..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="rounded-lg h-9 text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-10"
                  onClick={handleClose}
                >
                  Annuler
                </Button>
                <Button
                  disabled={submitting}
                  onClick={handleSubmit}
                  className={`flex-1 rounded-xl h-10 font-semibold ${
                    mode === "late_paid"
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {mode === "late_paid"
                        ? "Confirmer paiement tardif"
                        : "Confirmer le paiement"}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}