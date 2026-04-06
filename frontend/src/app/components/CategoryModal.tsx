import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { categoryService } from "@/app/services/expenseService";
import { toast } from "react-toastify";

export default function CategoryModal({
  open,
  setOpen,
  businessId,
  onSuccess,
}: any) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("📦");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name) return toast.error("Nom requis");

    setLoading(true);
    try {
      await categoryService.create(businessId, {
        name,
        color,
        icon,
      });

      toast.success("Catégorie ajoutée");
      setOpen(false);
      setName("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">

        <h2 className="text-lg font-semibold">Nouvelle catégorie</h2>

        <Input
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex gap-2">
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />

          <Input
            placeholder="Icon (emoji)"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>

          <Button onClick={handleSubmit} disabled={loading}>
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}