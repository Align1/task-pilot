// Subscription tier definitions and feature gates

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due';

export interface SubscriptionLimits {
  maxProjects: number | null; // null = unlimited
  maxTasksPerMonth: number | null;
  maxActiveTimers: number;
  maxTeamMembers: number | null;
  exportFormats: string[];
  analyticsDepth: 'basic' | 'advanced' | 'premium';
  aiInsights: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  storageGB: number;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: SubscriptionLimits;
  features: string[];
  popular?: boolean;
}

// Subscription tier configurations
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    name: 'Free',
    description: 'Perfect for getting started with time tracking',
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      maxProjects: 3,
      maxTasksPerMonth: 50,
      maxActiveTimers: 1,
      maxTeamMembers: 1,
      exportFormats: ['CSV'],
      analyticsDepth: 'basic',
      aiInsights: false,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false,
      storageGB: 0.5
    },
    features: [
      '3 Projects',
      '50 Tasks per month',
      'Basic time tracking',
      'Basic analytics',
      'CSV export',
      '500MB storage',
      'Email support'
    ]
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    description: 'For professionals and power users',
    priceMonthly: 9.99,
    priceYearly: 99.99, // 2 months free
    limits: {
      maxProjects: null, // Unlimited
      maxTasksPerMonth: null, // Unlimited
      maxActiveTimers: 5,
      maxTeamMembers: 5,
      exportFormats: ['CSV', 'PDF', 'Excel', 'JSON'],
      analyticsDepth: 'advanced',
      aiInsights: true,
      prioritySupport: true,
      customBranding: false,
      apiAccess: true,
      storageGB: 10
    },
    features: [
      'Unlimited projects',
      'Unlimited tasks',
      '5 Active timers',
      'Advanced analytics',
      'AI-powered insights',
      'All export formats',
      'API access',
      '10GB storage',
      'Priority support'
    ],
    popular: true
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'For teams and organizations',
    priceMonthly: 29.99,
    priceYearly: 299.99,
    limits: {
      maxProjects: null, // Unlimited
      maxTasksPerMonth: null, // Unlimited
      maxActiveTimers: null, // Unlimited
      maxTeamMembers: null, // Unlimited
      exportFormats: ['CSV', 'PDF', 'Excel', 'JSON', 'XML'],
      analyticsDepth: 'premium',
      aiInsights: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      storageGB: 100
    },
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Unlimited active timers',
      'Premium analytics',
      'Custom branding',
      'SSO integration',
      '100GB storage',
      'Dedicated support',
      'SLA guarantee'
    ]
  }
};

// Feature gate utility
export const canUseFeature = (
  userTier: SubscriptionTier,
  feature: keyof SubscriptionLimits
): boolean => {
  const plan = SUBSCRIPTION_PLANS[userTier];
  const value = plan.limits[feature];
  
  // Boolean features
  if (typeof value === 'boolean') {
    return value;
  }
  
  // Unlimited features (null)
  if (value === null) {
    return true;
  }
  
  return true; // For numeric limits, check separately
};

// Check if user has reached limit
export const hasReachedLimit = (
  userTier: SubscriptionTier,
  limitType: keyof SubscriptionLimits,
  currentUsage: number
): boolean => {
  const plan = SUBSCRIPTION_PLANS[userTier];
  const limit = plan.limits[limitType];
  
  // Unlimited
  if (limit === null) {
    return false;
  }
  
  // Numeric limit
  if (typeof limit === 'number') {
    return currentUsage >= limit;
  }
  
  return false;
};

// Get remaining quota
export const getRemainingQuota = (
  userTier: SubscriptionTier,
  limitType: keyof SubscriptionLimits,
  currentUsage: number
): number | null => {
  const plan = SUBSCRIPTION_PLANS[userTier];
  const limit = plan.limits[limitType];
  
  // Unlimited
  if (limit === null) {
    return null;
  }
  
  // Numeric limit
  if (typeof limit === 'number') {
    return Math.max(0, limit - currentUsage);
  }
  
  return null;
};

// Calculate usage percentage
export const getUsagePercentage = (
  userTier: SubscriptionTier,
  limitType: keyof SubscriptionLimits,
  currentUsage: number
): number => {
  const plan = SUBSCRIPTION_PLANS[userTier];
  const limit = plan.limits[limitType];
  
  // Unlimited
  if (limit === null) {
    return 0;
  }
  
  // Numeric limit
  if (typeof limit === 'number' && limit > 0) {
    return Math.min(100, (currentUsage / limit) * 100);
  }
  
  return 0;
};

// Get upgrade prompt message
export const getUpgradeMessage = (
  feature: string,
  currentTier: SubscriptionTier
): string => {
  const nextTier = currentTier === 'free' ? 'Pro' : 'Enterprise';
  return `Upgrade to ${nextTier} to unlock ${feature}`;
};

// Check if user can perform action
export interface UsageCheck {
  allowed: boolean;
  reason?: string;
  upgradePrompt?: string;
}

export const checkUsage = (
  userTier: SubscriptionTier,
  limitType: keyof SubscriptionLimits,
  currentUsage: number,
  featureName: string
): UsageCheck => {
  const hasReached = hasReachedLimit(userTier, limitType, currentUsage);
  
  if (!hasReached) {
    return { allowed: true };
  }
  
  const plan = SUBSCRIPTION_PLANS[userTier];
  const limit = plan.limits[limitType];
  
  return {
    allowed: false,
    reason: `You've reached your ${featureName} limit (${limit}/${limit})`,
    upgradePrompt: getUpgradeMessage(featureName, userTier)
  };
};

// Format price
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

// Calculate yearly savings
export const calculateYearlySavings = (monthlyPrice: number, yearlyPrice: number): number => {
  return (monthlyPrice * 12) - yearlyPrice;
};

// Get tier badge color
export const getTierBadgeColor = (tier: SubscriptionTier): string => {
  switch (tier) {
    case 'free':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    case 'pro':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
    case 'enterprise':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

// Get tier display name
export const getTierDisplayName = (tier: SubscriptionTier): string => {
  return SUBSCRIPTION_PLANS[tier].name;
};

