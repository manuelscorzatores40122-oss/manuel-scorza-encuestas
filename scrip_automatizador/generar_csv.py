"""
Genera numeros.csv consultando la BD de PsicoEscolar.

Columnas del CSV:
  numero     — celular del apoderado (sin prefijo 51)
  nombre     — apellidos y nombres del apoderado
  alumno     — apellidos, nombres del estudiante
  usuario    — DNI del estudiante (= usuario de la app)
  contrasena — últimos 6 dígitos del DNI (= contraseña inicial)

Uso:
  cd scrip_automatizador
  python generar_csv.py
"""

import os
import re
import sys
import csv

# ── Leer DATABASE_URL desde el .env del proyecto ──────────
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
db_url = ""

if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
                break

if not db_url:
    print("[X] No se encontró DATABASE_URL en el .env del proyecto.")
    sys.exit(1)

# Eliminar parámetros exclusivos de Prisma que psycopg2 no entiende
clean_url = re.sub(r'[?&]connection_limit=[^&]*', '', db_url)
clean_url = re.sub(r'[?&]pool_timeout=[^&]*',    '', clean_url)
clean_url = re.sub(r'\?$', '', clean_url)

# ── Conectar a PostgreSQL ──────────────────────────────────
try:
    import psycopg2
except ImportError:
    print("[X] Falta psycopg2. Instálalo con:  pip install psycopg2-binary")
    sys.exit(1)

print("[*] Conectando a la base de datos...", flush=True)
try:
    conn = psycopg2.connect(clean_url)
except Exception as e:
    print(f"[X] No se pudo conectar: {e}")
    sys.exit(1)

# ── Consulta ───────────────────────────────────────────────
SQL = """
SELECT
    a.celular                                                           AS numero,
    a."apellidosNombres"                                               AS nombre,
    s."apellidoPaterno" || ' ' || s."apellidoMaterno" || ', ' || s.nombres  AS alumno,
    s.dni                                                              AS usuario,
    RIGHT(s.dni, 6)                                                    AS contrasena
FROM "Student" s
JOIN "Apoderado" a ON a."studentId" = s.id
WHERE
    a.celular IS NOT NULL
    AND a.celular <> ''
    AND s."estadoMatricula" = 'DEFINITIVA'
ORDER BY s."apellidoPaterno", s."apellidoMaterno", s.nombres;
"""

cur = conn.cursor()
cur.execute(SQL)
rows = cur.fetchall()
cur.close()
conn.close()

if not rows:
    print("[!] No se encontraron estudiantes con celular de apoderado registrado.")
    print("    Registra estudiantes desde /psicologo/estudiantes/nuevo (requiere celular).")
    sys.exit(0)

# ── Escribir CSV ───────────────────────────────────────────
out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "numeros.csv")
with open(out_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["numero", "nombre", "alumno", "usuario", "contrasena"])
    writer.writerows(rows)

print(f"[OK] {len(rows)} registros exportados → {out_path}", flush=True)
print("[*] Ahora ejecuta:  python archivo.py", flush=True)
