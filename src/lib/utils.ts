import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function formatDateTime(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function calcEdad(fechaNac: Date | string): number {
  const nac = typeof fechaNac === 'string' ? new Date(fechaNac) : fechaNac;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export function riskColor(level: string): string {
  switch (level) {
    case 'HIGH': return 'bg-risk-high text-white';
    case 'MID':  return 'bg-risk-mid text-white';
    default:     return 'bg-risk-low text-white';
  }
}

export function riskLabel(level: string): string {
  switch (level) {
    case 'HIGH': return 'Riesgo alto';
    case 'MID':  return 'Riesgo medio';
    default:     return 'Sin riesgo';
  }
}
