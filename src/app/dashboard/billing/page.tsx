import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import BillingDashboard from '@/components/billing/BillingDashboard';

export const metadata: Metadata = {
  title: 'Billing & Subscription | Postia',
  description: 'Manage your subscription and token usage',
};

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription plan and purchase additional tokens
          </p>
        </div>
      </div>

      <BillingDashboard />
    </div>
  );
}