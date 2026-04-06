import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { toast } from "react-toastify";
import { expenseService } from "@/app/services/expenseService";

// ✅ TYPES
type ExpenseForm = {
  label: string;
  amount: string;
  expense_date: string;
  category_id: string;
  payment_method: string;
};

type ExpenseErrors = Partial<Record<keyof ExpenseForm, string>>;

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  businessId: number;
  categories: any[];
  onSuccess: () => void;
};

export default function ExpenseModal({
  open,
  setOpen,
  businessId,
  categories,
  onSuccess,
}: Props) {
  // ✅ STATE TYPO
  const [form, setForm] = useState<ExpenseForm>({
    label: "",
    amount: "",
    expense_date: "",
    category_id: "",
    payment_method: "",
  });

  const [errors, setErrors] = useState<ExpenseErrors>({});

  // ✅ VALIDATION
  const validate = () => {
    let newErrors: ExpenseErrors = {};

    if (!form.label) newErrors.label = "Label obligatoire";
    if (!form.amount || Number(form.amount) <= 0)
      newErrors.amount = "Montant invalide";
    if (!form.expense_date)
      newErrors.expense_date = "Date obligatoire";
    if (!form.category_id)
      newErrors.category_id = "Catégorie obligatoire";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ HANDLE CHANGE
  const handleChange = (
    field: keyof ExpenseForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // ✅ SUBMIT
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await expenseService.create(businessId, {
        label: form.label,
        amount: Number(form.amount),
        expense_date: form.expense_date,
        category_id: Number(form.category_id),
        payment_method: form.payment_method,
      });

      toast.success("Dépense ajoutée");

      setOpen(false);

      setForm({
        label: "",
        amount: "",
        expense_date: "",
        category_id: "",
        payment_method: "",
      });

      onSuccess();
    } catch (err) {
      toast.error("Erreur création");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle dépense</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* LABEL */}
          <div>
            <Input
              placeholder="Label"
              value={form.label}
              onChange={(e) =>
                handleChange("label", e.target.value)
              }
            />
            {errors.label && (
              <p className="text-red-500 text-sm mt-1">
                {errors.label}
              </p>
            )}
          </div>

          {/* AMOUNT */}
          <div>
            <Input
              type="number"
              placeholder="Montant"
              value={form.amount}
              onChange={(e) =>
                handleChange("amount", e.target.value)
              }
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">
                {errors.amount}
              </p>
            )}
          </div>

          {/* DATE */}
          <div>
            <Input
              type="date"
              value={form.expense_date}
              onChange={(e) =>
                handleChange("expense_date", e.target.value)
              }
            />
            {errors.expense_date && (
              <p className="text-red-500 text-sm mt-1">
                {errors.expense_date}
              </p>
            )}
          </div>

          {/* CATEGORY */}
          <div>
            <Select
              value={form.category_id}
              onValueChange={(val) =>
                handleChange("category_id", val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>

              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={String(cat.id)}
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.category_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.category_id}
              </p>
            )}
          </div>

          {/* PAYMENT */}
          <Input
            placeholder="Méthode de paiement (optionnel)"
            value={form.payment_method}
            onChange={(e) =>
              handleChange("payment_method", e.target.value)
            }
          />

          {/* BUTTON */}
          <Button className="w-full" onClick={handleSubmit}>
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}