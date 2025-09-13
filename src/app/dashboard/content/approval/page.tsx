import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import PostApprovalWorkflow from '@/components/content/PostApprovalWorkflow';

export const metadata: Metadata = {
  title: 'Content Approval | Postia',
  description: 'Review and approve content before publication',
};

export default async function ContentApprovalPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-6">
      <PostApprovalWorkflow />
    </div>
  );
}