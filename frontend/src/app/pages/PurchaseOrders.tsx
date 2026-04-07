import { useState, useEffect } from "react";
import { Plus, Trash2, FileText, CheckCircle, Package } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useBusiness } from "@/app/context/BusinessContext";
import { productsService } from "@/app/services/productsService";
import { purchaseOrdersService } from "@/app/services/purchaseOrdersService";
import { supplierService } from "@/app/services/supplierService";

// ─── Types ────────────────────────────────────────────────────
interface PurchaseOrder {
    id: number;
    order_number: string;
    order_date: string;
    status: string;
    total_amount: number;
    fournisseurs?: { name: string };
    _count?: { items: number };
}

interface Product {
    id: number;
    name: string;
    unit_price: number;
}

interface Supplier {
    id: number;
    name: string;
}

interface OrderItemForm {
    product_id: string;
    quantity: number;
    unit_price: number;
}

// ─── Modal Form ───────────────────────────────────────────────
function PurchaseOrderModal({
    onClose,
    onSave,
    businessId,
    refreshData,
    products,
    suppliers
}: {
    onClose: () => void;
    onSave: () => void;
    businessId: number;
    refreshData: () => void;
    products: Product[];
    suppliers: Supplier[];
}) {
    const [supplierId, setSupplierId] = useState("");
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

    const [items, setItems] = useState<OrderItemForm[]>([
        { product_id: "", quantity: 1, unit_price: 0 }
    ]);
    const [loading, setLoading] = useState(false);
    const [isAddingSupplier, setIsAddingSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState("");
    const [isSavingSupplier, setIsSavingSupplier] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: "",
        description: "",
        reference: "",
        barcode: "",
        unit_price: "", // On utilise des strings vides par défaut pour l'affichage propre des inputs
        cost_price: "",
        tax_rate: "19", // Valeur par défaut courante (ex: 19%)
        category: "",
        unit: "",
        is_active: true,
        fournisseur_id: ""
    });
    const handleProductChange = (field: string, value: any) => {
        setNewProduct(prev => ({ ...prev, [field]: value }));
    };
    const handleCreateProduct = async () => {
        if (!newProduct.name.trim() || newProduct.unit_price === "") return;
        setIsSavingProduct(true);
        try {
            await productsService.createProduct(businessId, {
                name: newProduct.name,
                description: newProduct.description || undefined,
                reference: newProduct.reference || undefined,
                barcode: newProduct.barcode || undefined,
                unit_price: Number(newProduct.unit_price),
                cost_price: newProduct.cost_price ? Number(newProduct.cost_price) : undefined,
                tax_rate: newProduct.tax_rate ? Number(newProduct.tax_rate) : undefined,
                category: newProduct.category || undefined,
                unit: newProduct.unit || undefined,
                is_active: newProduct.is_active,
                fournisseur_id: newProduct.fournisseur_id ? Number(newProduct.fournisseur_id) : undefined,
            });

            await refreshData(); // Rafraîchit le catalogue

            // On réinitialise et on ferme le formulaire
            setNewProduct({
                name: "", description: "", reference: "", barcode: "",
                unit_price: "", cost_price: "", tax_rate: "19",
                category: "", unit: "", is_active: true, fournisseur_id: ""
            });
            setIsAddingProduct(false);
        } catch (err) {
            console.error("Erreur lors de la création du produit", err);
            alert("Erreur lors de la création du produit.");
        } finally {
            setIsSavingProduct(false);
        }
    };
    const [isSavingProduct, setIsSavingProduct] = useState(false);
    const addItem = () => {
        setItems([...items, { product_id: "", quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof OrderItemForm, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        if (field === 'product_id') {
            const selectedProduct = products.find(p => p.id.toString() === value);
            if (selectedProduct) {
                newItems[index].unit_price = selectedProduct.unit_price;
            }
        }
        setItems(newItems);
    };
    const handleCreateSupplier = async () => {
        if (!newSupplierName.trim()) return;
        setIsSavingSupplier(true);
        try {
            const res = await supplierService.create(businessId, { name: newSupplierName });

            await refreshData();

            setSupplierId(res.data.id.toString());
            setIsAddingSupplier(false);
            setNewSupplierName("");
        } catch (err) {
            console.error("Erreur lors de la création du fournisseur", err);
            alert("Erreur lors de la création du fournisseur.");
        } finally {
            setIsSavingSupplier(false);
        }
    };
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    const handleSubmit = async () => {
        if (!supplierId || items.some(i => !i.product_id)) return alert("Veuillez remplir tous les champs obligatoires");

        setLoading(true);
        try {
            await purchaseOrdersService.createPurchaseOrder(businessId, {
                supplier_id: Number(supplierId),
                order_date: orderDate,
                total_amount: totalAmount,
                items: items.map(i => ({
                    ...i,
                    product_id: Number(i.product_id),
                }))
            });
            onSave();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">Nouveau Bon de Commande</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">

                        <div>
                            <div>
                                <Label>Fournisseur *</Label>
                                {isAddingSupplier ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Input
                                            placeholder="Nom du fournisseur..."
                                            value={newSupplierName}
                                            onChange={(e) => setNewSupplierName(e.target.value)}
                                            autoFocus
                                        />
                                        <Button size="sm" onClick={handleCreateSupplier} disabled={isSavingSupplier || !newSupplierName.trim()}>
                                            {isSavingSupplier ? "..." : "OK"}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsAddingSupplier(false)}>
                                            Annuler
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-1">
                                        <select
                                            value={supplierId}
                                            onChange={e => setSupplierId(e.target.value)}
                                            className="flex-1 border rounded-md px-3 py-2"
                                        >
                                            <option value="">Sélectionnez un fournisseur</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="px-3"
                                            onClick={() => setIsAddingSupplier(true)}
                                            title="Ajouter un nouveau fournisseur"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <Label>Date de commande</Label>
                            <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="mt-1" />
                        </div>
                    </div>
                    {/* --- ZONE D'AJOUT DE PRODUIT (COMPLET) --- */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Articles de la commande</Label>
                            {!isAddingProduct && (
                                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingProduct(true)}>
                                    <Plus className="h-4 w-4 mr-2" /> Nouveau Produit
                                </Button>
                            )}
                        </div>

                        {isAddingProduct && (
                            <div className="bg-blue-50/30 border border-blue-200 p-5 rounded-xl space-y-4 mb-2 shadow-sm">
                                <h4 className="font-medium text-blue-900 border-b border-blue-100 pb-2">Création rapide d'un produit</h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Ligne 1 */}
                                    <div>
                                        <Label>Nom du produit *</Label>
                                        <Input autoFocus value={newProduct.name} onChange={e => handleProductChange('name', e.target.value)} className="mt-1 bg-white" />
                                    </div>
                                    <div>
                                        <Label>Référence</Label>
                                        <Input value={newProduct.reference} onChange={e => handleProductChange('reference', e.target.value)} className="mt-1 bg-white" />
                                    </div>
                                    <div>
                                        <Label>Code Barre</Label>
                                        <Input value={newProduct.barcode} onChange={e => handleProductChange('barcode', e.target.value)} className="mt-1 bg-white" />
                                    </div>

                                    {/* Ligne 2 : Prix et Taxes */}
                                    <div>
                                        <Label>Prix de vente (TND) *</Label>
                                        <Input type="number" min="0" step="0.01" value={newProduct.unit_price} onChange={e => handleProductChange('unit_price', e.target.value)} className="mt-1 bg-white" />
                                    </div>
                                    <div>
                                        <Label>Coût d'achat (TND)</Label>
                                        <Input type="number" min="0" step="0.01" value={newProduct.cost_price} onChange={e => handleProductChange('cost_price', e.target.value)} className="mt-1 bg-white" />
                                    </div>
                                    <div>
                                        <Label>TVA (%)</Label>
                                        <Input type="number" min="0" value={newProduct.tax_rate} onChange={e => handleProductChange('tax_rate', e.target.value)} className="mt-1 bg-white" />
                                    </div>

                                    {/* Ligne 3 : Catégorie, Unité et Fournisseur */}
                                    <div>
                                        <Label>Catégorie</Label>
                                        <Input value={newProduct.category} onChange={e => handleProductChange('category', e.target.value)} placeholder="Ex: Informatique..." className="mt-1 bg-white" />
                                    </div>
                                    <div>
                                        <Label>Unité</Label>
                                        <Input value={newProduct.unit} onChange={e => handleProductChange('unit', e.target.value)} placeholder="Ex: Kg, Pièce, Litre..." className="mt-1 bg-white" />
                                    </div>
                                    <div>
                                        <Label>Fournisseur par défaut</Label>
                                        <select
                                            value={newProduct.fournisseur_id}
                                            onChange={e => handleProductChange('fournisseur_id', e.target.value)}
                                            className="w-full mt-1 border rounded-md px-3 py-2 bg-white"
                                        >
                                            <option value="">Aucun</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Description et Statut */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                                    <div className="md:col-span-3">
                                        <Label>Description</Label>
                                        <Input value={newProduct.description} onChange={e => handleProductChange('description', e.target.value)} className="mt-1 bg-white" />
                                    </div>
                                    <div className="flex items-center gap-2 mt-8">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={newProduct.is_active}
                                            onChange={e => handleProductChange('is_active', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <Label htmlFor="is_active" className="cursor-pointer">Produit actif</Label>
                                    </div>
                                </div>

                                {/* Boutons d'action */}
                                <div className="flex justify-end gap-2 pt-2 border-t border-blue-100">
                                    <Button type="button" variant="ghost" onClick={() => setIsAddingProduct(false)}>
                                        Annuler
                                    </Button>
                                    <Button type="button" onClick={handleCreateProduct} disabled={isSavingProduct || !newProduct.name.trim() || newProduct.unit_price === ""}>
                                        {isSavingProduct ? "Création..." : "Ajouter ce produit au catalogue"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* -------------------------------------- */}
                    <div className="border rounded-xl overflow-hidden">

                        <div className="bg-muted px-4 py-3 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                            <div className="col-span-5">Produit</div>
                            <div className="col-span-2">Quantité</div>
                            <div className="col-span-2">Prix Unitaire</div>
                            <div className="col-span-2">Total</div>
                            <div className="col-span-1"></div>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className="px-4 py-3 grid grid-cols-12 gap-4 items-center border-t">
                                <div className="col-span-5">
                                    <select value={item.product_id} onChange={e => updateItem(index, 'product_id', e.target.value)} className="w-full border rounded-md px-3 py-2">
                                        <option value="">Sélectionner...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(index, 'quantity', Number(e.target.value))} />
                                </div>
                                <div className="col-span-2">
                                    <Input type="number" value={item.unit_price} onChange={e => updateItem(index, 'unit_price', Number(e.target.value))} />
                                </div>
                                <div className="col-span-2 font-medium">
                                    {(item.quantity * item.unit_price).toFixed(2)}
                                </div>
                                <div className="col-span-1 text-right">
                                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <div className="bg-gray-50 px-4 py-3 border-t">
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="h-4 w-4 mr-2" /> Ajouter une ligne
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end text-lg font-semibold">
                        Total : {totalAmount.toFixed(2)} TND
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-primary text-white">
                        {loading ? "Sauvegarde..." : "Créer le brouillon"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────
export default function PurchaseOrders() {
    const { activeBusiness } = useBusiness();
    const businessId = activeBusiness?.id;

    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    useEffect(() => {
        if (businessId) fetchData();
    }, [businessId]);

    const fetchData = async () => {
        try {
            const [ordersRes, productsRes, suppliersRes] = await Promise.all([
                purchaseOrdersService.getPurchaseOrders(businessId!),
                productsService.getProducts(businessId!),
                supplierService.getAll(businessId!) // <-- Utilisation de votre service ici !
            ]);
            setOrders(ordersRes.data);
            setProducts(productsRes.data);
            setSuppliers(suppliersRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (id: number) => {
        if (!confirm("Voulez-vous valider cette commande ? Cela mettra à jour le stock et créera une dépense.")) return;
        try {
            await purchaseOrdersService.validateOrder(businessId!, id);
            fetchData(); // Rafraîchir pour voir le nouveau statut
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la validation de la commande.");
        }
    };

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-foreground">Bons de Commande</h1>
                    <p className="text-muted-foreground mt-1">Gérez vos achats fournisseurs et votre stock entrant</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Commande
                </Button>
            </div>

            <Card className="border-border shadow-sm">
                <CardContent className="pt-6">
                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-muted-foreground">Aucun bon de commande trouvé</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Numéro</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fournisseur</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Articles</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                                    </tr>

                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id} className="border-b hover:bg-muted/50">
              
                                            <td className="py-3 px-4 font-medium">{order.order_number}</td>
                                            <td className="py-3 px-4">{order.fournisseurs?.name || "-"}</td>
                                            <td className="py-3 px-4">{new Date(order.order_date).toLocaleDateString()}</td>
                                            <td className="py-3 px-4">
                                                <span className="flex items-center gap-1"><Package className="h-4 w-4" /> {order._count?.items}</span>
                                            </td>
                                            <td className="py-3 px-4 font-semibold">{Number(order.total_amount).toFixed(2)} TND</td>
                                            <td className="py-3 px-4">
                                                {order.status === 'VALIDATED' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                                        <CheckCircle className="h-3 w-3" /> Validé
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                                                        Brouillon
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {order.status === 'DRAFT' && (
                                                    <Button size="sm" onClick={() => handleValidate(order.id)} className="bg-green-600 hover:bg-green-700 text-white">
                                                        Valider la réception
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {showModal && businessId && (
                <PurchaseOrderModal
                    businessId={businessId}
                    products={products}
                    suppliers={suppliers}
                    onClose={() => setShowModal(false)}
                    onSave={fetchData}
                    refreshData={fetchData}
                />
            )}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h2 className="text-xl font-bold">Détails de la commande</h2>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            <p><span className="font-semibold text-gray-600">Numéro :</span> {selectedOrder.order_number}</p>
                            <p><span className="font-semibold text-gray-600">Fournisseur :</span> {selectedOrder.fournisseurs?.name}</p>
                            <p><span className="font-semibold text-gray-600">Date :</span> {new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                            <p><span className="font-semibold text-gray-600">Total :</span> {Number(selectedOrder.total_amount).toFixed(2)} TND</p>
                            <p><span className="font-semibold text-gray-600">Nombre d'articles :</span> {selectedOrder._count?.items}</p>
                        </div>

                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                                Fermer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}