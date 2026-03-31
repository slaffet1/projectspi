import { useEffect, useState } from "react";
import { Plus, CreditCard, Landmark, Trash2, Pencil, Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { bankService } from "@/app/services/bankService";

const ribBankMapping: Record<string, string> = {
  "01": "BNA",
  "02": "BH Bank",
  "03": "BIAT",
  "04": "Amen Bank",
  "05": "ATB",
  "06": "Zitouna Bank",
  "07": "BTK",
  "08": "STB",
  "09": "UIB",
};

const bankColors: Record<string, string> = {
  "BNA": "bg-blue-500",
  "BH Bank": "bg-emerald-500",
  "BIAT": "bg-violet-500",
  "Amen Bank": "bg-orange-500",
  "ATB": "bg-cyan-500",
  "Zitouna Bank": "bg-green-600",
  "BTK": "bg-pink-500",
  "STB": "bg-indigo-500",
  "UIB": "bg-red-500",
};

export default function Banks() {
  const { toast } = useToast();

  const emptyForm = {
    bank_name: "",
    account_number: "",
    iban: "",
    balance: "",
  };

  const [banks, setBanks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [ribError, setRibError] = useState("");

  const fetchBanks = async () => {
    try {
      const res = await bankService.getBanks();
      setBanks(res.data);
    } catch {
      toast({ title: "Error", description: "Failed to load bank accounts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanks(); }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!searchQuery) return fetchBanks();
      try {
        const res = await bankService.searchBanks(searchQuery);
        setBanks(res.data);
      } catch {
        toast({ title: "Error", description: "Search failed", variant: "destructive" });
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleAccountNumberChange = (value: string) => {
    const rib = value.replace(/\D/g, "");
    const code = rib.slice(0, 2);
    if (rib.length >= 2) {
      const bank = ribBankMapping[code];
      if (bank) {
        setForm((prev) => ({ ...prev, account_number: rib, bank_name: bank }));
        setRibError("");
      } else {
        setForm((prev) => ({ ...prev, account_number: rib, bank_name: "" }));
        setRibError("❌ Invalid RIB (unknown bank)");
      }
    } else {
      setForm((prev) => ({ ...prev, account_number: rib, bank_name: "" }));
      setRibError("");
    }
  };

  const handleCreate = async () => {
    if (!form.bank_name) {
      toast({ title: "Error", description: "Invalid RIB, cannot add account", variant: "destructive" });
      return;
    }
    if (form.account_number.length < 6) {
      toast({ title: "Error", description: "RIB too short", variant: "destructive" });
      return;
    }
    setFormLoading(true);
    try {
      await bankService.createBank(form);
      toast({ title: "Success 🎉", description: "Bank account created" });
      setIsCreateOpen(false);
      setForm(emptyForm);
      fetchBanks();
    } catch {
      toast({ title: "Error", description: "Creation failed", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (bank: any) => {
    setSelectedBank(bank);
    setForm({
      bank_name: bank.bank_name,
      account_number: bank.account_number,
      iban: bank.iban,
      balance: bank.balance,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    setFormLoading(true);
    try {
      await bankService.updateBank(selectedBank.id, form);
      toast({ title: "Success ✨", description: "Bank account updated" });
      setIsEditOpen(false);
      setForm(emptyForm);
      setSelectedBank(null);
      fetchBanks();
    } catch {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const openDelete = (bank: any) => {
    setSelectedBank(bank);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await bankService.deleteBank(selectedBank.id);
      toast({ title: "Deleted 🗑", description: "Bank account removed" });
      setIsDeleteOpen(false);
      setSelectedBank(null);
      fetchBanks();
    } catch {
      toast({ title: "Error", description: "Deletion failed", variant: "destructive" });
    }
  };

  const formatRIB = (rib: string) => {
    if (!rib) return "-";
    return rib.replace(/(\d{2})(\d{3})(\d{7})(\d{2})/, "$1 $2 $3 $4");
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Bank Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your company bank accounts</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Button onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && banks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Landmark className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">No bank accounts yet</h2>
            <p className="text-muted-foreground mt-1">Add your first bank account to get started</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        </div>
      )}

      {/* LIST */}
      {!loading && banks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((bank) => {
            const color = bankColors[bank.bank_name] ?? "bg-gray-500";
            return (
              <Card key={bank.id} className="shadow-sm rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow">
                {/* Card top color bar */}
                <div className={`h-2 w-full ${color}`} />

                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                    <Landmark className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{bank.bank_name}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4 shrink-0" />
                    <span className="font-mono">{formatRIB(bank.account_number)}</span>
                  </div>

                  {bank.iban && (
                    <div className="text-muted-foreground text-xs font-mono truncate">
                      IBAN: {bank.iban}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="text-lg font-semibold text-foreground">
                        {Number(bank.balance ?? 0).toLocaleString("fr-TN")} <span className="text-sm font-normal text-muted-foreground">DT</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEdit(bank)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDelete(bank)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL CREATE / EDIT */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            setForm(emptyForm);
            setRibError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Edit" : "New"} Bank Account</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Account Number (RIB)</label>
              <Input
                placeholder="e.g. 08001231234567"
                value={form.account_number}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Bank Name (auto-detected)</label>
              <Input
                placeholder="Bank name"
                value={form.bank_name}
                disabled
                className="bg-muted"
              />
            </div>

            {ribError && <p className="text-destructive text-sm">{ribError}</p>}

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">IBAN (optional)</label>
              <Input
                placeholder="e.g. TN5908001231234567"
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Balance (DT)</label>
              <Input
                placeholder="0"
                type="number"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={isEditOpen ? handleUpdate : handleCreate} disabled={formLoading}>
              {formLoading ? "Saving..." : isEditOpen ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete <strong className="text-foreground">{selectedBank?.bank_name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
