import { useEffect, useRef, useState } from "react";
import { useBusiness } from "../context/BusinessContext";
import { api } from "@/app/services/api";
import { ApproveModal } from "./ApproveModal";

type JoinRequest = {
  id: number;
  created_at: string;
  user: {
    firstname: string;
    lastname: string;
    email: string;
  };
};

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800" },
  { bg: "bg-green-100", text: "text-green-800" },
  { bg: "bg-pink-100", text: "text-pink-800" },
  { bg: "bg-amber-100", text: "text-amber-800" },
  { bg: "bg-teal-100", text: "text-teal-800" },
];

function getInitials(firstname: string, lastname: string) {
  return `${firstname?.[0] ?? ""}${lastname?.[0] ?? ""}`.toUpperCase();
}

export default function JoinRequests() {
  const { activeBusiness } = useBusiness();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [selected, setSelected] = useState<JoinRequest | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeBusiness) fetchRequests();
  }, [activeBusiness]);

  const fetchRequests = async () => {
    const res = await api.get(
      `/user-management/join-requests/${activeBusiness!.id}`
    );
    setRequests(res.data);
  };

  const reject = async (request: JoinRequest) => {
    await api.delete(`/user-management/reject-request/${request.id}`);
    setRequests((prev) => prev.filter((r) => r.id !== request.id));
    announce(
      `Demande de ${request.user.firstname} ${request.user.lastname} rejetée`
    );
  };

  const announce = (message: string) => {
    if (!liveRef.current) return;
    liveRef.current.textContent = "";
    setTimeout(() => {
      if (liveRef.current) liveRef.current.textContent = message;
    }, 50);
  };

  if (!activeBusiness) {
    return (
      <p className="text-sm text-muted-foreground">Aucune entreprise active</p>
    );
  }

  return (
    <>
      {/* Visually hidden heading for screen readers */}
      <h2 className="sr-only">
        Tableau des demandes d'adhésion —{" "}
        {requests.length} demande{requests.length !== 1 ? "s" : ""} en attente
        pour {activeBusiness.name}
      </h2>

      {/* Live region for action announcements */}
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-base font-medium text-foreground" id="table-caption">
            Demandes pour{" "}
            <span className="font-semibold">{activeBusiness.name}</span>
          </p>
          {requests.length > 0 && (
            <span
              className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              aria-label={`${requests.length} demandes en attente`}
            >
              {requests.length} en attente
            </span>
          )}
        </div>

        {/* Table card */}
        <div
          className="overflow-hidden rounded-xl border border-border bg-background"
          role="region"
          aria-labelledby="table-caption"
        >
          {requests.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucune demande en attente
            </p>
          ) : (
            <table
              className="w-full table-fixed text-sm"
              aria-describedby="table-caption"
              aria-rowcount={requests.length}
            >
              <thead className="bg-muted/50">
                <tr>
                  <th
                    scope="col"
                    className="w-[45%] px-4 py-2.5 text-left text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
                  >
                    Utilisateur
                  </th>
                  <th
                    scope="col"
                    className="w-[25%] px-4 py-2.5 text-left text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
                  >
                    Date de demande
                  </th>
                  <th
                    scope="col"
                    className="w-[30%] px-4 py-2.5 text-right text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((r, i) => {
                  const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  const fullName = `${r.user.firstname} ${r.user.lastname}`;
                  const dateISO = new Date(r.created_at)
                    .toISOString()
                    .split("T")[0];
                  const dateLabel = new Date(r.created_at).toLocaleDateString(
                    "fr-FR",
                    { day: "2-digit", month: "short", year: "numeric" }
                  );

                  return (
                    <tr
                      key={r.id}
                      aria-rowindex={i + 1}
                      className="transition-colors hover:bg-muted/30 focus-within:outline focus-within:outline-2 focus-within:outline-blue-600 focus-within:-outline-offset-2"
                    >
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            aria-hidden="true"
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${color.bg} ${color.text}`}
                          >
                            {getInitials(r.user.firstname, r.user.lastname)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {fullName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {r.user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <span className="rounded border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <time dateTime={dateISO}>{dateLabel}</time>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-end gap-2"
                          role="group"
                          aria-label={`Actions pour ${fullName}`}
                        >
                          <button
                            type="button"
                            aria-label={`Approuver la demande de ${fullName}`}
                            onClick={() => setSelected(r)}
                            className="rounded-md border border-blue-300 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          >
                            Approuver
                          </button>
                          <button
                            type="button"
                            aria-label={`Rejeter la demande de ${fullName}`}
                            onClick={() => reject(r)}
                            className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
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
      </div>

      {selected && (
        <ApproveModal
          request={selected}
          onClose={() => {
            announce(
              `Demande de ${selected.user.firstname} ${selected.user.lastname} approuvée`
            );
            setSelected(null);
            fetchRequests();
          }}
        />
      )}
    </>
  );
}