import axios from 'axios';
import type { CenterPublicInfo } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Fetch public center info by slug (no auth required)
 * Used for branded login pages
 */
export const getCenterPublicInfo = async (slug: string): Promise<CenterPublicInfo> => {
  const response = await axios.get<CenterPublicInfo>(`${API_BASE_URL}/centers/${slug}/info`);
  return response.data;
};
