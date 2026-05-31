import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Sora, Outfit, Fraunces } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
});

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
  weight: ['400', '600', '700'],
});

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0b2545',
};

export const metadata: Metadata = {
  title: 'PsicoEscolar — I.E. 40122 Manuel Scorza Torres',
  description: 'Sistema de bienestar y acompañamiento psicológico estudiantil',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PsicoEscolar',
  },
  formatDetection: { telephone: false },
  icons: { apple: '/logo.png', icon: '/logo.png' },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#0b2545',
    'msapplication-tap-highlight': 'no',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${plusJakarta.variable} ${sora.variable} ${outfit.variable} ${fraunces.variable} ${plusJakarta.className}`}>
        {children}
      </body>
    </html>
  );
}
