import { useEffect, useState } from "react";
import { Plus, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { SearchInput } from "@/app/components/SearchInput";
import { Link } from "react-router";
import { clientService } from "@/app/services/clientService";
import { useBusiness } from "@/app/context/BusinessContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Clients() {
  const { toast } = useToast();

  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    address: "",
  };

  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch
  const fetchClients = async () => {
    try {
      const res = await clientService.getClients();
      setClients(res.data);
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
    fetchClients();
  }, []);

  // Search
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!searchQuery) return fetchClients();

      try {
        const res = await clientService.searchClients(searchQuery);
        setClients(res.data);
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

  // CREATE
  const handleCreate = async () => {
    setFormLoading(true);
    try {
      await clientService.createClient(form);

      toast({
        title: "Succès 🎉",
        description: "Client créé",
      });

      setIsCreateOpen(false);
      setForm(emptyForm);
      fetchClients();
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

  // EDIT
  const openEdit = (client: any) => {
    setSelectedClient(client);
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    setFormLoading(true);
    try {
      await clientService.updateClient(selectedClient.id, form);

      toast({
        title: "Succès ✨",
        description: "Client modifié",
      });

      setIsEditOpen(false);
      setForm(emptyForm);
      setSelectedClient(null);
      fetchClients();
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

  // DELETE
  const openDelete = (client: any) => {
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await clientService.deleteClient(selectedClient.id);

      toast({
        title: "Supprimé 🗑",
        description: "Client supprimé",
      });

      setIsDeleteOpen(false);
      setSelectedClient(null);
      fetchClients();
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
      {/* Header */}
      <div className="flex justify-between">
        <h1 className="text-3xl font-semibold">Clients</h1>

        <Button
          onClick={() => {
            setForm(emptyForm);        // ✅ reset form
            setSelectedClient(null);   // ✅ sécurité
            setIsCreateOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau
        </Button>
      </div>

      {/* Search */}
      <SearchInput value={searchQuery} onChange={setSearchQuery} />

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <CardTitle>{client.name}</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                {client.email && <div><Mail className="inline mr-1" />{client.email}</div>}
                {client.phone && <div><Phone className="inline mr-1" />{client.phone}</div>}
                {client.address && <div><MapPin className="inline mr-1" />{client.address}</div>}
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => openEdit(client)}>
                  Modifier
                </Button>
                <Button variant="destructive" onClick={() => openDelete(client)}>
                  Supprimer
                </Button>
              </div>

              <Link to={`/app/clients/${client.id}`}>
                <Button className="w-full mt-2" variant="outline">
                  Voir détail
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            setForm(emptyForm);        // ✅ reset
            setSelectedClient(null);   // ✅ cleanup
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditOpen ? "Modifier" : "Créer"} client
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input placeholder="Nom" value={form.name} onChange={e => setForm({...form, name:e.target.value})}/>
            <Input placeholder="Email" value={form.email} onChange={e => setForm({...form, email:e.target.value})}/>
            <Input placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})}/>
            <Input placeholder="Adresse" value={form.address} onChange={e => setForm({...form, address:e.target.value})}/>
          </div>

          <DialogFooter>
            <Button onClick={isEditOpen ? handleUpdate : handleCreate} disabled={formLoading}>
              {formLoading ? "Chargement..." : isEditOpen ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>

          <p>
            Supprimer <strong>{selectedClient?.name}</strong> ?
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
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