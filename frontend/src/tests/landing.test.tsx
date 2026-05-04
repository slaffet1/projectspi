import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Landing from "../app/pages/Landing";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ to, children, onClick }: any) => (
      <a href={to} onClick={onClick}>
        {children}
      </a>
    ),
  };
});

const mockLogout = vi.fn();
let mockUser: any = null;

vi.mock("@/app/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout }),
}));

vi.mock("@/app/pages/ChangePasswordModal", () => ({
  ChangePasswordModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="change-password-modal">
        <button onClick={onClose}>Close Password Modal</button>
      </div>
    ) : null,
}));

vi.mock("@/app/pages/JoinCompanyModal", () => ({
  JoinCompanyModal: ({ onClose }: any) => (
    <div data-testid="join-company-modal">
      <button onClick={onClose}>Close Join Modal</button>
    </div>
  ),
}));

vi.mock("@/app/components/figma/ImageWithFallback", () => ({
  ImageWithFallback: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} />
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderLanding() {
  return render(<Landing />);
}

const fakeUser = {
  firstname: "Ahmed",
  lastname: "Salah",
  email: "ahmed@example.com",
};

// The desktop avatar button has rounded-full class
function getAvatarButton() {
  return screen
    .getAllByRole("button")
    .find((btn) => btn.className.includes("rounded-full"));
}

// The mobile hamburger has data-slot="button"
function getMobileToggle() {
  return screen
    .getAllByRole("button")
    .find((btn) => btn.getAttribute("data-slot") === "button");
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Landing component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
  });

  // ── Rendering (unauthenticated) ────────────────────────────────────────────

  describe("Initial render — unauthenticated", () => {
    it("renders the brand name", () => {
      renderLanding();
      expect(screen.getAllByText(/charikty\.tn/i).length).toBeGreaterThan(0);
    });

    it("renders the main hero heading", () => {
      renderLanding();
      expect(
        screen.getByRole("heading", {
          name: /gérez votre entreprise en toute simplicité/i,
        })
      ).toBeInTheDocument();
    });

    it("renders the hero subheading description", () => {
      renderLanding();
      expect(
        screen.getByText(/plateforme complète de gestion financière/i)
      ).toBeInTheDocument();
    });

    it("renders the navbar login button when not authenticated", () => {
      renderLanding();
      // data-cy is on the <button> rendered inside the <Link> mock (<a>)
      const loginBtn = document.querySelector("[data-cy='navbar-login']");
      expect(loginBtn).toBeInTheDocument();
    });

    it("renders 'Commencer gratuitement' link in navbar when not authenticated", () => {
      renderLanding();
      expect(
        screen.getAllByText(/commencer gratuitement/i).length
      ).toBeGreaterThan(0);
    });

    it("does not render user avatar button when not authenticated", () => {
      renderLanding();
      expect(getAvatarButton()).toBeUndefined();
    });

    it("does not render Join Company button when not authenticated", () => {
      renderLanding();
      expect(
        screen.queryByRole("button", { name: /join company/i })
      ).not.toBeInTheDocument();
    });

    it("renders the features section heading", () => {
      renderLanding();
      expect(
        screen.getByRole("heading", { name: /tout ce dont vous avez besoin/i })
      ).toBeInTheDocument();
    });

    it("renders all 6 feature card titles", () => {
      renderLanding();
      // Use getAllByText to handle duplicates and just confirm at least one exists
      expect(screen.getAllByText(/facturation intelligente/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/gestion clients/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/suivi des dépenses/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/rapports détaillés/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/gain de temps/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/sécurité maximale/i).length).toBeGreaterThan(0);
    });

    it("renders the stats section values", () => {
      renderLanding();
      expect(screen.getByText("500+")).toBeInTheDocument();
      expect(screen.getByText("50K+")).toBeInTheDocument();
      expect(screen.getByText("98%")).toBeInTheDocument();
      expect(screen.getByText("24/7")).toBeInTheDocument();
    });

    it("renders the stats section labels", () => {
      renderLanding();
      expect(screen.getByText(/entreprises actives/i)).toBeInTheDocument();
      expect(screen.getByText(/factures générées/i)).toBeInTheDocument();
      expect(screen.getByText(/taux de satisfaction/i)).toBeInTheDocument();
      expect(screen.getByText(/support disponible/i)).toBeInTheDocument();
    });

    it("renders the pricing section with 3 plans", () => {
      renderLanding();
      expect(screen.getByText(/^starter$/i)).toBeInTheDocument();
      expect(screen.getByText(/^professional$/i)).toBeInTheDocument();
      expect(screen.getByText(/^enterprise$/i)).toBeInTheDocument();
    });

    it("renders pricing amounts", () => {
      renderLanding();
      // Use getAllByText since "99 DT" might match "199 DT" with regex
      expect(screen.getAllByText(/49 dt/i).length).toBeGreaterThan(0);
      expect(
        screen.getAllByText(/\b99 dt\b/i).length
      ).toBeGreaterThan(0);
      expect(screen.getAllByText(/199 dt/i).length).toBeGreaterThan(0);
    });

    it("renders the testimonials section with 3 testimonials", () => {
      renderLanding();
      expect(screen.getAllByText(/ahmed salah/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/leila ben ali/i)).toBeInTheDocument();
      expect(screen.getByText(/mohamed karim/i)).toBeInTheDocument();
    });

    it("renders the footer copyright", () => {
      renderLanding();
      expect(screen.getByText(/tous droits réservés/i)).toBeInTheDocument();
    });

    it("renders the how it works section heading", () => {
      renderLanding();
      expect(
        screen.getByRole("heading", { name: /comment ça marche/i })
      ).toBeInTheDocument();
    });

    it("renders the 3 how-it-works steps", () => {
      renderLanding();
      expect(screen.getByText(/créez votre compte/i)).toBeInTheDocument();
      expect(screen.getByText(/configurez vos données/i)).toBeInTheDocument();
      expect(screen.getByText(/commencez à facturer/i)).toBeInTheDocument();
    });

    it("renders the CTA section heading", () => {
      renderLanding();
      expect(
        screen.getByRole("heading", {
          name: /prêt à transformer votre gestion financière/i,
        })
      ).toBeInTheDocument();
    });

    it("renders the most popular badge on professional plan", () => {
      renderLanding();
      expect(screen.getByText(/le plus populaire/i)).toBeInTheDocument();
    });
  });

  // ── Rendering (authenticated) ──────────────────────────────────────────────

  describe("Authenticated user render", () => {
    beforeEach(() => {
      mockUser = fakeUser;
    });

    it("does not render the navbar login button when authenticated", () => {
      renderLanding();
      const loginBtn = document.querySelector("[data-cy='navbar-login']");
      expect(loginBtn).not.toBeInTheDocument();
    });

    it("renders the user avatar button when authenticated", () => {
      renderLanding();
      expect(getAvatarButton()).toBeDefined();
    });

    it("renders the Join Company button in hero when authenticated", () => {
      renderLanding();
      expect(
        screen.getByRole("button", { name: /join company/i })
      ).toBeInTheDocument();
    });

    it("does not show dropdown menu by default", () => {
      renderLanding();
      expect(
        screen.queryByText(/changer mot de passe/i)
      ).not.toBeInTheDocument();
    });

    it("shows dropdown menu when avatar is clicked", async () => {
      renderLanding();
      await userEvent.click(getAvatarButton()!);

      expect(screen.getByText(/changer mot de passe/i)).toBeInTheDocument();
      expect(
        screen.getAllByRole("button", { name: /déconnexion/i }).length
      ).toBeGreaterThan(0);
    });

    it("shows user name in dropdown", async () => {
      renderLanding();
      await userEvent.click(getAvatarButton()!);

      // User name appears in the dropdown — pick the one inside the dropdown div
      const dropdownName = screen
        .getAllByText(/ahmed salah/i)
        .find((el) => el.tagName === "P");
      expect(dropdownName).toBeInTheDocument();
    });

    it("shows user email in dropdown", async () => {
      renderLanding();
      await userEvent.click(getAvatarButton()!);

      expect(screen.getByText(/ahmed@example\.com/i)).toBeInTheDocument();
    });

    it("closes dropdown when clicked outside", async () => {
      renderLanding();
      await userEvent.click(getAvatarButton()!);
      expect(screen.getByText(/changer mot de passe/i)).toBeInTheDocument();

      await userEvent.click(document.body);

      await waitFor(() =>
        expect(
          screen.queryByText(/changer mot de passe/i)
        ).not.toBeInTheDocument()
      );
    });

    it("toggles dropdown off when avatar is clicked again", async () => {
      renderLanding();
      const avatar = getAvatarButton()!;

      await userEvent.click(avatar);
      expect(screen.getByText(/changer mot de passe/i)).toBeInTheDocument();

      await userEvent.click(avatar);
      await waitFor(() =>
        expect(
          screen.queryByText(/changer mot de passe/i)
        ).not.toBeInTheDocument()
      );
    });
  });

  // ── Logout ─────────────────────────────────────────────────────────────────

  describe("Logout", () => {
    beforeEach(() => {
      mockUser = fakeUser;
    });

    it("calls logout and navigates to / from desktop dropdown", async () => {
      renderLanding();
      await userEvent.click(getAvatarButton()!);

      const logoutBtns = screen.getAllByRole("button", { name: /déconnexion/i });
      await userEvent.click(logoutBtns[0]);

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  // ── Change Password Modal ──────────────────────────────────────────────────

  describe("Change password modal", () => {
    beforeEach(() => {
      mockUser = fakeUser;
    });

    it("does not show the modal by default", () => {
      renderLanding();
      expect(
        screen.queryByTestId("change-password-modal")
      ).not.toBeInTheDocument();
    });

    it("opens the change password modal when clicked from dropdown", async () => {
      renderLanding();
      await userEvent.click(getAvatarButton()!);
      await userEvent.click(
        screen.getByRole("button", { name: /changer mot de passe/i })
      );

      expect(screen.getByTestId("change-password-modal")).toBeInTheDocument();
    });

    it("closes the change password modal when onClose is called", async () => {
      renderLanding();
      await userEvent.click(getAvatarButton()!);
      await userEvent.click(
        screen.getByRole("button", { name: /changer mot de passe/i })
      );
      expect(screen.getByTestId("change-password-modal")).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", { name: /close password modal/i })
      );
      expect(
        screen.queryByTestId("change-password-modal")
      ).not.toBeInTheDocument();
    });
  });

  // ── Join Company Modal ─────────────────────────────────────────────────────

  describe("Join Company modal", () => {
    beforeEach(() => {
      mockUser = fakeUser;
    });

    it("does not show the modal by default", () => {
      renderLanding();
      expect(
        screen.queryByTestId("join-company-modal")
      ).not.toBeInTheDocument();
    });

    it("opens the join company modal when Join Company is clicked", async () => {
      renderLanding();
      await userEvent.click(
        screen.getByRole("button", { name: /join company/i })
      );

      expect(await screen.findByTestId("join-company-modal")).toBeInTheDocument();
    });

    it("closes the join company modal when onClose is called", async () => {
      renderLanding();
      await userEvent.click(
        screen.getByRole("button", { name: /join company/i })
      );
      expect(await screen.findByTestId("join-company-modal")).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", { name: /close join modal/i })
      );
      await waitFor(() =>
        expect(
          screen.queryByTestId("join-company-modal")
        ).not.toBeInTheDocument()
      );
    });
  });

  // ── Mobile Menu ────────────────────────────────────────────────────────────

  describe("Mobile menu", () => {
    beforeEach(() => {
      mockUser = fakeUser;
    });

    it("mobile hamburger button exists in the DOM", () => {
      renderLanding();
      expect(getMobileToggle()).toBeDefined();
    });

    it("opens mobile menu and shows logout when hamburger is clicked", async () => {
      renderLanding();
      await userEvent.click(getMobileToggle()!);

      await waitFor(() => {
        const allBtns = screen.getAllByRole("button");
        const hasLogout = allBtns.some(
          (b) =>
            b.textContent?.includes("Déconnexion") ||
            b.textContent?.includes("🚪")
        );
        expect(hasLogout).toBe(true);
      });
    });

    it("calls logout and navigates when mobile logout is clicked", async () => {
      renderLanding();
      await userEvent.click(getMobileToggle()!);

      await waitFor(() => {
        const allBtns = screen.getAllByRole("button");
        return allBtns.some(
          (b) =>
            b.textContent?.includes("Déconnexion") ||
            b.textContent?.includes("🚪")
        );
      });

      const allBtns = screen.getAllByRole("button");
      const mobileLogout = allBtns.find(
        (b) =>
          b.textContent?.includes("Déconnexion") ||
          b.textContent?.includes("🚪")
      );
      await userEvent.click(mobileLogout!);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  // ── Navigation Links ───────────────────────────────────────────────────────

  describe("Navigation links", () => {
    it("renders Fonctionnalités anchor pointing to #features", () => {
      renderLanding();
      const links = screen.getAllByRole("link", { name: /fonctionnalités/i });
      expect(links[0]).toHaveAttribute("href", "#features");
    });

    it("renders Tarifs anchor pointing to #pricing", () => {
      renderLanding();
      const links = screen.getAllByRole("link", { name: /tarifs/i });
      expect(links[0]).toHaveAttribute("href", "#pricing");
    });

    it("renders footer confidentiality link", () => {
      renderLanding();
      expect(
        screen.getByRole("link", { name: /confidentialité/i })
      ).toBeInTheDocument();
    });

    it("renders footer conditions link", () => {
      renderLanding();
      expect(
        screen.getByRole("link", { name: /^conditions$/i })
      ).toBeInTheDocument();
    });

    it("renders footer cookies link", () => {
      renderLanding();
      expect(
        screen.getByRole("link", { name: /^cookies$/i })
      ).toBeInTheDocument();
    });
  });

  // ── Hero Section ───────────────────────────────────────────────────────────

  describe("Hero section", () => {
    it("renders the 100% tunisienne badge", () => {
      renderLanding();
      expect(screen.getByText(/solution 100% tunisienne/i)).toBeInTheDocument();
    });

    it("renders the free trial link", () => {
      renderLanding();
      expect(
        screen.getByRole("link", { name: /essai gratuit 14 jours/i })
      ).toBeInTheDocument();
    });

    it("renders no credit card required text", () => {
      renderLanding();
      expect(
        screen.getAllByText(/aucune carte de crédit requise/i).length
      ).toBeGreaterThan(0);
    });

    it("renders the dashboard image", () => {
      renderLanding();
      expect(
        screen.getByAltText(/business management dashboard/i)
      ).toBeInTheDocument();
    });

    it("renders the monthly revenue floating stat label", () => {
      renderLanding();
      expect(screen.getByText(/revenu mensuel/i)).toBeInTheDocument();
    });

    it("renders the +45% revenue stat value", () => {
      renderLanding();
      expect(screen.getByText(/\+45%/i)).toBeInTheDocument();
    });
  });
});