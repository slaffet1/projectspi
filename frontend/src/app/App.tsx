import { RouterProvider } from "react-router";
import { router } from "@/app/routes";
import { Toaster } from "@/app/components/ui/sonner";
import { ToastContainer } from 'react-toastify'
import SpeechHandler from "@/app/components/SpeechHandler";
import HandTracking from "@/app/components/HandTracking";
import { useAccessibility } from "@/app/context/AccessibilityContext";
import { AiAdvisor } from "@/app/components/AiAdvisor";
export default function App() {
  const { gestureEnabled } = useAccessibility();

  return (
    <>
      <SpeechHandler />

      {/* 👉 ROUTER */}
      <RouterProvider router={router} />

      {/* 👉 UI */}
      <ToastContainer position="top-right" autoClose={3000} />
      <Toaster />

      {/* 👉 HAND TRACKING (IMPORTANT) */}
      {gestureEnabled && <HandTracking />}
      <AiAdvisor />
    </>
  );
}
