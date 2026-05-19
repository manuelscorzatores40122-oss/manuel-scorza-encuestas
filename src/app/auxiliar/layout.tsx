import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AuxiliarLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'AUXILIAR') redirect('/login');

  return <div className="px-4 py-6 max-w-6xl mx-auto">{children}</div>;
}
