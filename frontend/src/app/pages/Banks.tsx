import { useEffect, useState } from "react";
import { Plus, CreditCard, DollarSign, Search } from "lucide-react";
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

// 🔥 Mapping RIB → Banque (Tunisie)
const ribBankMapping: Record<string, string> = {
  "01": "BNA",
  "02": "BH",
  "03": "BIAT",
  "04": "AMEN BANK",
  "05": "ATB",
  "06": "ZITOUNA",
  "07": "BTK",
  "08": "STB",
  "09": "UIB",
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

  // 🔹 Fetch
  const fetchBanks = async () => {
    try {
      const res = await bankService.getBanks();
      setBanks(res.data);
    } catch {
      toast({
        title: "Erreur",
        description: "Chargement impossible",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  // 🔹 Search
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!searchQuery) return fetchBanks();

      try {
        const res = await bankService.searchBanks(searchQuery);
        setBanks(res.data);
      } catch {
        toast({
          title: "Erreur",
          description: "Recherche échouée",
          variant: "destructive",
        });
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // 🔥 AUTO-DETECTION BANQUE
  const handleAccountNumberChange = (value: string) => {
    const rib = value.replace(/\D/g, ""); // chiffres seulement
    const code = rib.slice(0, 2);

    if (rib.length >= 2) {
      const bank = ribBankMapping[code];

      if (bank) {
        setForm((prev) => ({
          ...prev,
          account_number: rib,
          bank_name: bank,
        }));
        setRibError("");
      } else {
        setForm((prev) => ({
          ...prev,
          account_number: rib,
          bank_name: "",
        }));
        setRibError("❌ RIB invalide (banque inconnue)");
      }
    } else {
      setForm((prev) => ({
        ...prev,
        account_number: rib,
        bank_name: "",
      }));
      setRibError("");
    }
  };

  // 🔹 CREATE
  const handleCreate = async () => {
    if (!form.bank_name) {
      toast({
        title: "Erreur",
        description: "RIB invalide, impossible d'ajouter",
        variant: "destructive",
      });
      return;
    }

    if (form.account_number.length < 6) {
      toast({
        title: "Erreur",
        description: "RIB trop court",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);

    try {
      await bankService.createBank(form);

      toast({
        title: "Succès 🎉",
        description: "Banque créée",
      });

      setIsCreateOpen(false);
      setForm(emptyForm);
      fetchBanks();
    } catch {
      toast({
        title: "Erreur",
        description: "Création échouée",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // 🔹 UPDATE
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

      toast({
        title: "Succès ✨",
        description: "Banque modifiée",
      });

      setIsEditOpen(false);
      setForm(emptyForm);
      setSelectedBank(null);
      fetchBanks();
    } catch {
      toast({
        title: "Erreur",
        description: "Modification échouée",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // 🔹 DELETE
  const openDelete = (bank: any) => {
    setSelectedBank(bank);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await bankService.deleteBank(selectedBank.id);

      toast({
        title: "Supprimé 🗑",
        description: "Banque supprimée",
      });

      setIsDeleteOpen(false);
      setSelectedBank(null);
      fetchBanks();
    } catch {
      toast({
        title: "Erreur",
        description: "Suppression échouée",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Banques</h1>

        <div className="flex gap-2">
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Button
            onClick={() => {
              setForm(emptyForm);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banks.map((bank) => (
          <Card key={bank.id} className="shadow-md rounded-xl">
            <CardHeader className="bg-primary/10 flex items-center gap-2">
              <CardTitle>{bank.bank_name}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
              <div>
                <CreditCard className="inline mr-1" />
                {bank.account_number}
              </div>

              {bank.iban && (
                <div>
                  <DollarSign className="inline mr-1" />
                  {bank.iban}
                </div>
              )}

              <div>
                Solde: <strong>{bank.balance} DT</strong>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => openEdit(bank)}>
                  Modifier
                </Button>

                <Button variant="destructive" onClick={() => openDelete(bank)}>
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL CREATE / EDIT */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditOpen ? "Modifier" : "Créer"} banque
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* 🔥 RIB */}
            <Input
              placeholder="Numéro de compte (RIB)"
              value={form.account_number}
              onChange={(e) =>
                handleAccountNumberChange(e.target.value)
              }
            />

            {/* 🔥 Nom auto */}
            <Input
              placeholder="Banque"
              value={form.bank_name}
              disabled
              className="bg-gray-100"
            />

            {ribError && (
              <p className="text-red-500 text-sm">{ribError}</p>
            )}

            <Input
              placeholder="IBAN"
              value={form.iban}
              onChange={(e) =>
                setForm({ ...form, iban: e.target.value })
              }
            />

            <Input
              placeholder="Solde"
              type="number"
              value={form.balance}
              onChange={(e) =>
                setForm({ ...form, balance: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button
              onClick={isEditOpen ? handleUpdate : handleCreate}
              disabled={formLoading}
            >
              {formLoading
                ? "Chargement..."
                : isEditOpen
                ? "Modifier"
                : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer suppression</DialogTitle>
          </DialogHeader>

          <p>
            Supprimer <strong>{selectedBank?.bank_name}</strong> ?
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
            >
              Annuler
            </Button>

            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}