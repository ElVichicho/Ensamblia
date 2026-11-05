export type ComponentCategory = 
  | 'cpu'
  | 'motherboard'
  | 'ram'
  | 'gpu'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooler';

export interface ComponentItem {
  id: string;
  category: ComponentCategory;
  categoryLabel: string;
  name: string;
  brand: string;
  specs: string;
  priceCLP: number;
  store: string;
  storeUrl?: string;
  affiliateUrl: string;
  imageUrl?: string;
  aiReason: string;
  compatibilityNote: string;
}

export interface CompatibilityCheck {
  title: string;
  status: 'valid' | 'warning' | 'error';
  detail: string;
}

export interface BuildQuote {
  buildName: string;
  targetUse: string;
  totalBudgetCLP: number;
  actualCostCLP: number;
  estimatedFps1080p: number;
  estimatedFps1440p: number;
  totalTdpWatts: number;
  recommendedPsuWatts: number;
  compatibilityScore: number;
  compatibilityChecks: CompatibilityCheck[];
  components: ComponentItem[];
  executiveSummary: string;
  pros: string[];
  upgradePath: string;
}

export interface BuilderFilters {
  budgetCLP: number;
  useCase: 'gaming_1080p' | 'gaming_1440p' | 'streaming_editing' | 'ai_dev' | 'office_school';
  cpuPreference: 'any' | 'amd' | 'intel';
  gpuPreference: 'any' | 'nvidia' | 'amd';
  storageCapacity: '500gb' | '1tb' | '2tb' | 'any';
  storageType: 'nvme' | 'sata' | 'any';
  ramCapacity: '16gb' | '32gb' | '64gb' | 'any';
  wifiRequired: boolean;
  coolingPreference: 'air' | 'liquid' | 'any';
  caseSize: 'compact' | 'standard' | 'any';
  customInstructions?: string;
}
