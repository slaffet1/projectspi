import { useEffect, useState } from "react";
import { useBusiness } from "../context/BusinessContext";
import { api } from "@/app/services/api";
import { ApproveModal } from "./ApproveModal";

export default function JoinRequests() {
  const { activeBusiness } = useBusiness();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (activeBusiness) fetchRequests();
  }, [activeBusiness]);

  const fetchRequests = async () => {
    const res = await api.get(`/user-management/join-requests/${activeBusiness.id}`);
    setRequests(res.data);
  };

  const reject = async (id: number) => {
    await api.delete(`/user-management/reject-request/${id}`);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const getInitials = (firstname: string, lastname: string) =>
    `${firstname?.[0] ?? ""}${lastname?.[0] ?? ""}`.toUpperCase();

  const avatarColors = [
    { bg: "bg-blue-100", text: "text-blue-800" },
    { bg: "bg-green-100", text: "text-green-800" },
    { bg: "bg-pink-100", text: "text-pink-800" },
    { bg: "bg-amber-100", text: "text-amber-800" },
    { bg: "bg-teal-100", text: "text-teal-800" },
  ];

  if (!activeBusiness) {
    return (
      <p className="text-sm text-muted-foreground">Aucune entreprise active</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-foreground">
          Demandes pour{" "}
          <span className="font-semibold">{activeBusiness.name}</span>
        </h2>
        {requests.length > 0 && (
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {requests.length} en attente
          </span>
        )}
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        {requests.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Aucune demande en attente
          </div>
        ) : (
          <table className="w-full table-fixed text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-[45%] px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Utilisateur
                </th>
                <th className="w-[25%] px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="w-[30%] px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((r, i) => {
                const color = avatarColors[i % avatarColors.length];
                return (
                  <tr key={r.id} className="transition-colors hover:bg-muted/30">
                    {/* User cell */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${color.bg} ${color.text}`}
                        >
                          {getInitials(r.user.firstname, r.user.lastname)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {r.user.firstname} {r.user.lastname}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date cell */}
                    <td className="px-4 py-3">
                      <span className="rounded border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* Actions cell */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelected(r)}
                          className="rounded-md border border-blue-300 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => reject(r.id)}
                          className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                        >
                          Rejeter
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <ApproveModal
          request={selected}
          onClose={() => {
            setSelected(null);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}