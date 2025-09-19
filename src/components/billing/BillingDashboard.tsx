'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Package, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionData {
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    plan: string;
    planConfig: {
      name: string;
      monthlyTokens: number;
      price: number;
      features: string[];
    };
  } | null;
  usage: {
    period: {
      start: string;
      end: string;
    };
    tokens: {
      allocated: number;
      consumed: number;
      remaining: number;
      usagePercentage: number;
    };
  } | null;
  availablePlans: Record<string, any>;
}

interface TokenPackage {
  name: string;
  tokens: number;
  price: number;
}

export default function BillingDashboard() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [tokenPackages, setTokenPackages] = useState<Record<string, TokenPackage>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const [subscriptionRes, packagesRes] = await Promise.all([
        fetch('/api/subscriptions'),
        fetch('/api/tokens/purchase')
      ]);

      if (subscriptionRes.ok) {
        const subscriptionResult = await subscriptionRes.json();
        setSubscriptionData(subscriptionResult.data);
      }

      if (packagesRes.ok) {
        const packagesResult = await packagesRes.json();
        setTokenPackages(packagesResult.data.packages);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionChange = async (plan: string) => {
    setActionLoading(`subscription-${plan}`);
    
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const result = await response.json();

      if (result.success && result.data.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        toast.error(result.error?.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error changing subscription:', error);
      toast.error('Failed to change subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTokenPurchase = async (packageKey: string) => {
    setActionLoading(`tokens-${packageKey}`);
    
    try {
      const response = await fetch('/api/tokens/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageKey }),
      });

      const result = await response.json();

      if (result.success && result.data.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        toast.error(result.error?.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      toast.error('Failed to purchase tokens');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.')) {
      return;
    }

    setActionLoading('cancel');
    
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Subscription cancelled successfully');
        fetchBillingData();
      } else {
        toast.error(result.error?.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const currentSubscription = subscriptionData?.subscription;
  const usage = subscriptionData?.usage;
  const availablePlans = subscriptionData?.availablePlans || {};

  return (
    <div className="space-y-6">
      {/* Current Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentSubscription?.planConfig.name || 'Basic'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentSubscription ? 
                `$${currentSubscription.planConfig.price}/month` : 
                'Free plan'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage ? `${usage.tokens.consumed}/${usage.tokens.allocated}` : '0/0'}
            </div>
            <Progress 
              value={usage?.tokens.usagePercentage || 0} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {usage?.tokens.remaining || 0} tokens remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing Period</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentSubscription ? 
                new Date(currentSubscription.currentPeriodEnd).toLocaleDateString() :
                'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Next renewal date
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscription">Subscription Plans</TabsTrigger>
          <TabsTrigger value="tokens">Buy Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(availablePlans).map(([planKey, plan]: [string, any]) => {
              const isCurrentPlan = currentSubscription?.plan === planKey;
              const isCustom = planKey === 'CUSTOM';
              
              return (
                <Card key={planKey} className={isCurrentPlan ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {isCurrentPlan && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {isCustom ? 'Contact us' : `$${plan.price}/month`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {plan.monthlyTokens > 0 ? 
                          `${plan.monthlyTokens.toLocaleString()}` : 
                          'Custom'
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.monthlyTokens > 0 ? 'tokens/month' : 'tokens'}
                      </div>
                    </div>
                    
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {!isCustom && (
                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? "outline" : "default"}
                        onClick={() => <span>handleSubscriptionChange(planKey)}
                        disabled={isCurrentPlan || actionLoading === `subscription-${planKey}`}
                      >
                        {actionLoading === `subscription-${planKey}` ? 
                          'Processing...' : 
                          isCurrentPlan ? 'Current Plan' : 'Upgrade'
                        }</span></Button>
                    )}

                    {isCustom && (
                      <Button className="w-full" variant="outline"> <span>Contact Sales</span></Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {currentSubscription && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subscription Management</CardTitle>
                <CardDescription>
                  Manage your current subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Plan: {currentSubscription.planConfig.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Renews on {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={actionLoading === 'cancel'}
                  > <span>{actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Subscription'}</span></Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tokens" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(tokenPackages).map(([packageKey, pkg]: [string, TokenPackage]) => (
              <Card key={packageKey}>
                <CardHeader>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription>${pkg.price}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {pkg.tokens.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">tokens</div>
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    ${(pkg.price / pkg.tokens * 1000).toFixed(2)} per 1,000 tokens
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => <span>handleTokenPurchase(packageKey)}
                    disabled={actionLoading === `tokens-${packageKey}`}
                  >
                    {actionLoading === `tokens-${packageKey}` ? 
                      'Processing...' : 
                      'Purchase'
                    }</span></Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Token Usage Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning-600" />
                  <span>Idea Generation: ~50 tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-info-600" />
                  <span>Copy Creation: ~100 tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-purple-500" />
                  <span>Image Generation: ~200 tokens</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Token consumption varies based on content complexity and generation steps. 
                Unused tokens from your subscription roll over for up to 3 months.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}