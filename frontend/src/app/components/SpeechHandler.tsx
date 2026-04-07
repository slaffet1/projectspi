import { useEffect } from "react";
import { useAccessibility } from "@/app/context/AccessibilityContext";

export default function SpeechHandler() {
  const { speak, speechEnabled } = useAccessibility();

  useEffect(() => {
    if (!speechEnabled) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const text = target.innerText?.trim();
      if (text && text.length < 200) {
        speak(text);
      }
    };

    document.addEventListener("mouseover", handleMouseOver);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
    };
  }, [speechEnabled]);

  return null;
}