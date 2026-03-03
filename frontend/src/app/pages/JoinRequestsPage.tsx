import { useEffect, useState } from "react";
import { useBusiness } from "../context/BusinessContext";
import { api } from "@/app/services/api";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ApproveModal } from "./ApproveModal";

export default function JoinRequests() {
  const { activeBusiness } = useBusiness();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (activeBusiness) {
      fetchRequests();
    }
  }, [activeBusiness]);

  const fetchRequests = async () => {
    const res = await api.get(
      `/user-management/join-requests/${activeBusiness.id}`
    );
    setRequests(res.data);
  };

  const reject = async (id: number) => {
    await api.delete(`/user-management/reject-request/${id}`);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  if (!activeBusiness) {
    return <p>Aucune entreprise active</p>;
  }

  return (
    <Card>
      <CardContent>
        <h2 className="text-lg font-bold mb-4">
          Demandes pour {activeBusiness.name}
        </h2>

        <table className="w-full">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.user.firstname} {r.user.lastname}</td>
                <td>{r.user.email}</td>
                <td>
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="flex gap-2">
                  <Button onClick={() => setSelected(r)}>
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => reject(r.id)}
                  >
                    Reject
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selected && (
          <ApproveModal
            request={selected}
            onClose={() => {
              setSelected(null);
              fetchRequests();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}