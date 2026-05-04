export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface PlanDetails {
  name: string;
  price: number;
  limit: number;
  features: string[];
  hasWatermark: boolean;
  hasAICitation: boolean;
  hasPrioritySupport: boolean;
  hasAnalytics: boolean;
  hasWhiteLabel: boolean;
  hasAPI: boolean;
  hasVerificationPortal: boolean;
  hasTeamSupport: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, PlanDetails> = {
  free: {
    name: 'Free',
    price: 0,
    limit: 5,
    features: [
      '5 certificates per month',
      'Standard templates only',
      'System watermark',
    ],
    hasWatermark: true,
    hasAICitation: false,
    hasPrioritySupport: false,
    hasAnalytics: false,
    hasWhiteLabel: false,
    hasAPI: false,
    hasVerificationPortal: false,
    hasTeamSupport: false,
  },
  starter: {
    name: 'Starter',
    price: 199,
    limit: 50,
    features: [
      '50 certificates per month',
      'Standard templates',
      'No watermark',
    ],
    hasWatermark: false,
    hasAICitation: false,
    hasPrioritySupport: false,
    hasAnalytics: false,
    hasWhiteLabel: false,
    hasAPI: false,
    hasVerificationPortal: false,
    hasTeamSupport: false,
  },
  pro: {
    name: 'Pro',
    price: 599,
    limit: 300,
    features: [
      '300 certificates per month',
      'All Starter features',
      'Email automation',
      'Priority email delivery',
      'Analytics dashboard',
      'Priority customer support',
      'AI-powered citations',
      'Team collaboration (up to 5 members)',
    ],
    hasWatermark: false,
    hasAICitation: true,
    hasPrioritySupport: true,
    hasAnalytics: true,
    hasWhiteLabel: false,
    hasAPI: false,
    hasVerificationPortal: false,
    hasTeamSupport: true,
  },
  enterprise: {
    name: 'Enterprise',
    price: 1499,
    limit: 1000,
    features: [
      '1,000 certificates per month',
      'All Pro features',
      'White-label branding',
      'API access',
      'Verification portal',
      'Dedicated account management',
      'Unlimited team members',
    ],
    hasWatermark: false,
    hasAICitation: true,
    hasPrioritySupport: true,
    hasAnalytics: true,
    hasWhiteLabel: true,
    hasAPI: true,
    hasVerificationPortal: true,
    hasTeamSupport: true,
  },
};

export function getPlanDetails(tier: string | undefined): PlanDetails {
  const normalizedTier = (tier?.toLowerCase() as SubscriptionTier) || 'free';
  return SUBSCRIPTION_PLANS[normalizedTier] || SUBSCRIPTION_PLANS.free;
}

export function canGenerateCertificate(user: { plan?: string; certificates_this_month?: number }): boolean {
  const plan = getPlanDetails(user.plan);
  return (user.certificates_this_month || 0) < plan.limit;
}

export function hasFeature(user: { plan?: string }, feature: keyof PlanDetails): boolean {
  const plan = getPlanDetails(user.plan);
  const value = plan[feature];
  return typeof value === 'boolean' ? value : false;
}
