import { createBrowserRouter } from "react-router";
import { AppLayout } from "@/app/components/AppLayout";
import Landing from "@/app/pages/Landing";
import Dashboard from "@/app/pages/Dashboard";
import Invoices from "@/app/pages/Invoices";
import CreateInvoice from "@/app/pages/CreateInvoice";
import InvoiceDetail from "@/app/pages/InvoiceDetail";
import Clients from "@/app/pages/Clients";
import ClientDetail from "@/app/pages/ClientDetail";
import Expenses from "@/app/pages/Expenses";
import TaxSettings from "@/app/pages/TaxSettings";
import InvoiceSettings from "@/app/pages/InvoiceSettings";
import Members from "@/app/pages/Members";
import Login from "@/app/pages/Login";
import Register from "@/app/pages/Register";
import VerifyEmail from "@/app/pages/verifierEmail";
import BusinessList from "./pages/BusinessList";
import CreateBusiness from "./pages/CreateBusiness";
import BusinessProfile from "./pages/BusinessProfile";
import BusinessOnboarding from "./pages/Businessonboarding";
import JoinRequests from "./pages/JoinRequestsPage";
import EditProfile from "./pages/modifierProfil";
import Products from "@/app/pages/Products";
import Quotes from "./pages/Quotes";
import CreateQuote from './pages/CreateQuote';
import Banks from "@/app/pages/Banks";
import QuoteDetail from "@/app/pages/QuoteDetail";
import DeliveryNote from "./pages/DeliveryNote";
import Warehouses from "@/app/pages/Warehouses";
import StockLevels from "@/app/pages/StockLevels";
import StockMovements from "@/app/pages/StockMovements";
import InventorySessions from "@/app/pages/InventorySessions";
import SupplierForm from "./pages/SupplierForm";
import Suppliers from "./pages/Suppliers";
export const router = createBrowserRouter([
  // ─── Pages publiques ───────────────────────────────────────────
  { path: "/", Component: Landing },
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
  { path: "/verifEmail", Component: VerifyEmail },

  // ─── Zone entreprise SANS sidebar ──────────────────────────────
  { path: "/onboarding", Component: BusinessOnboarding },
  { path: "/businesses", Component: BusinessList },
  { path: "/businesses/new", Component: CreateBusiness },
  { path: "/businesses/:id", Component: BusinessProfile },
  { path: "/profile/edit", Component: EditProfile },

  // ─── Zone travail AVEC sidebar ─────────────────────────────────
  {
    path: "/app",
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "invoices", Component: Invoices },
      { path: "invoices/new", Component: CreateInvoice },
      { path: "invoices/:id", Component: InvoiceDetail },
      { path: "clients", Component: Clients },
      { path: "clients/:id", Component: ClientDetail },
      { path: "expenses", Component: Expenses },
      { path: "settings/taxes", Component: TaxSettings },
      { path: "settings/invoices", Component: InvoiceSettings },
      { path: "members", Component: Members },
      { path: "join-requests", Component: JoinRequests },
      { path: "products", Component: Products },
      { path: "quotes", Component: Quotes },
      { path: "quotes/new", Component: CreateQuote },
      { path: "banks", Component: Banks },
      { path: "/app/quotes/:id", Component: QuoteDetail },
      {path:"deliveryNotes",Component:DeliveryNote},
      { path: "stock/warehouses", Component: Warehouses },
      { path: "stock/levels", Component: StockLevels },
      { path: "stock/movements", Component: StockMovements },
      { path: "stock/inventory", Component: InventorySessions },
      { path: "/app/Suppliers/new", Component: SupplierForm },
      { path: "/app/suppliers", Component: Suppliers },
      { path: "/app/suppliers/:id/edit", Component: SupplierForm },
      
    ],
  },
]);