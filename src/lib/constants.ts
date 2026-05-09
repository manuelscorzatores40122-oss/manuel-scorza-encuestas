export const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Estudiante',
  TUTOR: 'Tutor',
  AUXILIAR: 'Auxiliar',
  PSYCHOLOGIST: 'Psicólogo',
  DIRECTOR: 'Director',
  ADMIN: 'Administrador',
};

export function dashboardPathFor(role: string): string {
  switch (role) {
    case 'STUDENT':      return '/estudiante';
    case 'PSYCHOLOGIST': return '/psicologo';
    case 'TUTOR':        return '/tutor';
    case 'AUXILIAR':     return '/auxiliar';
    case 'DIRECTOR':     return '/director';
    case 'ADMIN':        return '/admin';
    default:             return '/login';
  }
}
