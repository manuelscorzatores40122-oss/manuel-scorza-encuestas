import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PsicoEscolar — I.E. 40122 Manuel Scorza Torres',
  description: 'Sistema de bienestar estudiantil',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
