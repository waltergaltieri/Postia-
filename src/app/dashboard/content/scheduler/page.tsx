import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import PublicationScheduler from '@/components/content/PublicationScheduler';

export const metadata: Metadata = {
  title: 'Publication Scheduler | Postia',
  description: 'Monitor and manage scheduled content publications',
};

export default async function PublicationSchedulerPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-6">
      <PublicationScheduler />
    </div>
  );
}