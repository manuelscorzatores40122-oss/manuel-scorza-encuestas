import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars-please'
);

const ROLE_ROUTES: Record<string, string[]> = {
  '/estudiante': ['STUDENT'],
  '/psicologo':  ['PSYCHOLOGIST'],
  '/tutor':      ['TUTOR'],
  '/auxiliar':   ['AUXILIAR'],
  '/director':   ['DIRECTOR'],
  '/admin':      ['ADMIN'],
};

const PUBLIC = ['/', '/login', '/api/auth/login', '/privacidad'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('pse_session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  let payload: any;
  try {
    const verified = await jwtVerify(token, SECRET);
    payload = verified.payload;
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  for (const [prefix, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      if (!roles.includes(payload.role)) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      break;
    }
  }

  // Impedir que el navegador cachee páginas protegidas.
  // Así, al presionar "atrás" tras cerrar sesión, el browser
  // hace una nueva petición que el middleware intercepta y
  // redirige a /login en lugar de mostrar la página guardada.
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
