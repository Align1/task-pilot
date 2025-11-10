import React from 'react';
import { Button, Card } from './ui';
import { Icon } from './icons';
import { SubscriptionTier, SUBSCRIPTION_PLANS, formatPrice } from '../lib/subscription';

interface UpgradePromptProps {
  title: string;
  message: string;
  featureList?: string[];
  currentTier: SubscriptionTier;
  suggestedTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier) => void;
  onDismiss: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title,
  message,
  featureList,
  currentTier,
  suggestedTier,
  onUpgrade,
  onDismiss
}) => {
  const plan = SUBSCRIPTION_PLANS[suggestedTier];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Icon name="Zap" className="w-7 h-7 text-white" />
          </div>
          <div className="flex-grow">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {title}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {message}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <Icon name="Close" className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {plan.name} Plan
            </span>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatPrice(plan.priceMonthly)}
              <span className="text-sm font-normal text-slate-500">/month</span>
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {plan.description}
          </p>
        </div>

        {featureList && featureList.length > 0 && (
          <div className="mb-6">
            <p className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Unlock these features:
            </p>
            <ul className="space-y-2">
              {featureList.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Icon name="CheckCircle" className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={onDismiss}
            variant="outline"
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={() => onUpgrade(suggestedTier)}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            Upgrade Now
          </Button>
        </div>

        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
          14-day free trial • Cancel anytime • No credit card required
        </p>
      </Card>
    </div>
  );
};

// Inline upgrade banner (less intrusive)
interface UpgradeBannerProps {
  message: string;
  ctaText?: string;
  onUpgrade: () => void;
  onDismiss?: () => void;
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({
  message,
  ctaText = 'Upgrade',
  onUpgrade,
  onDismiss
}) => {
  return (
    <Card className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border-indigo-200 dark:border-indigo-800">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <Icon name="Zap" className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-grow">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {message}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={onUpgrade}
            size="sm"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            {ctaText}
          </Button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <Icon name="Close" className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

// Usage indicator with upgrade prompt
interface UsageIndicatorProps {
  label: string;
  current: number;
  limit: number | null;
  unit?: string;
  onUpgrade?: () => void;
}

export const UsageIndicator: React.FC<UsageIndicatorProps> = ({
  label,
  current,
  limit,
  unit = '',
  onUpgrade
}) => {
  if (limit === null) {
    // Unlimited
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">Unlimited</span>
      </div>
    );
  }

  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;

  return (
    <div className={`p-3 rounded-lg ${
      isAtLimit ? 'bg-red-50 dark:bg-red-900/20' :
      isNearLimit ? 'bg-yellow-50 dark:bg-yellow-900/20' :
      'bg-slate-50 dark:bg-slate-800/50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className={`text-sm font-semibold ${
          isAtLimit ? 'text-red-600 dark:text-red-400' :
          isNearLimit ? 'text-yellow-600 dark:text-yellow-400' :
          'text-slate-600 dark:text-slate-400'
        }`}>
          {current} / {limit} {unit}
        </span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isAtLimit ? 'bg-red-500' :
            isNearLimit ? 'bg-yellow-500' :
            'bg-indigo-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isAtLimit && onUpgrade && (
        <Button
          onClick={onUpgrade}
          size="sm"
          className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-purple-600"
        >
          <Icon name="Zap" className="w-4 h-4 mr-2" />
          Upgrade for More
        </Button>
      )}
    </div>
  );
};

