import { useEffect, useState } from "react";
import { Plus, Mail, Phone, MapPin, Search, Users, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Link } from "react-router";
import { clientService } from "@/app/services/clientService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Clients() {
  const { toast } = useToast();

  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    address: "",
  };

  const emptyErrors = {
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
  const [errors, setErrors] = useState(emptyErrors);
  const [formLoading, setFormLoading] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await clientService.getClients();
      setClients(res.data);
    } catch {
      toast({ title: "Error", description: "Failed to load clients", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!searchQuery) return fetchClients();
      try {
        const res = await clientService.searchClients(searchQuery);
        setClients(res.data);
      } catch {
        toast({ title: "Error", description: "Search failed", variant: "destructive" });
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // ===== Validation frontend =====
  const validateForm = () => {
    const newErrors = { ...emptyErrors };
    let valid = true;

    if (!form.name.trim()) {
      newErrors.name = "Full name is required";
      valid = false;
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
      newErrors.email = "Invalid email address";
      valid = false;
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
      valid = false;
    } else if (!/^\+?\d{6,15}$/.test(form.phone.replace(/\s+/g, ""))) {
      newErrors.phone = "Invalid phone number";
      valid = false;
    }

    if (!form.address.trim()) {
      newErrors.address = "Address is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      await clientService.createClient(form);
      toast({ title: "Success 🎉", description: "Client created" });
      setIsCreateOpen(false);
      setForm(emptyForm);
      setErrors(emptyErrors);
      fetchClients();
    } catch {
      toast({ title: "Error", description: "Creation failed", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      await clientService.updateClient(selectedClient.id, form);
      toast({ title: "Success ✨", description: "Client updated" });
      setIsEditOpen(false);
      setForm(emptyForm);
      setErrors(emptyErrors);
      setSelectedClient(null);
      fetchClients();
    } catch {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (client: any) => {
    setSelectedClient(client);
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
    });
    setErrors(emptyErrors);
    setIsEditOpen(true);
  };

  const openDelete = (client: any) => {
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await clientService.deleteClient(selectedClient.id);
      toast({ title: "Deleted 🗑", description: "Client removed" });
      setIsDeleteOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch {
      toast({ title: "Error", description: "Deletion failed", variant: "destructive" });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarColors = [
    "bg-blue-500", "bg-violet-500", "bg-emerald-500",
    "bg-orange-500", "bg-cyan-500", "bg-pink-500",
  ];

  const getColor = (id: number) => avatarColors[id % avatarColors.length];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your client list</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Button onClick={() => { setForm(emptyForm); setErrors(emptyErrors); setSelectedClient(null); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Client
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
      {!loading && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">No clients yet</h2>
            <p className="text-muted-foreground mt-1">Add your first client to get started</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setErrors(emptyErrors); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      )}

      {/* LIST */}
      {!loading && clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card key={client.id} className="shadow-sm rounded-xl border border-border hover:shadow-md transition-shadow overflow-hidden">
              <div className={`h-2 w-full ${getColor(client.id)}`} />
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className={`h-10 w-10 rounded-xl ${getColor(client.id)} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-sm font-bold">{getInitials(client.name)}</span>
                </div>
                <CardTitle className="text-lg">{client.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                  <Link to={`/app/clients/${client.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEdit(client)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDelete(client)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            setForm(emptyForm);
            setErrors(emptyErrors);
            setSelectedClient(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Edit" : "New"} Client</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <Input
                placeholder="e.g. John Doe"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                placeholder="e.g. john@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <Input
                placeholder="e.g. +216 12 345 678"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
              {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Address</label>
              <Input
                placeholder="e.g. Tunis, Tunisia"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
              {errors.address && <p className="text-destructive text-sm mt-1">{errors.address}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); setErrors(emptyErrors); }}>
              Cancel
            </Button>
            <Button onClick={isEditOpen ? handleUpdate : handleCreate} disabled={formLoading}>
              {formLoading ? "Saving..." : isEditOpen ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete <strong className="text-foreground">{selectedClient?.name}</strong>? This action cannot be undone.
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