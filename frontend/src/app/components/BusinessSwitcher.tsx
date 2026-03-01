import { useState } from 'react';
import { Check, ChevronDown, Plus, Building2, Loader2 } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useNavigate } from 'react-router-dom';

export default function BusinessSwitcher() {
  const { businesses, activeBusiness, activeRole, loading, switchBusiness } = useBusiness();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const roleColors: Record<string, string> = {
    OWNER:          'bg-purple-100 text-purple-700',
    ADMIN:          'bg-blue-100 text-blue-700',
    ACCOUNTANT:     'bg-green-100 text-green-700',
    MEMBER:         'bg-gray-100 text-gray-700',
    PLATFORM_ADMIN: 'bg-red-100 text-red-700',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 transition text-sm font-medium max-w-[220px]"
      >
        <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="truncate">
          {activeBusiness ? activeBusiness.name : 'Choisir une entreprise'}
        </span>
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin ml-auto shrink-0" />
          : <ChevronDown className="h-4 w-4 ml-auto shrink-0 text-gray-400" />
        }
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-1 w-64 bg-white border rounded-xl shadow-lg z-20 py-1 overflow-hidden">
            {/* Role badge */}
            {activeRole && (
              <div className="px-3 py-2 border-b">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[activeRole] ?? 'bg-gray-100 text-gray-700'}`}>
                  {activeRole}
                </span>
              </div>
            )}

            {/* Business list */}
            <div className="max-h-48 overflow-y-auto">
              {businesses.length === 0 ? (
                <p className="text-sm text-gray-400 px-3 py-3 text-center">
                  Aucune entreprise
                </p>
              ) : (
                businesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={async () => {
                      await switchBusiness(b.id);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-blue-50 text-left transition"
                  >
                    <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">
                        {b.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <p className="text-xs text-gray-400 truncate">{b.your_role}</p>
                    </div>
                    {activeBusiness?.id === b.id && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Create new */}
            <div className="border-t pt-1">
              <button
                onClick={() => { setOpen(false); navigate('/app/businesses/new'); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-sm text-blue-600 font-medium transition"
              >
                <Plus className="h-4 w-4" />
                Créer une entreprise
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}