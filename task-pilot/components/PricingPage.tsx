import React, { useState } from 'react';
import { Button, Card } from './ui';
import { Icon } from './icons';
import { 
  SUBSCRIPTION_PLANS, 
  formatPrice, 
  calculateYearlySavings,
  SubscriptionTier 
} from '../lib/subscription';
import { User } from '../types';

interface PricingPageProps {
  currentUser: User;
  onUpgrade: (tier: SubscriptionTier, billingCycle: 'monthly' | 'yearly') => void;
  onClose?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ currentUser, onUpgrade, onClose }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const currentTier = currentUser.subscription?.tier || 'free';

  const PlanCard: React.FC<{ tier: SubscriptionTier }> = ({ tier }) => {
    const plan = SUBSCRIPTION_PLANS[tier];
    const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
    const isCurrentPlan = currentTier === tier;
    const isUpgrade = 
      (currentTier === 'free' && tier !== 'free') ||
      (currentTier === 'pro' && tier === 'enterprise');

    const savings = calculateYearlySavings(plan.priceMonthly, plan.priceYearly);

    return (
      <Card className={`relative p-6 flex flex-col h-full ${
        plan.popular ? 'ring-2 ring-indigo-500 shadow-2xl scale-105' : ''
      } ${isCurrentPlan ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
        {plan.popular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
              MOST POPULAR
            </span>
          </div>
        )}

        {isCurrentPlan && (
          <div className="absolute top-4 right-4">
            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              CURRENT PLAN
            </span>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {plan.name}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {plan.description}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              {formatPrice(price)}
            </span>
            {price > 0 && (
              <span className="text-slate-500 dark:text-slate-400">
                /{billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            )}
          </div>
          {billingCycle === 'yearly' && price > 0 && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              Save {formatPrice(savings)} per year!
            </p>
          )}
        </div>

        <div className="mb-6 flex-grow">
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Icon name="CheckCircle" className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={() => onUpgrade(tier, billingCycle)}
          disabled={isCurrentPlan}
          variant={plan.popular ? 'primary' : isCurrentPlan ? 'outline' : 'secondary'}
          className="w-full mt-auto"
        >
          {isCurrentPlan ? 'Current Plan' : isUpgrade ? 'Upgrade Now' : 'Get Started'}
        </Button>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {onClose && (
          <button
            onClick={onClose}
            className="mb-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2"
          >
            <Icon name="ArrowLeft" className="w-5 h-5" />
            Back to Dashboard
          </button>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Select the perfect plan for your productivity needs
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Yearly
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <PlanCard tier="free" />
          <PlanCard tier="pro" />
          <PlanCard tier="enterprise" />
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100 mb-8">
            Feature Comparison
          </h2>
          <Card className="p-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-4 px-4 text-slate-900 dark:text-slate-100 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 text-slate-900 dark:text-slate-100 font-semibold">Free</th>
                  <th className="text-center py-4 px-4 text-slate-900 dark:text-slate-100 font-semibold">Pro</th>
                  <th className="text-center py-4 px-4 text-slate-900 dark:text-slate-100 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">Projects</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">3</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Unlimited</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">Tasks per month</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">50</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Unlimited</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">Active timers</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">1</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">5</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">AI Insights</td>
                  <td className="py-4 px-4 text-center"><Icon name="Close" className="w-5 h-5 text-red-500 mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><Icon name="CheckCircle" className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><Icon name="CheckCircle" className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">Export formats</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">CSV</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">All formats</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">All + XML</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">API Access</td>
                  <td className="py-4 px-4 text-center"><Icon name="Close" className="w-5 h-5 text-red-500 mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><Icon name="CheckCircle" className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><Icon name="CheckCircle" className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">Team Members</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">1</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">5</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">Storage</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">500MB</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">10GB</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">100GB</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">Support</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Email</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Priority</td>
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">Dedicated</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Yes! Upgrade or downgrade anytime. Upgrades are instant, downgrades take effect at the end of your billing period.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
                Is there a free trial for Pro?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Yes! All new Pro subscriptions include a 14-day free trial. No credit card required to start.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your data is always safe. If you exceed limits after downgrading, you'll have read-only access until you're within limits.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="p-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none">
            <h2 className="text-3xl font-bold mb-4">
              Ready to boost your productivity?
            </h2>
            <p className="text-lg mb-6 text-white/90">
              Join thousands of professionals tracking their time with Task Pilot
            </p>
            <Button
              onClick={() => onUpgrade('pro', billingCycle)}
              className="bg-white text-indigo-600 hover:bg-white/90 font-bold text-lg px-8 py-3"
            >
              Start Free Trial
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

