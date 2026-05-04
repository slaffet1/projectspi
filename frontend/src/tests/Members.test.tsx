import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Members from "@/app/pages/Members";

const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);

vi.mock("@/app/context/BusinessContext", () => ({
    useBusiness: () => ({
        activeBusiness: { id: 1 },
    }),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

async function renderMembers(members = []) {
    mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => members,
    });

    render(<Members />);

    await screen.findByText(/gestion des membres/i);
}

async function fillInviteForm() {
    await userEvent.type(
        screen.getByPlaceholderText(/exemple@email.com/i),
        "test@mail.com"
    );

    await userEvent.selectOptions(screen.getByRole("combobox"), "1");
}

async function clickInvite() {
    await userEvent.click(screen.getByRole("button", { name: /inviter/i }));
}

async function renderWithMembers() {
    await renderMembers([
        {
            user_id: 1,
            firstname: "John",
            lastname: "Doe",
            email: "john@mail.com",
            role: "Admin",
            joined_at: new Date().toISOString(),
        },
    ]);
}

describe("Members Page - Rendering", () => {
    it("renders page title", async () => {
        await renderMembers([]);

        expect(
            screen.getByRole("heading", { name: /gestion des membres/i })
        ).toBeInTheDocument();
    });

    it("renders members count", async () => {
        await renderWithMembers();

        expect(screen.getByText(/1 membre/i)).toBeInTheDocument();
    });

    it("renders invitation form", async () => {
        await renderMembers([]);

        expect(
            screen.getByPlaceholderText(/exemple@email.com/i)
        ).toBeInTheDocument();

        expect(screen.getByRole("combobox")).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /inviter/i })
        ).toBeInTheDocument();
    });

   it("renders section title instead of table headers", async () => {
    await renderMembers([]);

    expect(
        screen.getByText(/membres actuels/i)
    ).toBeInTheDocument();

    expect(
        screen.getByText(/aucun membre pour le moment/i)
    ).toBeInTheDocument();
});
    it("renders empty state", async () => {
        await renderMembers([]);

        expect(
            screen.getByText(/aucun membre pour le moment/i)
        ).toBeInTheDocument();
    });

    it("renders member row", async () => {
        await renderWithMembers();

        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("john@mail.com")).toBeInTheDocument();

        const row = screen.getByText("John Doe").closest("tr")!;
        expect(within(row).getByText("Admin")).toBeInTheDocument();
    });
});

describe("Members Page - Actions", () => {
    it("invites a member successfully", async () => {
        await renderMembers([]);

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Invitation envoyée" }),
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        await fillInviteForm();
        await clickInvite();

        expect(
            await screen.findByText(/invitation envoyée/i)
        ).toBeInTheDocument();
    });

    it("does not invite when fields are empty", async () => {
        await renderMembers([]);

        await clickInvite();

        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("removes a member", async () => {
        window.confirm = vi.fn(() => true);

        await renderMembers([
            {
                user_id: 5,
                firstname: "Jane",
                lastname: "Doe",
                email: "jane@mail.com",
                role: "Member",
                joined_at: new Date().toISOString(),
            },
        ]);

        mockFetch.mockResolvedValueOnce({ ok: true });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        const row = screen.getByText("Jane Doe").closest("tr")!;
        const deleteButton = within(row).getByRole("button");

        await userEvent.click(deleteButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                "http://localhost:3001/api/businesses/1/members/5",
                { method: "DELETE" }
            );
        });
    });
});