export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};

export type User = {
  id: number;
  name: string;
  email: string;
  public_code?: string | null;
  creator?: Creator | null;
  employer?: { id: number; company_name?: string } | null;
  publisher_users?: Array<{
    id: number;
    role: string;
    is_active: boolean;
    publisher?: {
      id: number;
      username?: string;
      status?: string;
      display_name?: string;
    } | null;
  }>;
  roles?: Array<{ name: string }>;
};

export type Creator = {
  id: number;
  handle: string;
  bio?: string | null;
  trust_tier?: string;
  accent_color?: string;
  niches?: Niche[];
};

export type Listing = {
  id: number;
  title: string;
  company_name?: string | null;
  location_label?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  country_code?: string | null;
  is_remote?: boolean;
  category?: string | null;
  type?: string;
  destination_url: string;
  ppc_rate_usd?: string | number | null;
  ppr_rate_usd?: string | number | null;
  description?: string | null;
  status?: string;
  source?: string;
};

export type Niche = {
  id: number;
  code: string;
  name: string;
  group_name?: string | null;
  sort_order?: number;
};
