import { useEffect, useRef, useState } from "react";
// @mediapipe/hands loaded dynamically
// @mediapipe/camera_utils loaded dynamically
import { useAccessibility } from "@/app/context/AccessibilityContext";

// =========================
// 🔍 Trouve l'élément scrollable
// =========================
function getScrollableElement(): Element | Window {
  const elements = document.querySelectorAll("*");

  for (const el of elements) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const isScrollable = overflowY === "scroll" || overflowY === "auto";
    if (isScrollable && el.scrollHeight > el.clientHeight) {
      return el;
    }
  }

  return window;
}

function doScroll(target: Element | Window, amount: number) {
  if (target instanceof Window) {
    target.scrollBy({ top: amount, behavior: "auto" });
  } else {
    (target as Element).scrollTop += amount;
  }
}

export default function HandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { speak, gestureEnabled } = useAccessibility();

  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);

  // Click refs
  const pinchActiveRef = useRef(false);
  const pinchStartTimeRef = useRef(0);
  const clickReadyRef = useRef(false);

  // Scroll refs
  const scrollVelocityRef = useRef(0);
  const inertiaFrameRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);

  // Other refs
  const lastRightClick = useRef(0);
  const lastElement = useRef<Element | null>(null);
  const cursorRef = useRef({ x: 0, y: 0 });

  // =========================
  // 🌀 INERTIA LOOP
  // =========================
  const startInertia = () => {
    if (inertiaFrameRef.current) cancelAnimationFrame(inertiaFrameRef.current);

    const scrollTarget = getScrollableElement();

    const loop = () => {
      if (Math.abs(scrollVelocityRef.current) < 0.5) {
        scrollVelocityRef.current = 0;
        return;
      }
      doScroll(scrollTarget, scrollVelocityRef.current);
      scrollVelocityRef.current *= 0.92;
      inertiaFrameRef.current = requestAnimationFrame(loop);
    };

    inertiaFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (!videoRef.current) return;

    let hands: any;
    let camera: any;

    const resetPageState = () => {
      document.querySelectorAll("*").forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.outline = "";
          el.style.transform = "";
        }
      });
      lastElement.current = null;
      scrollVelocityRef.current = 0;
      if (inertiaFrameRef.current) cancelAnimationFrame(inertiaFrameRef.current);
    };

    const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
    const init = async () => {
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults((results) => {
        if (!results.multiHandLandmarks?.length) {
          if (isScrollingRef.current) {
            isScrollingRef.current = false;
            setIsScrolling(false);
            setScrollDirection(null);
            startInertia();
          }
          return;
        }

        const lm = results.multiHandLandmarks[0];
        const index = lm[8];
        const thumb = lm[4];
        const middle = lm[12];

        // =========================
        // 🎯 CURSOR SMOOTHING
        // =========================
        const x = (1 - index.x) * window.innerWidth;
        const y = index.y * window.innerHeight;

        const smoothX = cursorRef.current.x + (x - cursorRef.current.x) * 0.25;
        const smoothY = cursorRef.current.y + (y - cursorRef.current.y) * 0.25;

        cursorRef.current = { x: smoothX, y: smoothY };
        setCursor({ x: smoothX, y: smoothY });

        const element = document.elementFromPoint(smoothX, smoothY);

        // =========================
        // 📜 SCROLL (bord haut/bas)
        // =========================
        const screenHeight = window.innerHeight;
        const scrollZoneSize = screenHeight * 0.15;
        const cursorY = smoothY;
        const scrollTarget = getScrollableElement();

        if (cursorY > screenHeight - scrollZoneSize) {
          // ▼ Zone BAS
          const intensity = (cursorY - (screenHeight - scrollZoneSize)) / scrollZoneSize;
          const speed = Math.min(intensity * 25, 25);

          scrollVelocityRef.current = speed;
          isScrollingRef.current = true;
          setIsScrolling(true);
          setScrollDirection("down");

          if (inertiaFrameRef.current) {
            cancelAnimationFrame(inertiaFrameRef.current);
            inertiaFrameRef.current = null;
          }

          doScroll(scrollTarget, speed);

        } else if (cursorY < scrollZoneSize) {
          // ▲ Zone HAUT
          const intensity = (scrollZoneSize - cursorY) / scrollZoneSize;
          const speed = Math.min(intensity * 25, 25);

          scrollVelocityRef.current = -speed;
          isScrollingRef.current = true;
          setIsScrolling(true);
          setScrollDirection("up");

          if (inertiaFrameRef.current) {
            cancelAnimationFrame(inertiaFrameRef.current);
            inertiaFrameRef.current = null;
          }

          doScroll(scrollTarget, -speed);

        } else {
          // Zone neutre → inertie
          if (isScrollingRef.current) {
            isScrollingRef.current = false;
            setIsScrolling(false);
            setScrollDirection(null);
            startInertia();
          }
        }

        // =========================
        // 🖱️ CLICK — pinch → hold → release
        // =========================
        const pinchDist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
        const isPinchNow = pinchDist < 0.045;

        if (isPinchNow && !pinchActiveRef.current) {
          pinchActiveRef.current = true;
          pinchStartTimeRef.current = Date.now();
          clickReadyRef.current = false;
          setIsPinching(true);
        }

        if (isPinchNow && pinchActiveRef.current) {
          if (Date.now() - pinchStartTimeRef.current > 120) {
            clickReadyRef.current = true;
          }
        }

        if (!isPinchNow && pinchActiveRef.current) {
          pinchActiveRef.current = false;
          setIsPinching(false);

          if (clickReadyRef.current) {
            clickReadyRef.current = false;

            const target = document.elementFromPoint(smoothX, smoothY);
            const clickable = findClickable(target);

            if (clickable instanceof HTMLElement) {
              clickable.click();
              speak(clickable.innerText?.trim().slice(0, 50) || "clicked");
            } else if (target instanceof HTMLElement) {
              target.click();
              speak(target.innerText?.trim().slice(0, 50) || "clicked");
            }
          }
        }

        // =========================
        // 🖱️ RIGHT CLICK (pouce + majeur)
        // =========================
        const rightClickGesture = Math.hypot(
          thumb.x - middle.x,
          thumb.y - middle.y
        );

        if (rightClickGesture < 0.04 && Date.now() - lastRightClick.current > 1000) {
          lastRightClick.current = Date.now();

          if (element instanceof HTMLElement) {
            element.dispatchEvent(
              new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                view: window,
              })
            );
            speak("right click");
          }
        }

        // =========================
        // 🧭 HOVER
        // =========================
        if (element && element !== lastElement.current) {
          lastElement.current = element;
          if (element instanceof HTMLElement) element.focus?.();
        }
      });

      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current! });
        },
        width: 640,
        height: 480,
      });

      camera.start();
    };

    init();

    return () => {
      camera?.stop?.();
      resetPageState();
    };
  }, [speak]);

  // =========================
  // 🔁 RESET WHEN DISABLED
  // =========================
  useEffect(() => {
    if (!gestureEnabled) {
      document.body.style.cursor = "auto";
      document.querySelectorAll("*").forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.outline = "";
          el.style.transform = "";
        }
      });
      scrollVelocityRef.current = 0;
      if (inertiaFrameRef.current) cancelAnimationFrame(inertiaFrameRef.current);
    }
  }, [gestureEnabled]);

  return (
    <>
      {/* CAMERA */}
      <div className="fixed bottom-0 left-0 p-2 bg-black z-50 rounded">
        <video
          ref={videoRef}
          className="w-64 rounded"
          autoPlay
          playsInline
          muted
        />
      </div>

      {/* CURSOR */}
      <div
        style={{
          position: "fixed",
          top: cursor.y,
          left: cursor.x,
          width: isPinching ? "30px" : isScrolling ? "26px" : "22px",
          height: isPinching ? "30px" : isScrolling ? "26px" : "22px",
          background: isPinching ? "#f59e0b" : isScrolling ? "#10b981" : "#3b82f6",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 9999,
          transition: "width 0.1s, height 0.1s, background 0.1s",
          boxShadow: isPinching
            ? "0 0 24px rgba(245,158,11,0.8)"
            : isScrolling
            ? "0 0 24px rgba(16,185,129,0.8)"
            : "0 0 20px rgba(59,130,246,0.7)",
        }}
      />

      {/* ZONE HAUT */}
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          height: "15%",
          zIndex: 9998,
          pointerEvents: "none",
          background: scrollDirection === "up"
            ? "linear-gradient(to bottom, rgba(16,185,129,0.35), transparent)"
            : "linear-gradient(to bottom, rgba(255,255,255,0.04), transparent)",
          transition: "background 0.2s",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "10px",
        }}
      >
        {scrollDirection === "up" && (
          <span style={{ color: "#10b981", fontSize: "22px", fontWeight: "bold" }}>
            ▲ Scroll ▲
          </span>
        )}
      </div>

      {/* ZONE BAS */}
      <div
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          height: "15%",
          zIndex: 9998,
          pointerEvents: "none",
          background: scrollDirection === "down"
            ? "linear-gradient(to top, rgba(16,185,129,0.35), transparent)"
            : "linear-gradient(to top, rgba(255,255,255,0.04), transparent)",
          transition: "background 0.2s",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: "10px",
        }}
      >
        {scrollDirection === "down" && (
          <span style={{ color: "#10b981", fontSize: "22px", fontWeight: "bold" }}>
            ▼ Scroll ▼
          </span>
        )}
      </div>

      {/* GESTURE INDICATOR */}
      <div
        style={{
          position: "fixed",
          bottom: "12px", right: "12px",
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "8px 14px",
          borderRadius: "20px",
          fontSize: "13px",
          zIndex: 9999,
          pointerEvents: "none",
          transition: "opacity 0.3s",
          opacity: isPinching || isScrolling ? 1 : 0.4,
        }}
      >
        {isPinching
          ? "🤏 Clic..."
          : scrollDirection === "up"
          ? "⬆️ Scroll haut"
          : scrollDirection === "down"
          ? "⬇️ Scroll bas"
          : "☝️ Curseur"}
      </div>
    </>
  );
}

// =========================
// 🔍 Find nearest clickable parent
// =========================
function findClickable(el: Element | null): Element | null {
  while (el && el !== document.body) {
    if (
      el instanceof HTMLElement &&
      (el.tagName === "BUTTON" ||
        el.tagName === "A" ||
        el.tagName === "INPUT" ||
        el.tagName === "SELECT" ||
        el.tagName === "LABEL" ||
        el.getAttribute("role") === "button" ||
        el.getAttribute("tabindex") !== null ||
        el.onclick !== null ||
        el.style.cursor === "pointer" ||
        window.getComputedStyle(el).cursor === "pointer")
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}