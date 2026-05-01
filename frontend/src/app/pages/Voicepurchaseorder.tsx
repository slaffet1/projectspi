import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import {
  ArrowLeft, Mic, Save, Trash2,
  CheckCircle, AlertCircle, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
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
import { api } from "@/app/services/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

type VoiceStep = "idle" | "recording_product" | "recording_date";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseProductQuery(text: string): { quantity: number; name: string } | null {
  const wordMap: Record<string, number> = {
    un: 1, une: 1, one: 1,
    deux: 2, two: 2,
    trois: 3, three: 3,
    quatre: 4, four: 4,
    cinq: 5, five: 5,
    six: 6,
    sept: 7, seven: 7,
    huit: 8, eight: 8,
    neuf: 9, nine: 9,
    dix: 10, ten: 10,
    vingt: 20, twenty: 20,
    trente: 30, thirty: 30,
    quarante: 40, forty: 40,
    cinquante: 50, fifty: 50,
  };
  const t = text.trim().toLowerCase();
  const numMatch = t.match(/^(\d+)\s+(.+)$/);
  if (numMatch) return { quantity: parseInt(numMatch[1]), name: numMatch[2].trim() };
  const wordMatch = t.match(/^([a-zéèêëàâîïùûüôœç]+)\s+(.+)$/);
  if (wordMatch && wordMap[wordMatch[1]])
    return { quantity: wordMap[wordMatch[1]], name: wordMatch[2].trim() };
  return null;
}

function findProduct(products: any[], name: string): any | null {
  const n = name.toLowerCase().replace(/s$/, "");
  return (
    products.find((p) => p.name.toLowerCase() === name.toLowerCase()) ||
    products.find((p) => p.name.toLowerCase().includes(n)) ||
    products.find((p) => n.includes(p.name.toLowerCase())) ||
    null
  );
}

function parseSpokenDate(text: string): string | null {
  const months: Record<string, number> = {
    janvier: 1, january: 1, jan: 1,
    février: 2, fevrier: 2, february: 2, feb: 2,
    mars: 3, march: 3, mar: 3,
    avril: 4, april: 4, apr: 4,
    mai: 5, may: 5,
    juin: 6, june: 6, jun: 6,
    juillet: 7, july: 7, jul: 7,
    août: 8, aout: 8, august: 8, aug: 8,
    septembre: 9, september: 9, sep: 9,
    octobre: 10, october: 10, oct: 10,
    novembre: 11, november: 11, nov: 11,
    décembre: 12, decembre: 12, december: 12, dec: 12,
  };
  const t = text.toLowerCase().trim();
  const match =
    t.match(/(\d{1,2})\s+([a-zéûôàèê]+)\s+(\d{4})/) ||
    t.match(/([a-zéûôàèê]+)\s+(\d{1,2})\s+(\d{4})/);
  if (match) {
    let day: number, monthWord: string, year: number;
    if (!isNaN(Number(match[1]))) {
      day = parseInt(match[1]); monthWord = match[2]; year = parseInt(match[3]);
    } else {
      monthWord = match[1]; day = parseInt(match[2]); year = parseInt(match[3]);
    }
    const month = months[monthWord];
    if (month)
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const isoMatch = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const slashMatch = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch)
    return `${slashMatch[3]}-${slashMatch[2].padStart(2, "0")}-${slashMatch[1].padStart(2, "0")}`;
  return null;
}

function isValidDateString(dateStr: string): boolean {
  if (!dateStr) return false;
  return !isNaN(new Date(dateStr).getTime());
}

async function transcribeAudio(blob: Blob, businessId: number): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "recording.webm");
  const res = await api.post(
    `/api/businesses/${businessId}/purchase-orders-client/transcribe`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.text as string;
}

// ─── Mic Button ───────────────────────────────────────────────────────────────

