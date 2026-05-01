import { useEffect, useState } from "react";
import { Plus, Calendar, Tag, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { SearchInput } from "@/app/components/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { useBusiness } from "@/app/context/BusinessContext";
import { expenseService, categoryService } from "@/app/services/expenseService";
import { toast } from "react-toastify";
import ExpenseModal from "../components/ExpenseModal";
import CategoryModal from "../components/CategoryModal";

export default function Expenses() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id;

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
const [openEditModal, setOpenEditModal] = useState(false);
const [selectedExpense, setSelectedExpense] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
const [openModal, setOpenModal] = useState(false);
const [openCategoryModal, setOpenCategoryModal] = useState(false);

  // FETCH DATA
  useEffect(() => {
    if (!businessId) return;
    fetchAll();
  }, [businessId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([
        expenseService.getAll(businessId),
        categoryService.getAll(businessId),
      ]);

      setExpenses(expRes.data);
      setCategories(catRes.data);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (expense) => {
  setSelectedExpense(expense);
  setOpenEditModal(true);
};
  const handleChangeStatus = async (expense) => {
  const next =
    expense.status === "pending"
      ? "approved"
      : expense.status === "approved"
      ? "rejected"
      : "pending";

  try {
    await expenseService.update(businessId, expense.id, {
      status: next,
    });

    toast.success("Status mis à jour");

    setExpenses((prev) =>
      prev.map((e) =>
        e.id === expense.id ? { ...e, status: next } : e
      )
    );
  } catch (err: any) {
    toast.error("Erreur status");
  }
};
const handleDeleteCategory = async (id: number, e: any) => {
  e.stopPropagation(); // important (évite de trigger le filter)

  if (!confirm("Supprimer cette catégorie ?")) return;

  try {
    await categoryService.delete(businessId, id);
    toast.success("Catégorie supprimée");
    fetchAll(); // refresh categories + expenses
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Erreur");
  }
};
  // DELETE
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette dépense ?")) return;

    try {
      await expenseService.remove(businessId, id);
      setExpenses(expenses.filter((e) => e.id !== id));
      toast.success("Dépense supprimée");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur");
    }
  };

  // FILTER
  const filteredExpenses = expenses.filter((exp) => {
    const matchCategory =
      categoryFilter === "all" ||
      exp.category?.name === categoryFilter;

    const matchSearch = exp.label
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchCategory && matchSearch;
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );

  // 🔥 STATS PAR CATEGORIE
  const getCategoryStats = (catName) => {
    const catExpenses = expenses.filter(
      (exp) => exp.category?.name === catName
    );

    return {
      total: catExpenses.reduce((s, e) => s + Number(e.amount), 0),
      count: catExpenses.length,
    };
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dépenses</h1>
          <p className="text-muted-foreground">
            Gérez toutes vos dépenses
          </p>
        </div>
       <div className="flex gap-2">
  <Button variant="outline" onClick={() => setOpenCategoryModal(true)}>
    <Plus className="h-4 w-4 mr-2" />
    Nouvelle catégorie
  </Button>

  <Button onClick={() => setOpenModal(true)}>
    <Plus className="h-4 w-4 mr-2" />
    Nouvelle dépense
  </Button>
</div>
      </div>

      {/* FILTERS */}
      <Card>
        <CardContent className="pt-6 flex gap-4">
          <SearchInput
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={setSearchQuery}
          />

          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-56">
              <Tag className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
        </CardContent>
      </Card>

      {/* 🔥 CATEGORIES CARDS (AJOUT IMPORTANT) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
  {categories.map((cat) => {
    const stats = getCategoryStats(cat.name);

    return (
      <Card
        key={cat.id}
        className={`group cursor-pointer transition ${
          categoryFilter === cat.name
            ? "border-2 border-primary"
            : "hover:shadow-md"
        }`}
        onClick={() => setCategoryFilter(cat.name)}
      >
        <CardContent className="pt-6">

          {/* HEADER ICON + DELETE */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-xl">{cat.icon || "📦"}</span>

            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: cat.color || "#ccc" }}
              />

              {/* 🗑️ DELETE ICON */}
              <button
                onClick={(e) => handleDeleteCategory(cat.id, e)}
                className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <p className="text-sm text-muted-foreground">
            {cat.name}
          </p>

          <p className="text-lg font-semibold mt-1">
            {stats.total.toFixed(0)} TND
          </p>

          <p className="text-xs text-muted-foreground">
            {stats.count} dépense(s)
          </p>

        </CardContent>
      </Card>
    );
  })}
</div>

      {/* TABLE */}
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>
            Liste ({filteredExpenses.length})
          </CardTitle>

          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-semibold text-primary">
              {totalExpenses.toFixed(2)} TND
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Label</th>
                <th className="p-4 text-left">Catégorie</th>
                <th className="p-4 text-left">Montant</th>
                <th className="p-4 text-left">Actions</th>
                <th className="p-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10">
                    Loading...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10">
                    Aucune dépense
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(exp.expense_date).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="p-4">{exp.label}</td>

                    <td className="p-4">
                      <Badge
                        style={{
                          backgroundColor: exp.category?.color + "20",
                          color: exp.category?.color,
                        }}
                      >
                        {exp.category?.icon} {exp.category?.name}
                      </Badge>
                    </td>

                    <td className="p-4 font-medium">
                      {Number(exp.amount).toFixed(2)} TND
                    </td>

                    <td className="p-4 flex gap-2">
  {/* 📝 UPDATE */}
  <Button
    variant="ghost"
    size="sm"
    onClick={() => handleEdit(exp)}
  >
    ✏️
  </Button>

  {/* 🗑️ DELETE */}
  <Button
    variant="ghost"
    size="sm"
    onClick={(e) => handleDelete(exp.id, e)}
  >
    <Trash2 className="h-4 w-4 text-red-500" />
  </Button>
</td>
                    <td className="p-4">
  <button
    onClick={() => handleChangeStatus(exp)}
    className="cursor-pointer"
  >
    <Badge
      className="capitalize"
      style={{
        backgroundColor:
          exp.status === "approved"
            ? "#16a34a20"
            : exp.status === "rejected"
            ? "#dc262620"
            : "#f59e0b20",
        color:
          exp.status === "approved"
            ? "#16a34a"
            : exp.status === "rejected"
            ? "#dc2626"
            : "#f59e0b",
      }}
    >
      {exp.status || "pending"}
    </Badge>
  </button>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p>Total dépenses</p>
            <p className="text-xl font-bold">
              {expenses.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p>Total montant</p>
            <p className="text-xl font-bold">
              {expenses
                .reduce((s, e) => s + Number(e.amount), 0)
                .toFixed(2)}{" "}
              TND
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p>Moyenne</p>
            <p className="text-xl font-bold">
              {expenses.length > 0
                ? (
                    expenses.reduce((s, e) => s + Number(e.amount), 0) /
                    expenses.length
                  ).toFixed(2)
                : 0}{" "}
              TND
            </p>
          </CardContent>
        </Card>
      </div>
      <ExpenseModal
  open={openModal}
  setOpen={setOpenModal}
  businessId={businessId}
  categories={categories}
  onSuccess={fetchAll}
/>
<ExpenseModal
  open={openEditModal}
  setOpen={setOpenEditModal}
  businessId={businessId}
  categories={categories}
  onSuccess={fetchAll}
  expense={selectedExpense} // 👈 IMPORTANT
/>
<CategoryModal
  open={openCategoryModal}
  setOpen={setOpenCategoryModal}
  businessId={businessId}
  onSuccess={fetchAll}
/>
    </div>
    
  );
}