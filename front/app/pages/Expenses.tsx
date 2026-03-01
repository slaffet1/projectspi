import { useState } from "react";
import { Plus, Filter, Calendar, Tag } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { SearchInput } from "@/app/components/SearchInput";
import { mockExpenses, expenseCategories } from "@/app/data/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";

export default function Expenses() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExpenses = mockExpenses.filter((expense) => {
    const matchesCategory =
      categoryFilter === "all" ||
      expense.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch = expense.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const getCategoryInfo = (categoryName: string) => {
    return (
      expenseCategories.find(
        (cat) => cat.label.toLowerCase() === categoryName.toLowerCase()
      ) || expenseCategories[0]
    );
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dépenses</h1>
          <p className="text-muted-foreground mt-1">
            Suivez toutes vos dépenses professionnelles
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle dépense
        </Button>
      </div>

      {/* Filtres */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Rechercher une dépense..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <SelectTrigger className="w-full md:w-56">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.value} value={category.label}>
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques par catégorie */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {expenseCategories.map((category) => {
          const categoryExpenses = mockExpenses.filter(
            (exp) => exp.category.toLowerCase() === category.label.toLowerCase()
          );
          const categoryTotal = categoryExpenses.reduce(
            (sum, exp) => sum + exp.amount,
            0
          );

          return (
            <Card
              key={category.value}
              className="border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setCategoryFilter(category.label)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{category.icon}</span>
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{category.label}</p>
                <p className="text-lg font-semibold mt-1">
                  {categoryTotal.toFixed(0)} DT
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {categoryExpenses.length} dépense(s)
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Liste des dépenses */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Liste des dépenses ({filteredExpenses.length})
          </CardTitle>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total affiché</p>
            <p className="text-xl font-semibold text-primary">
              {totalExpenses.toFixed(2)} DT
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                    Date
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                    Description
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                    Catégorie
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                    Montant
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => {
                  const categoryInfo = getCategoryInfo(expense.category);

                  return (
                    <tr
                      key={expense.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium">{expense.description}</p>
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          variant="outline"
                          className="border-0"
                          style={{
                            backgroundColor: `${categoryInfo.color}20`,
                            color: categoryInfo.color,
                          }}
                        >
                          <span className="mr-1">{categoryInfo.icon}</span>
                          {expense.category}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium">
                          {expense.amount.toFixed(2)} DT
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredExpenses.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                Aucune dépense ne correspond à vos critères
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résumé mensuel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total du mois</p>
            <p className="text-2xl font-semibold mt-1">
              {mockExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)} DT
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Nombre de dépenses</p>
            <p className="text-2xl font-semibold mt-1">{mockExpenses.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Dépense moyenne</p>
            <p className="text-2xl font-semibold mt-1">
              {mockExpenses.length > 0
                ? (
                    mockExpenses.reduce((sum, exp) => sum + exp.amount, 0) /
                    mockExpenses.length
                  ).toFixed(2)
                : 0}{" "}
              DT
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
