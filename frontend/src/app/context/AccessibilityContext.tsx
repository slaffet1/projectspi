import { createContext, useContext, useEffect, useState } from "react";

type AccessibilityContextType = {
  fontSize: number;
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;

  speechEnabled: boolean;
  toggleSpeech: () => void;
  speak: (text: string) => void;

  gestureEnabled: boolean;        // ✅ NEW
  toggleGesture: () => void;      // ✅ NEW
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState(16);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [gestureEnabled, setGestureEnabled] = useState(false); // ✅ NEW

  // 🔹 Charger depuis localStorage
  useEffect(() => {
    const savedFont = localStorage.getItem("fontSize");
    if (savedFont) setFontSize(Number(savedFont));

    const savedSpeech = localStorage.getItem("speechEnabled");
    if (savedSpeech) setSpeechEnabled(savedSpeech === "true");

    const savedGesture = localStorage.getItem("gestureEnabled"); // ✅ NEW
    if (savedGesture) setGestureEnabled(savedGesture === "true");
  }, []);

  // 🔹 Sauvegarder font size
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("fontSize", String(fontSize));
  }, [fontSize]);

  // 🔹 Sauvegarder speech
  useEffect(() => {
    localStorage.setItem("speechEnabled", String(speechEnabled));
  }, [speechEnabled]);

  // 🔹 Sauvegarder gesture
  useEffect(() => {
    localStorage.setItem("gestureEnabled", String(gestureEnabled));
  }, [gestureEnabled]);

  // 🔹 Actions font
  const increaseFont = () => setFontSize((s) => Math.min(s + 2, 24));
  const decreaseFont = () => setFontSize((s) => Math.max(s - 2, 12));
  const resetFont = () => setFontSize(16);

  // 🔹 Toggle speech
  const toggleSpeech = () => setSpeechEnabled((v) => !v);

  // 🔹 Toggle gesture ✅ NEW
  const toggleGesture = () => setGestureEnabled((v) => !v);

  // 🔹 Speech function
  const speak = (text: string) => {
    if (!speechEnabled) return;
    if (!text.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; // ou "fr-FR"
    utterance.rate = 1;

    window.speechSynthesis.speak(utterance);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        increaseFont,
        decreaseFont,
        resetFont,
        speechEnabled,
        toggleSpeech,
        speak,
        gestureEnabled,   // ✅
        toggleGesture,    // ✅
      }}
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