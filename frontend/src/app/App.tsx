import { RouterProvider } from "react-router";
import { router } from "@/app/routes";
import { Toaster } from "@/app/components/ui/sonner";
import { ToastContainer } from 'react-toastify'
import SpeechHandler from "@/app/components/SpeechHandler";
export default function App() {
  return (
    <>
      <SpeechHandler />
      <RouterProvider router={router} />
      <ToastContainer position="top-right" autoClose={3000} />
      <Toaster />
    </>
  );
}
