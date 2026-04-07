import { createContext, useContext, useEffect, useState } from "react";

type AccessibilityContextType = {
  fontSize: number;
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const saved = localStorage.getItem("fontSize");
    if (saved) setFontSize(Number(saved));
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("fontSize", String(fontSize));
  }, [fontSize]);

  const increaseFont = () => setFontSize((s) => Math.min(s + 2, 24));
  const decreaseFont = () => setFontSize((s) => Math.max(s - 2, 12));
  const resetFont = () => setFontSize(16);

  return (
    <AccessibilityContext.Provider
      value={{ fontSize, increaseFont, decreaseFont, resetFont }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used inside provider");
  return ctx;
}