import { useState, useCallback } from 'react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { semanticSearch, SearchResult } from '../services/searchService';

interface Props {
  type?: 'products' | 'clients';
  onSelect?: (item: SearchResult) => void;
  placeholder?: string;
}

function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return useCallback(
    (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    },
    [fn],
  ) as T;
}

export function SemanticSearch({ type = 'products', onSelect, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const doSearch = useDebounce(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await semanticSearch(q, type);
      setResults(data);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, 400);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    doSearch(e.target.value);
  };

  return (
    <div className="relative w-full max-w-md">
      <Input
        value={query}
        onChange={handleChange}
        placeholder={placeholder ?? `Recherche sémantique ${type}...`}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {loading && (
        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">...</span>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border bg-background shadow-md max-h-72 overflow-y-auto">
          {results.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer text-sm"
              onMouseDown={() => { onSelect?.(item); setQuery(item.name); setOpen(false); }}
            >
              <span>{item.name}</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {Math.round(item.score * 100)}%
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}