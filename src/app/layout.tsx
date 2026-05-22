import './globals.css';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'PsicoEscolar — I.E. 40122 Manuel Scorza Torres',
  description: 'Sistema de bienestar estudiantil',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
