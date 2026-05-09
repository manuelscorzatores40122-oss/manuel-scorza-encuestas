import { redirect } from 'next/navigation';
import { getSession, dashboardPathFor } from '@/lib/auth';

export default async function Home() {
  const session = await getSession();
  if (session) redirect(dashboardPathFor(session.role));
  redirect('/login');
}
