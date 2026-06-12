// Usage tracking for Replicate API and internal tracking

interface GenerationRecord {
  id: string;
  timestamp: string;
  type: 'music' | 'vocals' | 'stems' | 'trim';
  model: string;
  duration: number;
  costEstimate: number;
  prompt?: string;
  trackId?: string;
}

interface UsageStats {
  totalCost: number;
  todayCost: number;
  thisWeekCost: number;
  thisMonthCost: number;
  totalGenerations: number;
  breakdown: {
    music: { count: number; cost: number };
    vocals: { count: number; cost: number };
    stems: { count: number; cost: number };
    trim: { count: number; cost: number };
  };
  recent: GenerationRecord[];
}

// Cost estimates (update these based on Replicate pricing)
const COST_ESTIMATES = {
  music: {
    small: 0.005, // $0.005 per 5 seconds
    medium: 0.01, // $0.01 per 5 seconds
  },
  vocals: 0.05, // $0.05 per generation
  stems: 0.05,  // $0.05 per separation
  trim: 0.00,   // Free (client-side)
};

// Storage key
const STORAGE_KEY = 'suno-usage-history';

/**
 * Calculate cost based on generation type and parameters
 */
export function calculateCost(type: string, model: string = 'medium', duration: number = 30): number {
  switch (type) {
    case 'music':
      const rate = model === 'small' ? COST_ESTIMATES.music.small : COST_ESTIMATES.music.medium;
      return rate * (duration / 5);
    case 'vocals':
      return COST_ESTIMATES.vocals;
    case 'stems':
      return COST_ESTIMATES.stems;
    case 'trim':
      return COST_ESTIMATES.trim;
    default:
      return 0;
  }
}

/**
 * Record a generation
 */
export function recordGeneration(
  type: 'music' | 'vocals' | 'stems' | 'trim',
  options: {
    model?: string;
    duration?: number;
    prompt?: string;
    trackId?: string;
  } = {}
): GenerationRecord {
  const { model = 'medium', duration = 30, prompt, trackId } = options;
  const cost = calculateCost(type, model, duration);
  
  const record: GenerationRecord = {
    id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    type,
    model,
    duration,
    costEstimate: cost,
    prompt,
    trackId,
  };

  // Save to localStorage
  saveRecord(record);

  return record;
}

/**
 * Save record to localStorage
 */
function saveRecord(record: GenerationRecord): void {
  try {
    const existing = loadRecords();
    existing.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save usage record:', e);
  }
}

/**
 * Load all records from localStorage
 */
export function loadRecords(): GenerationRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Get usage statistics
 */
export function getUsageStats(): UsageStats {
  const records = loadRecords();
  const now = new Date();
  
  // Filter by time periods
  const today = records.filter(r => {
    const date = new Date(r.timestamp);
    return date.toDateString() === now.toDateString();
  });
  
  const thisWeek = records.filter(r => {
    const date = new Date(r.timestamp);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return date >= weekStart;
  });
  
  const thisMonth = records.filter(r => {
    const date = new Date(r.timestamp);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  
  // Calculate stats
  const stats: UsageStats = {
    totalCost: 0,
    todayCost: 0,
    thisWeekCost: 0,
    thisMonthCost: 0,
    totalGenerations: records.length,
    breakdown: {
      music: { count: 0, cost: 0 },
      vocals: { count: 0, cost: 0 },
      stems: { count: 0, cost: 0 },
      trim: { count: 0, cost: 0 },
    },
    recent: records.slice(-20).reverse(), // Last 20, most recent first
  };
  
  records.forEach(record => {
    stats.totalCost += record.costEstimate;
    
    if (today.includes(record)) stats.todayCost += record.costEstimate;
    if (thisWeek.includes(record)) stats.thisWeekCost += record.costEstimate;
    if (thisMonth.includes(record)) stats.thisMonthCost += record.costEstimate;
    
    stats.breakdown[record.type].count++;
    stats.breakdown[record.type].cost += record.costEstimate;
  });
  
  return stats;
}

/**
 * Clear all usage data
 */
export function clearUsageData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// Replicate API types
interface ReplicatePrediction {
  id: string;
  model: string;
  created_at: string;
  status: string;
  input: any;
  output: any;
}

/**
 * Fetch actual Replicate usage from their API
 * Note: Replicate doesn't have a public usage API yet,
 * so this is a placeholder for when they add it
 */
export async function fetchReplicateUsage(apiKey: string): Promise<{
  totalCost: number;
  remainingCredits: number;
} | null> {
  try {
    // Replicate doesn't have a public usage API yet
    // This is a placeholder for future implementation
    // For now, we'll use our internal tracking
    
    // Attempt to fetch user info (if Replicate adds this endpoint)
    const response = await fetch('https://api.replicate.com/v1/account', {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      // Parse credits if available
      if (data.credits !== undefined) {
        return {
          totalCost: 0, // Would need to calculate from usage
          remainingCredits: data.credits,
        };
      }
    }
    
    return null;
  } catch (e) {
    console.error('Failed to fetch Replicate usage:', e);
    return null;
  }
}

/**
 * Estimate Replicate credits used
 * Replicate typically charges per prediction
 */
export function estimateReplicateCreditsUsed(): number {
  const records = loadRecords();
  // Approximate: 1 credit = $0.01 for MusicGen
  // This is an estimate - actual pricing may vary
  const creditsUsed = records.reduce((sum, record) => {
    if (record.type === 'music') return sum + (record.duration / 30);
    if (record.type === 'vocals') return sum + 5;
    if (record.type === 'stems') return sum + 5;
    return sum;
  }, 0);
  
  return Math.round(creditsUsed * 10) / 10; // Round to 1 decimal
}
