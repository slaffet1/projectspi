import { Input } from "@/app/components/ui/input";
import { Search } from "lucide-react";
import { useId } from "react";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SearchInput({ 
  placeholder = "Rechercher...", 
  value, 
  onChange,
  className 
}: SearchInputProps) {
  const inputId = useId();

  return (
    <div className={`relative ${className || ""}`}>
      <label htmlFor={inputId} className="sr-only">
        {placeholder}
      </label>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={inputId}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="pl-9 bg-white border-border focus:border-primary focus:ring-primary"
      />
    </div>
  );
}