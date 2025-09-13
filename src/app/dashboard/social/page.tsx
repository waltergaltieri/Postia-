import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SocialAccountManager from '@/components/social/SocialAccountManager';

export const metadata: Metadata = {
  title: 'Social Media Management | Postia',
  description: 'Manage social media accounts and connections',
};

export default async function SocialMediaPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Media Management</h1>
          <p className="text-muted-foreground">
            Connect and manage your social media accounts for content publishing
          </p>
        </div>
      </div>

      <SocialAccountManager />
    </div>
  );
}