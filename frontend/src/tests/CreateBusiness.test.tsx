import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import CreateBusiness from "../app/pages/CreateBusiness";
import { businessService } from "../app/services/businessService";
import { toast } from "react-toastify";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockRefreshBusinesses = vi.fn();
const mockSwitchBusiness = vi.fn();

vi.mock("../app/context/BusinessContext", () => ({
  useBusiness: () => ({
    refreshBusinesses: mockRefreshBusinesses,
    switchBusiness: mockSwitchBusiness,
  }),
}));

vi.mock("../app/services/businessService", () => ({
  businessService: {
    createBusiness: vi.fn(),
  },
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createBusinessMock =
  businessService.createBusiness as ReturnType<typeof vi.fn>;

function renderPage() {
  return render(<CreateBusiness />);
}

async function fillRequiredFields() {
  await userEvent.type(
    screen.getAllByPlaceholderText(/united brains/i)[0],
    "My Company"
  );
}

async function submitForm() {
  await userEvent.click(
    screen.getByRole("button", { name: /créer l'entreprise/i })
  );
}

describe("CreateBusiness Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial render", () => {
    it("renders title", () => {
      renderPage();
      expect(
        screen.getByRole("heading", { name: /créer une entreprise/i })
      ).toBeInTheDocument();
    });

    it("renders inputs", () => {
      renderPage();
      expect(screen.getAllByPlaceholderText(/united brains/i)[0]).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/contact@entreprise/i)
      ).toBeInTheDocument();
    });

    it("renders submit button", () => {
      renderPage();
      expect(
        screen.getByRole("button", { name: /créer l'entreprise/i })
      ).toBeInTheDocument();
    });
  });

  describe("User input", () => {
    it("updates company name", async () => {
      renderPage();
      const input = screen.getAllByPlaceholderText(/united brains/i)[0];
      await userEvent.type(input, "Test Corp");
      expect(input).toHaveValue("Test Corp");
    });
  });

  describe("Validation", () => {
    it("shows error when name is empty", async () => {
      renderPage();
      await submitForm();
      expect(await screen.findByText(/nom est requis/i)).toBeInTheDocument();
      expect(createBusinessMock).not.toHaveBeenCalled();
    });

    it("shows invalid email error", async () => {
      renderPage();
      await fillRequiredFields();
      await userEvent.type(
        screen.getByPlaceholderText(/contact@entreprise/i),
        "invalid"
      );
      await submitForm();
      expect(await screen.findByText(/email invalide/i)).toBeInTheDocument();
    });
  });

  describe("Successful creation", () => {
    it("calls createBusiness API", async () => {
      createBusinessMock.mockResolvedValueOnce({
        data: { id: 1 },
      });

      renderPage();

      await fillRequiredFields();
      await submitForm();

      await waitFor(() => {
        expect(createBusinessMock).toHaveBeenCalled();
      });
    });

    it("refreshes and switches business", async () => {
      createBusinessMock.mockResolvedValueOnce({
        data: { id: 5 },
      });

      renderPage();

      await fillRequiredFields();
      await submitForm();

      await waitFor(() => {
        expect(mockRefreshBusinesses).toHaveBeenCalled();
        expect(mockSwitchBusiness).toHaveBeenCalledWith(5);
      });
    });

    it("shows success toast", async () => {
      createBusinessMock.mockResolvedValueOnce({
        data: { id: 5 },
      });

      renderPage();

      await fillRequiredFields();
      await submitForm();

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it("navigates after success", async () => {
      createBusinessMock.mockResolvedValueOnce({
        data: { id: 5 },
      });

      renderPage();

      await fillRequiredFields();
      await submitForm();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/businesses");
      });
    });
  });

  describe("Failure case", () => {
    it("shows error toast when API fails", async () => {
      createBusinessMock.mockRejectedValueOnce({
        response: { data: { message: "Erreur API" } },
      });

      renderPage();

      await fillRequiredFields();
      await submitForm();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Erreur API");
      });
    });

    it("shows generic error if message missing", async () => {
      createBusinessMock.mockRejectedValueOnce(new Error());

      renderPage();

      await fillRequiredFields();
      await submitForm();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe("Loading state", () => {
    it("disables button while loading", async () => {
      createBusinessMock.mockImplementation(
        () => new Promise(() => {})
      );

      renderPage();

      await fillRequiredFields();
      await submitForm();

      const button = screen.getByRole("button", {
        name: /création/i,
      });

      expect(button).toBeDisabled();
    });
  });
});