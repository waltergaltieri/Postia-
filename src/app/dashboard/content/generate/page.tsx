import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import AIContentGenerationInterface from '@/components/content/AIContentGenerationInterface';

export const metadata: Metadata = {
  title: 'Generate Content | Postia',
  description: 'AI-powered content generation',
};

export default async function ContentGenerationPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-6">
      <AIContentGenerationInterface />
    </div>
  );
}