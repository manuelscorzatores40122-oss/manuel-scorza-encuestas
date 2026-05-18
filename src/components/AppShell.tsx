'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogOut, Menu, X, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/app/login/actions';
import { useRouter } from 'next/navigation';
import { PushSubscriptionButton } from './PushSubscriptionButton';

type NavItem = { href: string; label: string; icon: React.ReactNode };

export function AppShell({
  navItems,
  user,
  roleLabel,
  themeColor = 'brand',
  children,
}: {
  navItems: NavItem[];
  user: { fullName: string };
  roleLabel: string;
  themeColor?: 'brand' | 'warm';
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await logoutAction();
    router.push('/login');
    router.refresh();
  }

  const sidebarBg = themeColor === 'warm' ? 'bg-warm-600' : 'bg-brand-700';
  const accent = themeColor === 'warm' ? 'bg-warm-500' : 'bg-brand-500';

  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className={cn(sidebarBg, 'hidden md:flex flex-col w-64 text-white')}>
        <div className="px-6 py-6 flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', accent)}>
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold leading-tight">PsicoEscolar</p>
            <p className="text-xs opacity-75">{roleLabel}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs opacity-75 mb-2 truncate">{user.fullName}</p>
          <PushSubscriptionButton className="mb-3 w-full justify-center" />
          <button onClick={logout} className="flex items-center gap-2 text-sm text-white/90 hover:text-white">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white', accent)}>
              <Heart className="w-4 h-4" />
            </div>
            <span className="font-semibold">PsicoEscolar</span>
          </div>
          <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-slate-100">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {open && (
          <nav className="px-3 pb-4 space-y-1 bg-white">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
                    active ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
            <PushSubscriptionButton className="w-full justify-center bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 disabled:text-slate-500" />
          </nav>
        )}
      </div>

      <main className="flex-1 md:pt-0 pt-14 px-4 md:px-8 py-6 md:py-10 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
