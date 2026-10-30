const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export type LeadPayload =
{
  kind: "DEMO_REQUEST";
  name: string;
  email: string;
  phone?: string;
  academy: string;
  city?: string;
  role: string;
  size?: string;
  message?: string;
  website?: string;
} |
{kind: "SPORT_NOTIFY";email: string;sport: string;website?: string;};

/**
 * Sends a website form to POST /api/public/leads, which stores it in the admin
 * CRM and notifies the team. Throws on any non-2xx so the form can show an error
 * instead of a false "received".
 */
export async function submitLead(payload: LeadPayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/public/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Lead submission failed: ${res.status}`);
}
