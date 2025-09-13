import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ClientManagementInterface from '@/components/clients/ClientManagementInterface';

export const metadata: Metadata = {
  title: 'Client Management | Postia',
  description: 'Manage your clients and their brand assets',
};

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-6">
      <ClientManagementInterface />
    </div>
  );
}