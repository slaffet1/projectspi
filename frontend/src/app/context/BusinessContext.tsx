import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Business = {
  id: number;
  name: string;
  legal_name?: string;
  matricule_fiscale?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  logo?: string;
  invoice_prefix?: string;
  created_at?: string;
  updated_at?: string;
  your_role?: string;
  joined_at?: string;
};

type BusinessContextType = {
  businesses: Business[];
  activeBusiness: Business | null;
  activeRole: string | null;
  permissions: string[];
  loading: boolean;
  switchBusiness: (businessId: number) => Promise<void>;
  refreshBusinesses: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const BusinessContext = createContext<BusinessContextType>({} as BusinessContextType);

export const BusinessProvider = ({ children }: { children: React.ReactNode }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(() => {
    const stored = localStorage.getItem('activeBusiness');
    return stored ? JSON.parse(stored) : null;
  });
  const [activeRole, setActiveRole] = useState<string | null>(
    () => localStorage.getItem('activeRole')
  );
  const [permissions, setPermissions] = useState<string[]>(() => {
    const stored = localStorage.getItem('permissions');
    return stored ? JSON.parse(stored) : [];
  });
  const [loading, setLoading] = useState(false);

  // Set active business id on every API request via header
  useEffect(() => {
    if (activeBusiness?.id) {
      api.defaults.headers.common['X-Business-Id'] = activeBusiness.id;
    } else {
      delete api.defaults.headers.common['X-Business-Id'];
    }
  }, [activeBusiness]);

  const refreshBusinesses = async () => {
    try {
      const res = await api.get('/businesses/my');
      setBusinesses(res.data);
      // Auto-select first business if none active
      if (!activeBusiness && res.data.length > 0) {
        await switchBusiness(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load businesses', err);
    }
  };

  const switchBusiness = async (businessId: number) => {
    setLoading(true);
    try {
      const res = await api.post(`/businesses/${businessId}/switch`);
      const { business, role, permissions: perms } = res.data;

      setActiveBusiness(business);
      setActiveRole(role);
      setPermissions(perms);

      localStorage.setItem('activeBusiness', JSON.stringify(business));
      localStorage.setItem('activeRole', role);
      localStorage.setItem('permissions', JSON.stringify(perms));

      api.defaults.headers.common['X-Business-Id'] = businessId;
    } catch (err) {
      console.error('Failed to switch business', err);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string) => permissions.includes(permission);
  const isOwner = () => activeRole === 'OWNER';
  const isAdmin = () => activeRole === 'ADMIN' || activeRole === 'OWNER';

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        activeRole,
        permissions,
        loading,
        switchBusiness,
        refreshBusinesses,
        hasPermission,
        isOwner,
        isAdmin,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);