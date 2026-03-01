import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Building2 } from "lucide-react";
import { KPICard } from "@/app/components/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { StatusBadge } from "@/app/components/StatusBadge";
import { Button } from "@/app/components/ui/button";
import { mockInvoices, revenueExpenseData, expenseCategoryData } from "@/app/data/mockData";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Link, useNavigate } from "react-router";
import { useBusiness } from "@/app/context/BusinessContext";

export default function Dashboard() {
  const { activeBusiness, activeRole } = useBusiness();
  const navigate = useNavigate();

  const totalRevenue = mockInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const totalExpenses = 11200;
  const profit = totalRevenue - totalExpenses;
  const overdueInvoices = mockInvoices.filter((inv) => inv.status === "overdue");

  // ── No active business → prompt to create/select ──────────────────────────
  if (!activeBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Building2 className="h-10 w-10 text-blue-500" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Bienvenue !</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Commencez par créer ou sélectionner une entreprise pour accéder à votre tableau de bord.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/app/businesses/new')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Créer une entreprise
          </button>
          <button
            onClick={() => navigate('/app/businesses')}
            className="px-5 py-2.5 border rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Mes entreprises
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre activité financière
          </p>
        </div>
        {/* Active business badge */}
        <div
          onClick={() => navigate('/app/businesses')}
          className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 cursor-pointer hover:bg-blue-100 transition"
        >
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {activeBusiness.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-xs text-blue-500 font-medium leading-none">Espace actif</p>
            <p className="text-sm font-semibold text-blue-900">{activeBusiness.name}</p>
          </div>
          {activeRole && (
            <span className="text-xs bg-white border border-blue-200 text-blue-700 rounded-full px-2 py-0.5 font-medium">
              {activeRole}
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Revenus du mois"
          value={`${totalRevenue.toLocaleString("fr-TN")} DT`}
          icon={DollarSign}
          trend={{ value: "12.5%", isPositive: true }}
        />
        <KPICard
          title="Dépenses du mois"
          value={`${totalExpenses.toLocaleString("fr-TN")} DT`}
          icon={TrendingDown}
          trend={{ value: "3.2%", isPositive: false }}
        />
        <KPICard
          title="Profit net"
          value={`${profit.toLocaleString("fr-TN")} DT`}
          icon={TrendingUp}
          trend={{ value: "18.7%", isPositive: true }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Revenus vs Dépenses</CardTitle>
            <p className="text-sm text-muted-foreground">Évolution sur les 6 derniers mois</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: "12px" }} />
                <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "8px" }} />
                <Legend />
                <Line type="monotone" dataKey="revenus" stroke="#2563EB" strokeWidth={2} name="Revenus" dot={{ fill: "#2563EB" }} />
                <Line type="monotone" dataKey="depenses" stroke="#EF4444" strokeWidth={2} name="Dépenses" dot={{ fill: "#EF4444" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Dépenses par catégorie</CardTitle>
            <p className="text-sm text-muted-foreground">Répartition du mois en cours</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseCategoryData}
                  cx="50%" cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {expenseCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Overdue invoices */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Factures en retard
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {overdueInvoices.length} facture(s) nécessite(nt) votre attention
            </p>
          </div>
          <Link to="/app/invoices">
            <Button variant="outline">Voir toutes les factures</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Numéro</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date d'échéance</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Montant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm font-medium">{invoice.number}</td>
                    <td className="py-3 px-4 text-sm">{invoice.clientName}</td>
                    <td className="py-3 px-4 text-sm">{new Date(invoice.dueDate).toLocaleDateString("fr-FR")}</td>
                    <td className="py-3 px-4 text-sm font-medium">{invoice.amount.toLocaleString("fr-TN")} DT</td>
                    <td className="py-3 px-4"><StatusBadge status={invoice.status} /></td>
                    <td className="py-3 px-4"><Button variant="ghost" size="sm">Relancer</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}