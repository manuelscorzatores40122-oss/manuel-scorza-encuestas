import './globals.css';
import type { Metadata } from 'next';
import { Outfit, Fraunces } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'PsicoEscolar — I.E. 40122 Manuel Scorza Torres',
  description: 'Sistema de bienestar estudiantil',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${outfit.variable} ${fraunces.variable}`}>{children}</body>
    </html>
  );
}
