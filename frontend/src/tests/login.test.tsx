import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { toast } from "react-toastify";
import Login from "../app/pages/Login";
import { api } from "../app/services/api";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockLogin = vi.fn();
vi.mock("../app/context/AuthContext", () => ({
    useAuth: () => ({ login: mockLogin }),
}));

vi.mock("../app/services/api", () => ({
    api: { post: vi.fn() },
}));

vi.mock("react-toastify", () => ({
    toast: { info: vi.fn() },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const apiPost = api.post as ReturnType<typeof vi.fn>;

function renderLogin() {
    return render(<Login />);
}

async function fillCredentials(email: string, password: string) {
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), email);
    await userEvent.type(screen.getByPlaceholderText(/votre mot de passe/i), password);
}

async function clickLogin() {
    await userEvent.click(screen.getByRole("button", { name: /se connecter/i }));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Login component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Rendering ──────────────────────────────────────────────────────────────

    describe("Initial render", () => {
        it("renders the welcome heading", () => {
            renderLogin();
            expect(screen.getByRole("heading", { name: /bienvenue/i })).toBeInTheDocument();
        });

        it("renders email and password inputs", () => {
            renderLogin();
            expect(screen.getByLabelText(/adresse e-mail/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
        });

        it("renders the login submit button", () => {
            renderLogin();
            expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
        });

        it("renders forgot-password and register links", () => {
            renderLogin();
            expect(screen.getByRole("link", { name: /mot de passe oublié/i })).toBeInTheDocument();
            expect(screen.getByRole("link", { name: /créer un compte/i })).toBeInTheDocument();
        });

        it("does not show 2FA input on initial render", () => {
            renderLogin();
            expect(screen.queryByLabelText(/code d'authentification/i)).not.toBeInTheDocument();
        });

        it("does not show any error messages on initial render", () => {
            renderLogin();
            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        });

        it("password input is of type password by default", () => {
            renderLogin();
            expect(screen.getByPlaceholderText(/votre mot de passe/i)).toHaveAttribute("type", "password");
        });
    });

    // ── User Input ─────────────────────────────────────────────────────────────

    describe("User input", () => {
        it("updates email field as user types", async () => {
            renderLogin();
            const emailInput = screen.getByLabelText(/adresse e-mail/i);
            await userEvent.type(emailInput, "test@example.com");
            expect(emailInput).toHaveValue("test@example.com");
        });

        it("updates password field as user types", async () => {
            renderLogin();
            const passwordInput = screen.getByPlaceholderText(/votre mot de passe/i);
            await userEvent.type(passwordInput, "secret123");
            expect(passwordInput).toHaveValue("secret123");
        });

        it("toggles password visibility when eye icon is clicked", async () => {
            renderLogin();
            const passwordInput = screen.getByPlaceholderText(/votre mot de passe/i);
            const toggleBtn = screen.getByRole("button", { name: /afficher le mot de passe/i });

            expect(passwordInput).toHaveAttribute("type", "password");
            await userEvent.click(toggleBtn);
            expect(passwordInput).toHaveAttribute("type", "text");
            await userEvent.click(screen.getByRole("button", { name: /masquer le mot de passe/i }));
            expect(passwordInput).toHaveAttribute("type", "password");
        });
    });

    // ── Form Validation ────────────────────────────────────────────────────────

    describe("Form validation", () => {
        it("shows required errors when submitting empty form", async () => {
            renderLogin();
            await clickLogin();

            expect(await screen.findByText(/email requis/i)).toBeInTheDocument();
            expect(await screen.findByText(/mot de passe requis/i)).toBeInTheDocument();
        });

        it("shows invalid email error for bad email format", async () => {
            renderLogin();
            await userEvent.type(screen.getByLabelText(/adresse e-mail/i), "not-an-email");
            await userEvent.type(screen.getByPlaceholderText(/votre mot de passe/i), "password");
            await clickLogin();

            expect(await screen.findByText(/email invalide/i)).toBeInTheDocument();
        });

        it("shows password required error when only email is provided", async () => {
            renderLogin();
            await userEvent.type(screen.getByLabelText(/adresse e-mail/i), "test@example.com");
            await clickLogin();

            expect(await screen.findByText(/mot de passe requis/i)).toBeInTheDocument();
        });

        it("does not call the API when validation fails", async () => {
            renderLogin();
            await clickLogin();

            expect(apiPost).not.toHaveBeenCalled();
        });

        it("sets aria-invalid on email input when email error is present", async () => {
            renderLogin();
            await clickLogin();

            expect(screen.getByLabelText(/adresse e-mail/i)).toHaveAttribute("aria-invalid", "true");
        });

        it("sets aria-invalid on password input when password error is present", async () => {
            renderLogin();
            await clickLogin();

            expect(screen.getByPlaceholderText(/votre mot de passe/i).hasAttribute("aria-invalid"));
        });
    });

    // ── Successful Login (no 2FA) ──────────────────────────────────────────────

    describe("Successful login without 2FA", () => {
        beforeEach(() => {
            apiPost.mockResolvedValueOnce({ data: { access_token: "token-abc" } });
        });

        it("calls the API with correct credentials", async () => {
            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            await waitFor(() => {
                expect(apiPost).toHaveBeenCalledWith("/users/login", {
                    email: "user@example.com",
                    password: "password123",
                });
            });
        });

        it("calls login() from auth context with the access token", async () => {
            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("token-abc"));
        });

        it("navigates to /onboarding after successful login", async () => {
            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/onboarding"));
        });
    });

    // ── Login Requiring 2FA ────────────────────────────────────────────────────

    describe("Login requiring 2FA", () => {
        beforeEach(() => {
            apiPost.mockResolvedValueOnce({ data: { requires2FA: true, userId: 42 } });
        });

        it("shows the 2FA input after credentials are accepted", async () => {
            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            expect(await screen.findByLabelText(/code d'authentification/i)).toBeInTheDocument();
        });

        it("hides credential fields and shows 2FA field", async () => {
            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            await waitFor(() => {
                expect(screen.queryByLabelText(/adresse e-mail/i)).not.toBeInTheDocument();
                expect(screen.queryByLabelText(/mot de passe/i)).not.toBeInTheDocument();
            });
            expect(screen.getByLabelText(/code d'authentification/i)).toBeInTheDocument();
        });

        it("shows a toast notification asking for 2FA code", async () => {
            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            await waitFor(() =>
                expect(toast.info).toHaveBeenCalledWith(
                    expect.stringMatching(/code 2fa/i),
                    expect.any(Object)
                )
            );
        });

        it("shows 2FA required error when code field is empty and verify is clicked", async () => {
            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            const verifyBtn = await screen.findByRole("button", { name: /vérifier le code/i });
            await userEvent.click(verifyBtn);

            expect(await screen.findByText(/code requis/i)).toBeInTheDocument();
        });

        it("calls verify-2fa API with userId and code", async () => {
            apiPost.mockResolvedValueOnce({ data: { access_token: "2fa-token" } });

            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            const otpInput = await screen.findByLabelText(/code d'authentification/i);
            await userEvent.type(otpInput, "123456");
            await userEvent.click(screen.getByRole("button", { name: /vérifier le code/i }));

            await waitFor(() => {
                expect(apiPost).toHaveBeenCalledWith("/users/verify-2fa", {
                    userId: 42,
                    code: "123456",
                });
            });
        });

        it("logs in and navigates after valid 2FA code", async () => {
            apiPost.mockResolvedValueOnce({ data: { access_token: "2fa-token" } });

            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            const otpInput = await screen.findByLabelText(/code d'authentification/i);
            await userEvent.type(otpInput, "654321");
            await userEvent.click(screen.getByRole("button", { name: /vérifier le code/i }));

            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith("2fa-token");
                expect(mockNavigate).toHaveBeenCalledWith("/onboarding");
            });
        });

        it("shows invalid code error when 2FA API returns error", async () => {
            apiPost.mockRejectedValueOnce({ response: { status: 401 } });

            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            const otpInput = await screen.findByLabelText(/code d'authentification/i);
            await userEvent.type(otpInput, "000000");
            await userEvent.click(screen.getByRole("button", { name: /vérifier le code/i }));

            expect(await screen.findByText(/code 2fa invalide/i)).toBeInTheDocument();
        });
    });

    // ── Failed Login ───────────────────────────────────────────────────────────

    describe("Failed login", () => {
        it("shows 401 error message for wrong credentials", async () => {
            apiPost.mockRejectedValueOnce({ response: { status: 401 } });

            renderLogin();
            await fillCredentials("user@example.com", "wrongpassword");
            await clickLogin();

            expect(await screen.findByText(/email ou mot de passe incorrect/i)).toBeInTheDocument();
        });

        it("shows generic error message for unknown errors", async () => {
            apiPost.mockRejectedValueOnce({ response: { status: 500 } });

            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            expect(await screen.findByText(/erreur inconnue/i)).toBeInTheDocument();
        });

        it("shows generic error when there is no response", async () => {
            apiPost.mockRejectedValueOnce(new Error("Network Error"));

            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            expect(await screen.findByText(/erreur inconnue/i)).toBeInTheDocument();
        });

        it("does not navigate on failed login", async () => {
            apiPost.mockRejectedValueOnce({ response: { status: 401 } });

            renderLogin();
            await fillCredentials("user@example.com", "wrongpassword");
            await clickLogin();

            await waitFor(() =>
                expect(screen.getByText(/email ou mot de passe incorrect/i)).toBeInTheDocument()
            );
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it("does not call login() on failed login", async () => {
            apiPost.mockRejectedValueOnce({ response: { status: 401 } });

            renderLogin();
            await fillCredentials("user@example.com", "wrongpassword");
            await clickLogin();

            await waitFor(() =>
                expect(screen.getByText(/email ou mot de passe incorrect/i)).toBeInTheDocument()
            );
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it("error message has role=alert for accessibility", async () => {
            apiPost.mockRejectedValueOnce({ response: { status: 401 } });

            renderLogin();
            await fillCredentials("user@example.com", "wrongpassword");
            await clickLogin();

            const alert = await screen.findByRole("alert");
            expect(alert).toBeInTheDocument();
        });
    });

    // ── Loading State ──────────────────────────────────────────────────────────

    describe("Loading state", () => {
        it("shows loading text while API call is in progress", async () => {
            apiPost.mockImplementation(() => new Promise(() => { })); // never resolves

            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            expect(await screen.findByText(/connexion en cours/i)).toBeInTheDocument();
        });

        it("disables the submit button while loading", async () => {
            apiPost.mockImplementation(() => new Promise(() => { }));

            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            const btn = screen.getByRole("button", { name: /connexion en cours/i });
            expect(btn).toBeDisabled();
        });

        it("re-enables the submit button after a failed request", async () => {
            apiPost.mockRejectedValueOnce({ response: { status: 401 } });

            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            await waitFor(() =>
                expect(screen.getByRole("button", { name: /se connecter/i })).not.toBeDisabled()
            );
        });

        it("button has aria-busy=true while loading", async () => {
            apiPost.mockImplementation(() => new Promise(() => { }));

            renderLogin();
            await fillCredentials("user@example.com", "password123");
            await clickLogin();

            await waitFor(() =>
                expect(
                    screen.getByRole("button", { name: /connexion en cours/i })
                ).toHaveAttribute("aria-busy", "true")
            );
        });
    });

    // ── Accessibility ──────────────────────────────────────────────────────────

    describe("Accessibility", () => {
        it("email input has correct autocomplete attribute", () => {
            renderLogin();
            expect(screen.getByLabelText(/adresse e-mail/i)).toHaveAttribute("autocomplete", "email");
        });

        it("password input has correct autocomplete attribute", () => {
            renderLogin();
            expect(screen.getByPlaceholderText(/votre mot de passe/i)).toHaveAttribute(
                "autocomplete",
                "current-password"
            );
        });

        it("email error is linked via aria-describedby", async () => {
            renderLogin();
            await clickLogin();

            const emailInput = screen.getByLabelText(/adresse e-mail/i);
            await waitFor(() =>
                expect(emailInput).toHaveAttribute("aria-describedby", "email-error")
            );
        });

        it("password error is linked via aria-describedby", async () => {
            renderLogin();
            await userEvent.type(screen.getByLabelText(/adresse e-mail/i), "test@example.com");
            await clickLogin();

            const passwordInput = screen.getByPlaceholderText(/votre mot de passe/i);
            await waitFor(() =>
                expect(passwordInput).toHaveAttribute("aria-describedby", "password-error")
            );
        });

        it("secondary links section has aria-label", () => {
            renderLogin();
            expect(
                screen.getByRole("navigation", { name: /liens secondaires/i })
            ).toBeInTheDocument();
        });
    });
});