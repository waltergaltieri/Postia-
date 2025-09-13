import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ContentVersionHistory from '@/components/content/ContentVersionHistory';

export const metadata: Metadata = {
  title: 'Content Versions | Postia',
  description: 'View and manage content version history',
};

export default async function ContentVersionsPage({
  params,
}: {
  params: { postId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-6">
      <ContentVersionHistory postId={params.postId} />
    </div>
  );
}