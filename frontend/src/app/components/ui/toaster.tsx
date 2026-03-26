import { useEffect, useState } from "react";
import { subscribeToast } from "@/hooks/use-toast";

export function Toaster() {
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    subscribeToast((toast) => {
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3000);
    });
  }, []);

  return (
    <div className="fixed top-5 right-5 space-y-2 z-50">
      {toasts.map((t, i) => (
        <div
          key={i}
          className={`px-4 py-3 rounded-xl shadow-lg text-white ${
            t.variant === "destructive"
              ? "bg-red-500"
              : "bg-green-500"
          }`}
        >
          <p className="font-semibold">{t.title}</p>
          {t.description && (
            <p className="text-sm">{t.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}