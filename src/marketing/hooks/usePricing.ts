import { useEffect, useState } from "react";
import { FALLBACK_PRICING, type PricingItem } from "../data/pricing";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const TIMEOUT_MS = 6000;

/**
 * The live pricing catalog from GET /api/public/pricing. Starts from the
 * bundled snapshot so the page renders immediately, then swaps in live prices;
 * on any failure it keeps the snapshot.
 */
export function usePricing(): {items: PricingItem[];live: boolean;} {
  const [state, setState] = useState({ items: FALLBACK_PRICING, live: false });

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    fetch(`${API_BASE_URL}/public/pricing`, { signal: controller.signal }).
    then((res) => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))).
    then((items: PricingItem[]) => {
      if (Array.isArray(items) && items.length > 0) setState({ items, live: true });
    }).
    catch(() => {
      // Keep the snapshot.
    }).
    finally(() => window.clearTimeout(timer));
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return state;
}