function MicButton({
  isRecording, isTranscribing, onClick, size = "md",
}: {
  isRecording: boolean;
  isTranscribing: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const iconSize = size === "sm" ? 15 : 18;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isTranscribing}
      className={[
        dim,
        "relative rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0",
        isRecording
          ? "bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/25"
          : "border border-border bg-background hover:bg-muted",
        isTranscribing ? "opacity-60 cursor-wait" : "cursor-pointer",
      ].join(" ")}
    >
      {isRecording && (
        <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-25" />
      )}
      {isTranscribing ? (
        <Loader2 size={iconSize} className="animate-spin text-muted-foreground" />
      ) : isRecording ? (
        <div className="flex gap-[3px] items-end h-3.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-white"
              style={{
                height: "100%",
                animation: "voiceWave 0.55s ease-in-out infinite alternate",
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>
      ) : (
        <Mic size={iconSize} className="text-muted-foreground" />
      )}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VoicePurchaseOrder() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id;
  const navigate = useNavigate();

  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [expirationDate, setExpirationDate] = useState("");
  const issueDate = new Date().toISOString().split("T")[0];

  const [voiceStep, setVoiceStep] = useState<VoiceStep>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceHint, setVoiceHint] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          productsService.getProducts(businessId),
          clientService.getClients(),
        ]);
        setProducts(pRes.data);
        setClients(cRes.data);
      } catch {
        toast.error("Erreur lors du chargement des données");
      }
    })();
  }, [businessId]);

  const startRecording = useCallback(async (step: VoiceStep) => {
    setVoiceError(""); setVoiceHint("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setVoiceError("Microphone inaccessible. Vérifiez les permissions du navigateur.");
      return;
    }
    const mimeType = [
      "audio/webm;codecs=opus", "audio/webm",
      "audio/ogg;codecs=opus", "audio/mp4", "",
    ].find((m) => !m || MediaRecorder.isTypeSupported(m)) ?? "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
      await processAudio(blob, step);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setVoiceStep(step);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, products]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const processAudio = async (blob: Blob, step: VoiceStep) => {
    setIsTranscribing(true);
    let text = "";
    try {
      text = await transcribeAudio(blob, businessId!);
    } catch {
      setVoiceError("Transcription échouée. Réessayez.");
      setIsTranscribing(false); setVoiceStep("idle");
      return;
    }
    setIsTranscribing(false); setVoiceStep("idle");
    if (step === "recording_product") handleProductText(text);
    else if (step === "recording_date") handleDateText(text);
  };

  const handleProductText = (text: string) => {
    const parsed = parseProductQuery(text);
    if (!parsed) { setVoiceError(`Non compris : "${text}"".`); return; }
    const product = findProduct(products, parsed.name);
    if (!product) { setVoiceError(`Produit "${parsed.name}" introuvable dans votre catalogue.`); return; }
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product_id === product.id.toString());
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].quantity += parsed.quantity;
        return updated;
      }
      return [...prev, {
        product_id: product.id.toString(),
        product_name: product.name,
        quantity: parsed.quantity,
        unit_price: Number(product.unit_price),
        tax_rate: Number(product.tax_rate || 0),
      }];
    });
    setVoiceHint(`Ajouté : ${parsed.quantity}× ${product.name}`);
  };

  const handleDateText = (text: string) => {
    const date = parseSpokenDate(text);
    if (!date) { setVoiceError(`Date non comprise : "${text}"".`); return; }
    if (!isValidDateString(date)) { setVoiceError(`Date invalide : "${text}". Réessayez.`); return; }
    const today = new Date().toISOString().split("T")[0];
    if (date <= today) { setVoiceError("La date d'échéance doit être postérieure à aujourd'hui."); return; }
    setExpirationDate(date);
    setVoiceHint(`Date : ${new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`);
  };

  const totalHT     = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const totalTax    = items.reduce((s, i) => s + i.quantity * i.unit_price * (i.tax_rate / 100), 0);
  const totalAmount = totalHT + totalTax;

  const handleSubmit = async () => {
    if (!clientId)        return toast.warning("Veuillez sélectionner un client");
    if (items.length === 0) return toast.warning("Ajoutez au moins un produit");
    if (!expirationDate)  return toast.warning("Veuillez définir une date d'échéance");
    if (!isValidDateString(expirationDate)) return toast.error("Date d'échéance invalide.");
    setSubmitLoading(true);
    try {
      await purchaseOrderclientService.create(businessId!, {
        client_id: Number(clientId),
        issue_date: issueDate,
        expiration_date: expirationDate,
        total_amount: totalAmount,
        status: "draft",
        details: items.map((i) => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) })),
      });
      toast.success("Bon de commande créé !");
      navigate("/app/purchase-orders-client");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la création");
    } finally {
      setSubmitLoading(false);
    }
  };

  const canSubmit = !!clientId && items.length > 0 && !!expirationDate && !submitLoading;

  const stepDone = (n: number) => {
    if (n === 1) return !!clientId;
    if (n === 2) return items.length > 0;
    if (n === 3) return !!expirationDate;
    return false;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">

      <style>{`@keyframes voiceWave { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }`}</style>

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link to="/app/purchase-orders-client">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-foreground">Voice Purchase Order</h1>
            <Badge variant="secondary" className="text-xs gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
              </span>
              
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Sélectionnez le client, puis dictez vos produits et la date d'échéance
          </p>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="flex items-center gap-3">
        {["Client", "Produits", "Échéance"].map((label, i) => {
          const done = stepDone(i + 1);
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={["h-1 flex-1 rounded-full transition-all duration-500", done ? "bg-primary" : "bg-border"].join(" ")} />
              <span className={["text-xs font-medium whitespace-nowrap", done ? "text-primary" : "text-muted-foreground"].join(" ")}>
                {done ? "✓ " : ""}{label}
              </span>
            </div>
          );
        })}
        <div className={["h-1 w-8 rounded-full", canSubmit ? "bg-primary" : "bg-border"].join(" ")} />
      </div>

      {/* ── Step 1: Client ── */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className={["inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold", stepDone(1) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"].join(" ")}>
              {stepDone(1) ? "✓" : "1"}
            </span>
            Sélectionner le Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm space-y-2">
            <Label>Client *</Label>
            <Select value={clientId} onValueChange={(v) => { setClientId(v); setVoiceError(""); setVoiceHint(""); }}>
              <SelectTrigger><SelectValue placeholder="Choisir un client..." /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Step 2: Products ── */}
      {clientId && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={["inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold", stepDone(2) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"].join(" ")}>
                  {stepDone(2) ? "✓" : "2"}
                </span>
                Produits par Voix
              </div>
              {items.length > 0 && (
                <Badge variant="outline">{items.length} produit{items.length > 1 ? "s" : ""}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Voice row */}
            <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-border bg-muted/30">
              <MicButton
                isRecording={isRecording && voiceStep === "recording_product"}
                isTranscribing={isTranscribing && voiceStep === "recording_product"}
                onClick={() =>
                  isRecording && voiceStep === "recording_product"
                    ? stopRecording()
                    : startRecording("recording_product")
                }
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {isTranscribing && voiceStep === "recording_product"
                    ? "Transcription en cours…"
                    : isRecording && voiceStep === "recording_product"
                    ? "Enregistrement… Cliquez pour arrêter"
                    : "Cliquez pour dicter un produit"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                 
                </p>
              </div>
              {isRecording && voiceStep === "recording_product" && (
                <Badge variant="destructive" className="shrink-0">● REC</Badge>
              )}
            </div>

            {/* Items table */}
            {items.length > 0 && (
              <div>
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground pb-2 border-b px-2">
                  <div className="col-span-5">Produit</div>
                  <div className="col-span-2 text-center">Qté</div>
                  <div className="col-span-2 text-right">Prix HT</div>
                  <div className="col-span-2 text-right">Total TTC</div>
                  <div className="col-span-1" />
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 items-center py-2.5 px-2 rounded-md hover:bg-muted/40 transition-colors">
                    <div className="col-span-5 text-sm font-medium truncate">{item.product_name}</div>
                    <div className="col-span-2 flex justify-center">
                      <Input
                        type="number" min="1" value={item.quantity}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx].quantity = Math.max(1, Number(e.target.value));
                          setItems(next);
                        }}
                        className="h-7 w-16 text-center text-sm"
                      />
                    </div>
                    <div className="col-span-2 text-right text-sm text-muted-foreground">
                      {item.unit_price.toFixed(3)} DT
                    </div>
                    <div className="col-span-2 text-right text-sm font-semibold">
                      {(item.quantity * item.unit_price * (1 + item.tax_rate / 100)).toFixed(3)} DT
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button" variant="ghost" size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Expiration date ── */}
      {clientId && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className={["inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold", stepDone(3) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"].join(" ")}>
                {stepDone(3) ? "✓" : "3"}
              </span>
              Date d'Échéance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Voice row */}
            <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-border bg-muted/30">
              <MicButton
                size="sm"
                isRecording={isRecording && voiceStep === "recording_date"}
                isTranscribing={isTranscribing && voiceStep === "recording_date"}
                onClick={() =>
                  isRecording && voiceStep === "recording_date"
                    ? stopRecording()
                    : startRecording("recording_date")
                }
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {isTranscribing && voiceStep === "recording_date"
                    ? "Transcription en cours…"
                    : isRecording && voiceStep === "recording_date"
                    ? "Enregistrement… Cliquez pour arrêter"
                    : "Dicter la date d'échéance"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                 
                </p>
              </div>
              {isRecording && voiceStep === "recording_date" && (
                <Badge variant="destructive" className="shrink-0">● REC</Badge>
              )}
            </div>

            {/* Date display + manual */}
            <div className="flex items-center gap-4 flex-wrap">
              {expirationDate && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/20">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium">
                    {new Date(expirationDate + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="h-5 px-1.5 text-xs text-muted-foreground"
                    onClick={() => setExpirationDate("")}
                  >
                    modifier
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">ou saisir manuellement :</Label>
                <Input
                  type="date"
                  value={expirationDate}
                  min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExpirationDate(val);
                    if (val && isValidDateString(val))
                      setVoiceHint(`Date : ${new Date(val + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`);
                  }}
                  className="w-40 h-8 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Feedback banner ── */}
      {(voiceError || voiceHint) && (
        <div className={["flex items-center gap-3 px-4 py-3 rounded-lg border text-sm", voiceError ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-primary/10 border-primary/20 text-foreground"].join(" ")}>
          {voiceError
            ? <AlertCircle className="h-4 w-4 shrink-0" />
            : <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
          }
          <span className="flex-1">{voiceError || voiceHint}</span>
          <button type="button" onClick={() => { setVoiceError(""); setVoiceHint(""); }} className="text-muted-foreground hover:text-foreground text-lg leading-none ml-2">×</button>
        </div>
      )}

      {/* ── Total summary ── */}
      {items.length > 0 && (
        <div className="flex justify-end">
          <div className="w-72 bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Sous-total HT :</span>
              <span>{totalHT.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} DT</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground border-b pb-2">
              <span>TVA :</span>
              <span>{totalTax.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} DT</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-1">
              <span>Total TTC :</span>
              <span className="text-primary">{totalAmount.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} DT</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex justify-end gap-4">
        <Link to="/app/purchase-orders-client">
          <Button type="button" variant="outline">Annuler</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {submitLoading
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création…</>
            : <><Save className="h-4 w-4 mr-2" />Créer le Bon de Commande</>
          }
        </Button>
      </div>

    </div>
  );
}