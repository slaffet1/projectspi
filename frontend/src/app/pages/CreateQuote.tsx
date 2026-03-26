import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";
import { api } from "@/app/services/api";
import { quoteService } from "@/app/services/quoteService";
import { clientService } from "@/app/services/clientService";
// Note: Adjust these imports based on your actual service files
// import { clientService } from "@/app/services/clientService";
// import { productService } from "@/app/services/productService";
import { useBusiness } from "@/app/context/BusinessContext";
interface QuoteItem {
    product_id: string;
    quantity: number;
    unit_price: number; // Used for frontend calculation
    tax_rate: number;
}

export default function CreateQuote() {
    const { activeBusiness } = useBusiness();
    const businessId = activeBusiness?.id;
    const navigate = useNavigate();

    // Form State
    const [clientId, setClientId] = useState<string>("");
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [expirationDate, setExpirationDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30); // Default to 30 days validity
        return date.toISOString().split('T')[0];
    });
    const [items, setItems] = useState<QuoteItem[]>([
        { product_id: "", quantity: 1, unit_price: 0, tax_rate: 0 }
    ]);

    // Data State for Dropdowns
    const [clients, setClients] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!businessId) return;
        fetchDropdownData();
    }, [businessId]);

    const fetchDropdownData = async () => {
        setLoading(true);

        // 1. Fetch Products Safely
        try {
            const productsRes = await api.get(`/api/businesses/${businessId}/products`);
            setProducts(productsRes.data);
        } catch (error) {
            console.error("Erreur lors du chargement des produits:", error);
            toast.error("Impossible de charger les produits");
        }

        // 2. Fetch Clients Safely
        try {
            const clientsRes = await clientService.getClients();
            setClients(clientsRes.data);
        } catch (error) {
            console.error("Erreur lors du chargement des clients:", error);
            // If the backend route doesn't exist yet, it will fail here, 
            // but your products are already safely loaded above!
            toast.error("Impossible de charger les clients");
        } finally {
            setLoading(false);
        }
    };

    // Calculations
    const totalHT = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalAmount = items.reduce((sum, item) => {
        const lineHT = item.quantity * item.unit_price;
        const lineTax = lineHT * (item.tax_rate / 100);
        return sum + lineHT + lineTax;
    }, 0);
    // Handlers
    const handleAddItem = () => {
        setItems([...items, { product_id: "", quantity: 1, unit_price: 0, tax_rate: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
        const newItems = [...items];
        if (field === "product_id") {
            const selectedProduct = products.find(p => p.id.toString() === value);
            newItems[index].product_id = value;
            newItems[index].unit_price = selectedProduct ? Number(selectedProduct.unit_price) : 0;
            newItems[index].tax_rate = selectedProduct && selectedProduct.tax_rate ? Number(selectedProduct.tax_rate) : 0;
        } else {
            newItems[index][field] = value as never;
        }
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) return toast.warning("Veuillez sélectionner un client");
        if (items.some(i => !i.product_id || i.quantity <= 0)) {
            return toast.warning("Veuillez remplir correctement tous les articles");
        }

        setLoading(true);
        try {
            const payload = {
                client_id: Number(clientId),
                issue_date: issueDate,
                expiration_date: expirationDate,
                total_amount: totalAmount,
                status: "draft",
                details: items.map(item => ({
                    product_id: Number(item.product_id),
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price), // Satisfies the unit_price requirement
                    tax_rate: Number(item.tax_rate)      // Satisfies the tax_rate requirement (defaulting to 0)
                }))
            };

            // Assuming your quoteService has a create method like this:
            await quoteService.create(businessId!, payload);
            toast.success("Devis créé avec succès !");
            navigate("/app/quotes");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Erreur lors de la création du devis");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/app/quotes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-semibold text-foreground">Nouveau Devis</h1>
                    <p className="text-muted-foreground mt-1">Créer un devis en brouillon</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Info Card */}
                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Informations générales</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Client *</Label>
                            <Select value={clientId} onValueChange={setClientId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Date d'émission *</Label>
                            <Input
                                type="date"
                                value={issueDate}
                                onChange={e => setIssueDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Date d'expiration *</Label>
                            <Input
                                type="date"
                                value={expirationDate}
                                onChange={e => setExpirationDate(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Products Card */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Articles du devis</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une ligne
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Header Row */}
                            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                                <div className="col-span-6">Produit</div>
                                <div className="col-span-2 text-center">Quantité</div>
                                <div className="col-span-2 text-right">Prix Unitaire</div>
                                <div className="col-span-1 text-right">Total</div>
                                <div className="col-span-1 text-center">Action</div>
                            </div>

                            {/* Line Items */}
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-6">
                                        <Select
                                            value={item.product_id}
                                            onValueChange={(val) => handleItemChange(index, "product_id", val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choisir un produit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                                            className="text-center"
                                        />
                                    </div>
                                    <div className="col-span-2 text-right text-sm">
                                        {item.unit_price.toLocaleString("fr-TN")} DT
                                    </div>
                                    <div className="col-span-1 text-right text-sm font-medium">
                                        {(item.quantity * item.unit_price).toLocaleString("fr-TN")} DT
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveItem(index)}
                                            disabled={items.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total Summary */}
                        <div className="mt-8 flex justify-end">
                            <div className="w-72 bg-muted/50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>Total HT :</span>
                                    <span>{totalHT.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} DT</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-muted-foreground border-b pb-2">
                                    <span>TVA :</span>
                                    <span>{(totalAmount - totalHT).toLocaleString("fr-TN", { minimumFractionDigits: 3 })} DT</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold pt-1">
                                    <span>Total TTC :</span>
                                    <span className="text-primary">{totalAmount.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} DT</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Actions */}
                <div className="flex justify-end gap-4">
                    <Link to="/app/quotes">
                        <Button type="button" variant="outline">Annuler</Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? "Création..." : "Enregistrer le devis"}
                    </Button>
                </div>
            </form>
        </div>
    );
}