import { useRef, useState } from "react";
import {
  Upload, FileSpreadsheet, CheckCircle2,
  XCircle, AlertTriangle, Download, RotateCcw,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { stockService } from "@/app/services/stockService";
import { useBusiness } from "@/app/context/BusinessContext";

interface ImportError {
  row: number;
  product?: string;
  warehouse?: string;
  error: string;
}

interface ImportReport {
  import_id: string;
  file_name: string;
  imported_at: string;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  status: "success" | "partial" | "failed";
  errors: ImportError[];
  summary: {
    products_created: number;
    products_updated: number;
    stock_added: number;
  };
}

const COLUMNS = [
  { col: "A", label: "name", required: true },
  { col: "B", label: "reference", required: false },
  { col: "C", label: "unit_price", required: true },
  { col: "D", label: "cost_price", required: false },
  { col: "E", label: "tax_rate", required: false },
  { col: "F", label: "category", required: false },
  { col: "G", label: "unit", required: false },
  { col: "H", label: "quantity", required: true },
  { col: "I", label: "warehouse", required: false },
];

export default function StockImport() {
  const { toast } = useToast();
  const { activeBusiness } = useBusiness();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  const handleFile = (file: File) => {
    const isExcel =
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel" ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls");

    if (!isExcel) {
      toast({ title: "Invalid file", description: "Please upload an Excel file (.xlsx)", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setReport(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile || !activeBusiness?.id) return;
    setLoading(true);
    try {
      const res = await stockService.importFromExcel(activeBusiness.id, selectedFile);
      setReport(res.data);
      if (res.data.status === "success") {
        toast({ title: "Import successful", description: `${res.data.success_rows} rows imported` });
      } else if (res.data.status === "partial") {
        toast({ title: "Partial import", description: `${res.data.success_rows} success, ${res.data.error_rows} errors`, variant: "destructive" });
      } else {
        toast({ title: "Import failed", description: "All rows failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Import failed, please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setReport(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const header = COLUMNS.map(c => c.label).join(",");
    const example = "Produit A,REF001,100,80,19,Electronics,piece,50,Warehouse A";
    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatusBadge = ({ status }: { status: ImportReport["status"] }) => {
    if (status === "success") return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Success
      </span>
    );
    if (status === "partial") return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Partial
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="h-4 w-4" aria-hidden="true" /> Failed
      </span>
    );
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Import Stock</h1>
          <p className="text-muted-foreground mt-1">Upload an Excel file to import products and stock</p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" aria-hidden="true" /> Download Template
        </Button>
      </div>

      {/* Column guide */}
      <Card className="rounded-2xl shadow-sm border border-border/60">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground mb-3">Excel file format</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2" role="list" aria-label="Required columns">
            {COLUMNS.map((c) => (
              <div key={c.col} className="text-center" role="listitem">
                <div className="text-xs font-bold text-primary bg-primary/10 rounded-lg py-1 px-2" aria-label={`Column ${c.col}`}>{c.col}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
                {c.required && <div className="text-xs text-rose-500 font-medium">required</div>}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Row 1 = headers (ignored). Data starts from row 2. Warehouse must exist before import.
          </p>
        </CardContent>
      </Card>

      {/* Drop Zone */}
      {!report && (
        <Card className="rounded-2xl shadow-sm border border-border/60">
          <CardContent className="p-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              role="button"
              tabIndex={0}
              aria-label={selectedFile ? `Selected file: ${selectedFile.name}. Press Enter to change file.` : "Drop Excel file here or press Enter to browse"}
              className={`
                border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${dragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : selectedFile
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }
              `}
            >
              <label htmlFor="file-upload" className="sr-only">Upload Excel file</label>
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleInputChange}
                aria-label="Upload Excel file"
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto" aria-hidden="true">
                    <FileSpreadsheet className="h-7 w-7 text-emerald-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto" aria-hidden="true">
                    <Upload className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Drop your Excel file here</p>
                    <p className="text-sm text-muted-foreground mt-1">or click to browse — .xlsx, .xls</p>
                  </div>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" /> Reset
                </Button>
                <Button onClick={handleImport} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" aria-hidden="true" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                      Import
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report */}
      {report && (
        <div className="space-y-5">

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="region" aria-label="Import summary">
            <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white">
              <CardContent className="p-5">
                <p className="text-xs text-slate-400 uppercase tracking-widest">Total Rows</p>
                <h2 className="text-4xl font-bold mt-2">{report.total_rows}</h2>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
              <CardContent className="p-5">
                <p className="text-xs text-emerald-100 uppercase tracking-widest">Success</p>
                <h2 className="text-4xl font-bold mt-2">{report.success_rows}</h2>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-rose-500 to-rose-700 text-white">
              <CardContent className="p-5">
                <p className="text-xs text-rose-100 uppercase tracking-widest">Errors</p>
                <h2 className="text-4xl font-bold mt-2">{report.error_rows}</h2>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-sky-500 to-sky-700 text-white">
              <CardContent className="p-5">
                <p className="text-xs text-sky-100 uppercase tracking-widest">Stock Added</p>
                <h2 className="text-4xl font-bold mt-2">{report.summary.stock_added}</h2>
              </CardContent>
            </Card>
          </div>

          {/* Report details */}
          <Card className="rounded-2xl shadow-sm border border-border/60">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{report.file_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(report.imported_at).toLocaleString("en-GB")}
                  </p>
                </div>
                <StatusBadge status={report.status} />
              </div>

              <div className="grid grid-cols-3 gap-3 bg-muted/30 rounded-xl p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{report.summary.products_created}</p>
                  <p className="text-xs text-muted-foreground mt-1">Products created</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-sky-600">{report.summary.products_updated}</p>
                  <p className="text-xs text-muted-foreground mt-1">Products updated</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{report.summary.stock_added}</p>
                  <p className="text-xs text-muted-foreground mt-1">Units added</p>
                </div>
              </div>

              {report.errors.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-destructive mb-2" role="alert">
                    {report.errors.length} error(s) detected
                  </p>
                  <div className="rounded-xl border border-rose-200 overflow-hidden">
                    <table className="w-full text-sm" aria-label="Import errors">
                      <thead>
                        <tr className="bg-rose-50 border-b border-rose-200">
                          <th scope="col" className="p-3 text-left text-xs font-semibold text-rose-700 uppercase">Row</th>
                          <th scope="col" className="p-3 text-left text-xs font-semibold text-rose-700 uppercase">Product</th>
                          <th scope="col" className="p-3 text-left text-xs font-semibold text-rose-700 uppercase">Warehouse</th>
                          <th scope="col" className="p-3 text-left text-xs font-semibold text-rose-700 uppercase">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100">
                        {report.errors.map((err, i) => (
                          <tr key={i} className="hover:bg-rose-50/50">
                            <td className="p-3 font-mono font-bold text-rose-700">#{err.row}</td>
                            <td className="p-3 text-muted-foreground">{err.product || "—"}</td>
                            <td className="p-3 text-muted-foreground">{err.warehouse || "—"}</td>
                            <td className="p-3 text-rose-700">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" /> New Import
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}