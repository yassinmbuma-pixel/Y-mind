export type Business = {
  id: string; owner_id: string; name: string; city: string; category: string;
  description: string; products_services: string[]; service_areas: string[];
  website_url?: string | null; lead_destination?: string | null; status: "active" | "paused";
};
export type Prospect = {
  id: string; business_id: string; source_type: string; source_url?: string | null;
  organization_name?: string | null; contact_name?: string | null; email?: string | null;
  phone?: string | null; location?: string | null; need_summary?: string | null;
  intent_evidence?: string | null; score: number | null; score_reason: string[];
  status: string; created_at: string;
};
export type Campaign = {
  id: string; business_id: string; name: string; objective: string; target_location: string;
  target_keywords: string[]; offer: string; status: string; created_at: string;
};
