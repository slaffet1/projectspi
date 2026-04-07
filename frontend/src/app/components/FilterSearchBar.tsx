import { SearchInput } from './SearchInput';
import { SemanticSearch } from './SemanticSearch';
import { SearchResult } from '../services/searchService';

interface FilterSearchBarProps {
  search: string;
  setSearch: (value: string) => void;
  type?: 'products' | 'clients';
}

export function FilterSearchBar({ search, setSearch, type = 'products' }: FilterSearchBarProps) {
  
  // Fonction déclenchée quand l'IA trouve un résultat et que l'utilisateur clique dessus
  const handleAiSelect = (item: SearchResult) => {
    // On met à jour le filtre global avec le nom exact trouvé par l'IA
    setSearch(item.name);
  };

  return (
    <div className="flex flex-col md:flex-row w-full gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
      
      {/* --- Section 1 : Recherche Classique --- */}
      <div className="flex-1 w-full">
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">
          Filtre classique
        </label>
        <SearchInput 
          placeholder="Rechercher par nom, référence..."
          value={search} 
          onChange={setSearch} 
        />
      </div>

      {/* Séparateur visuel (visible uniquement sur grand écran) */}
      <div className="hidden md:block w-px h-10 bg-gray-200"></div>

      {/* --- Section 2 : Recherche Sémantique (IA) --- */}
      <div className="flex-1 w-full">
        <label className="text-xs font-semibold text-purple-600 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
          <span>✨</span> Assistant IA
        </label>
        <SemanticSearch
          type={type}
          placeholder={`Décrivez ce que vous cherchez...`}
          onSelect={handleAiSelect}
        />
      </div>
      
    </div>
  );
}