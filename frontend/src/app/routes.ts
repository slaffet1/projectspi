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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/app",
    Component: AppLayout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: "invoices",
        Component: Invoices,
      },
      {
        path: "invoices/new",
        Component: CreateInvoice,
      },
      {
        path: "invoices/:id",
        Component: InvoiceDetail,
      },
      {
        path: "clients",
        Component: Clients,
      },
      {
        path: "clients/:id",
        Component: ClientDetail,
      },
      {
        path: "expenses",
        Component: Expenses,
      },
    ],
  },
]);