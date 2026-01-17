
export type Language = 'es' | 'en' | 'fr' | 'cn' | 'pt';

export interface Translation {
  dashboard: string;
  commanders: string;
  research: string;
  tactics: string;
  analyze: string;
  search: string;
  aiAssistant: string;
  uploadImage: string;
  analyzeVideo: string;
  dailyProgress: string;
  criticalReminder: string;
  civilizationChina: string;
}

export interface Commander {
  id: string;
  name: string;
  rarity: 'Legendary' | 'Epic';
  type: string;
  tier: string;
  skills: number[];
  image: string;
}
