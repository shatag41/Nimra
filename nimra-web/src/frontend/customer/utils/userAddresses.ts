import { saveUserAddresses } from '@/utils/api';
import type { User } from '@/frontend/customer/contexts/AuthContext';

export interface SavedAddressRecord {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  name: string;
  mobile: string;
  altMobile?: string;
  email?: string;
  flatNo: string;
  buildingName?: string;
  locality: string;
  landmark?: string;
  pincode: string;
  state: string;
  city: string;
  country: string;
  instructions?: string;
  fullAddress?: string;
  isDefault?: boolean;
}

type AddressUser = User & {
  SavedAddresses?: string | SavedAddressRecord[];
};

export function normalizeSavedAddresses(addresses: SavedAddressRecord[]): SavedAddressRecord[] {
  const cleaned = addresses
    .filter(Boolean)
    .map((address, index) => ({
      ...address,
      id: String(address.id || `${Date.now()}-${index}`),
      type: address.type || 'Home',
      country: address.country || 'India',
      fullAddress: address.fullAddress || [address.flatNo, address.buildingName, address.locality, address.landmark].filter(Boolean).join(', '),
    }));

  if (cleaned.length === 0) return [];

  const defaultIndex = cleaned.findIndex((address) => address.isDefault);
  return cleaned.map((address, index) => ({
    ...address,
    isDefault: defaultIndex >= 0 ? index === defaultIndex : index === 0,
  }));
}

export function getUserSavedAddresses(user?: AddressUser | null): SavedAddressRecord[] {
  if (!user?.SavedAddresses) return [];

  try {
    const parsed = typeof user.SavedAddresses === 'string'
      ? JSON.parse(user.SavedAddresses || '[]')
      : user.SavedAddresses;
    return Array.isArray(parsed) ? normalizeSavedAddresses(parsed) : [];
  } catch {
    return [];
  }
}

export async function persistUserSavedAddresses(user: User, addresses: SavedAddressRecord[]) {
  const normalized = normalizeSavedAddresses(addresses);
  const result = await saveUserAddresses(user.ID, normalized);
  const saved = result.success && result.addresses
    ? normalizeSavedAddresses(result.addresses as SavedAddressRecord[])
    : normalized;
  return { result, addresses: saved };
}

export async function migrateLegacyLocalAddresses(user: User) {
  if (typeof window === 'undefined') {
    return { migrated: false, addresses: getUserSavedAddresses(user as AddressUser) };
  }

  const current = getUserSavedAddresses(user as AddressUser);
  if (current.length > 0) return { migrated: false, addresses: current };

  const legacyKey = `nimra_saved_addresses_${user.ID}`;
  const legacy = window.localStorage.getItem(legacyKey);
  if (!legacy) return { migrated: false, addresses: current };

  try {
    const parsed = JSON.parse(legacy);
    const addresses = Array.isArray(parsed) ? normalizeSavedAddresses(parsed) : [];
    if (addresses.length === 0) return { migrated: false, addresses: current };

    const { result, addresses: saved } = await persistUserSavedAddresses(user, addresses);
    if (result.success) {
      window.localStorage.removeItem(legacyKey);
      return { migrated: true, addresses: saved };
    }
  } catch {
    return { migrated: false, addresses: current };
  }

  return { migrated: false, addresses: current };
}
