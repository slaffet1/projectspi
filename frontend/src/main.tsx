import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { AuthProvider } from "./app/context/AuthContext.tsx";
import { BusinessProvider } from "./app/context/BusinessContext.tsx";
import { AccessibilityProvider } from "./app/context/AccessibilityContext.tsx";
import { ThemeProvider } from "./app/context/ThemeContext.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      <BusinessProvider>
        <AccessibilityProvider>
          <App />
        </AccessibilityProvider>
      </BusinessProvider>
    </AuthProvider>
  </ThemeProvider>
);
