#!/usr/bin/env python3
"""
PsicoEscolar — Interfaz de notificaciones por terminal
Uso: python interfaz.py
"""

import csv
import json
import os
import random
import re
import sys
import tempfile
import time
import urllib.parse
from pathlib import Path

try:
    from rich.console import Console
    from rich.panel   import Panel
    from rich.prompt  import Confirm, Prompt
    from rich.table   import Table
    from rich         import box as rbox
except ImportError:
    print("Instala dependencias:  pip install rich")
    sys.exit(1)

console = Console()
BASE    = Path(__file__).parent
ROOT    = BASE.parent
APP_URL = os.environ.get("APP_URL", "https://tu-app.vercel.app")

# ── Plantillas de mensaje ──────────────────────────────────

PLANTILLAS: dict[str, str] = {
    "credenciales": (
        "Hola {nombre}, le comunicamos que *{alumno}* ya tiene acceso "
        "habilitado en *PsicoEscolar* — I.E. 40122 Manuel Scorza Torres.\n\n"
        "🔑 *Credenciales de acceso:*\n"
        "• Usuario: *{usuario}*\n"
        "• Contraseña: *{contrasena}*\n\n"
        "🌐 Ingrese aquí:\n"
        "{app_url}/login\n\n"
        "_Al ingresar puede cambiar su contraseña desde el perfil._"
    ),
    "anuncio": (
        "Hola {nombre}, la I.E. 40122 Manuel Scorza Torres "
        "tiene un nuevo comunicado.\n\n"
        "📢 *{titulo}*\n\n"
        "{contenido}\n\n"
        "🌐 Ver en PsicoEscolar: {app_url}/login"
    ),
    "encuesta": (
        "Hola {nombre}, se ha habilitado una nueva encuesta "
        "para *{alumno}* en PsicoEscolar.\n\n"
        "📋 *{titulo}*\n"
        "{descripcion}\n\n"
        "Por favor indíquele que ingrese y la complete.\n\n"
        "🌐 Ingresar: {app_url}/login"
    ),
}

# ── Utilidades ─────────────────────────────────────────────

def leer_env(clave: str) -> str:
    env = ROOT / ".env"
    if env.exists():
        for linea in env.read_text().splitlines():
            linea = linea.strip()
            if linea.startswith(f"{clave}="):
                return linea.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def conectar_db():
    try:
        import psycopg2
    except ImportError:
        console.print("[red]Falta psycopg2.[/]  Instala con: pip install psycopg2-binary")
        return None

    url = leer_env("DATABASE_URL")
    if not url:
        console.print("[red]No se encontró DATABASE_URL en el .env del proyecto.[/]")
        return None

    url = re.sub(r'[?&]connection_limit=[^&]*', '', url)
    url = re.sub(r'[?&]pool_timeout=[^&]*',    '', url)
    url = re.sub(r'\?$', '', url)

    try:
        import psycopg2
        return psycopg2.connect(url)
    except Exception as e:
        console.print(f"[red]Error de conexión:[/] {e}")
        return None


def editar_en_editor(texto: str) -> str:
    editor = os.environ.get("EDITOR", os.environ.get("VISUAL", "nano"))
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write(texto)
        tmp = f.name
    os.system(f'{editor} "{tmp}"')
    resultado = Path(tmp).read_text(encoding="utf-8").strip()
    os.unlink(tmp)
    return resultado


def preview(template: str, datos: dict):
    try:
        texto = template.format(**{**datos, "app_url": APP_URL})
    except KeyError:
        texto = template
    console.print(Panel(texto, title="[bold]Vista previa[/]", border_style="green", padding=(1, 2)))


def preguntar_editar(template: str, ejemplo: dict) -> str:
    preview(template, ejemplo)
    if Confirm.ask("¿Editar mensaje?", default=False):
        template = editar_en_editor(template)
        preview(template, ejemplo)
    return template


# ── Envío por WhatsApp Web ─────────────────────────────────

def enviar(destinatarios: list[dict], template: str):
    if not destinatarios:
        console.print("[yellow]Sin destinatarios.[/]")
        return

    try:
        from selenium                          import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.common.by      import By
        from selenium.webdriver.common.keys    import Keys
        from selenium.webdriver.support        import expected_conditions as EC
        from selenium.webdriver.support.ui     import WebDriverWait
    except ImportError:
        console.print("[red]Falta selenium.[/]  Instala con: pip install selenium")
        return

    options = Options()
    options.binary_location = "/usr/bin/brave"
    options.add_argument("--user-data-dir=/home/hugo/selenium-brave")
    options.add_argument("--start-maximized")
    svc    = Service(executable_path="/usr/bin/chromedriver")
    driver = webdriver.Chrome(service=svc, options=options)
    wait   = WebDriverWait(driver, 40)

    driver.get("https://web.whatsapp.com")
    console.print("\n[yellow]Escanea el QR y presiona ENTER para iniciar...[/]")
    input()

    enviados = errores = 0

    for row in destinatarios:
        numero = str(row.get("numero", "")).strip()
        if not numero.startswith("51"):
            numero = "51" + numero

        try:
            mensaje = template.format(**{**row, "app_url": APP_URL})
        except KeyError:
            mensaje = template

        url = f"https://web.whatsapp.com/send?phone={numero}&text={urllib.parse.quote(mensaje)}"
        console.print(f"  → {numero}  {row.get('nombre', '')}", end="", highlight=False)

        try:
            driver.get(url)
            time.sleep(random.uniform(5, 8))

            # número inválido
            try:
                WebDriverWait(driver, 5).until(EC.presence_of_element_located((
                    By.XPATH, '//*[contains(text(),"Phone number shared via url is invalid")]'
                )))
                console.print(" [red]número inválido[/]")
                errores += 1
                continue
            except Exception:
                pass

            # modal "continuar"
            try:
                btn = WebDriverWait(driver, 5).until(EC.element_to_be_clickable((
                    By.XPATH, '//div[@data-animate-modal-popup="true"]//a | //a[@title="Continue to Chat"]'
                )))
                btn.click()
                time.sleep(random.uniform(3, 5))
            except Exception:
                pass

            caja = wait.until(EC.element_to_be_clickable((
                By.XPATH, '//div[@data-tab="10"][@contenteditable="true"]'
            )))
            caja.click()
            time.sleep(random.uniform(1, 2))
            caja.send_keys(Keys.ENTER)

            console.print(" [green]✓[/]")
            enviados += 1
            time.sleep(random.uniform(6, 12))

        except Exception as e:
            console.print(f" [red]error: {e}[/]")
            errores += 1
            time.sleep(3)

    driver.quit()
    console.print(f"\n[bold green]Enviados: {enviados}[/]  [red]Errores: {errores}[/]")


# ── Flujo: Credenciales ────────────────────────────────────

def flujo_credenciales():
    console.rule("[bold]Credenciales de acceso[/]")
    csv_path = BASE / "numeros.csv"

    if not csv_path.exists() or csv_path.stat().st_size < 20:
        console.print("[yellow]Generando lista desde la base de datos...[/]")
        conn = conectar_db()
        if not conn:
            return
        cur = conn.cursor()
        cur.execute("""
            SELECT a.celular,
                   a."apellidosNombres",
                   s."apellidoPaterno" || ' ' || s."apellidoMaterno" || ', ' || s.nombres,
                   s.dni,
                   RIGHT(s.dni, 6)
            FROM "Student" s
            JOIN "Apoderado" a ON a."studentId" = s.id
            WHERE a.celular IS NOT NULL AND a.celular <> ''
              AND s."estadoMatricula" = 'DEFINITIVA'
            ORDER BY s."apellidoPaterno", s.nombres
        """)
        filas = cur.fetchall()
        cur.close()
        conn.close()

        if not filas:
            console.print("[yellow]No hay estudiantes con celular de apoderado registrado.[/]")
            console.print("[dim]Registra estudiantes desde /psicologo/estudiantes/nuevo[/]")
            return

        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["numero", "nombre", "alumno", "usuario", "contrasena"])
            w.writerows(filas)
        console.print(f"[green]{len(filas)} destinatarios encontrados.[/]")

    with open(csv_path, encoding="utf-8") as f:
        destinatarios = list(csv.DictReader(f))

    console.print(f"[cyan]Destinatarios:[/] {len(destinatarios)}")

    ejemplo = destinatarios[0] if destinatarios else {
        "nombre": "García López, María", "alumno": "Mamani Quispe, Juan",
        "usuario": "12345678", "contrasena": "345678",
    }
    template = preguntar_editar(PLANTILLAS["credenciales"], ejemplo)

    if Confirm.ask(f"\n¿Enviar a [bold]{len(destinatarios)}[/] apoderados?", default=False):
        enviar(destinatarios, template)


# ── Flujo: Anuncio libre ───────────────────────────────────

def flujo_anuncio():
    console.rule("[bold]Anuncio libre[/]")

    titulo = Prompt.ask("Título del anuncio")
    console.print("[dim]Contenido del anuncio (línea vacía para terminar):[/]")
    lineas: list[str] = []
    while True:
        linea = input()
        if linea == "" and lineas:
            break
        lineas.append(linea)
    contenido = "\n".join(lineas)

    ejemplo  = {"nombre": "García López, María", "titulo": titulo, "contenido": contenido}
    template = preguntar_editar(PLANTILLAS["anuncio"], ejemplo)

    conn = conectar_db()
    if not conn:
        return
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT ON (a.celular) a.celular, a."apellidosNombres"
        FROM "Apoderado" a
        WHERE a.celular IS NOT NULL AND a.celular <> ''
        ORDER BY a.celular, a."esContactoPrincipal" DESC
    """)
    destinatarios = [
        {"numero": r[0], "nombre": r[1], "titulo": titulo, "contenido": contenido}
        for r in cur.fetchall()
    ]
    cur.close()
    conn.close()

    console.print(f"[cyan]Destinatarios:[/] {len(destinatarios)}")

    if Confirm.ask(f"¿Enviar a [bold]{len(destinatarios)}[/] apoderados?", default=False):
        enviar(destinatarios, template)


# ── Flujo: Encuesta ────────────────────────────────────────

def flujo_encuesta():
    console.rule("[bold]Notificación de encuesta[/]")

    conn = conectar_db()
    if not conn:
        return
    cur = conn.cursor()

    cur.execute("""
        SELECT id, title, description, "targetGrades", "targetSections"
        FROM "Survey"
        WHERE "isActive" = true
        ORDER BY "createdAt" DESC
        LIMIT 15
    """)
    encuestas = cur.fetchall()

    if not encuestas:
        console.print("[yellow]No hay encuestas activas en este momento.[/]")
        cur.close()
        conn.close()
        return

    tabla = Table(show_header=True, box=rbox.SIMPLE, padding=(0, 1))
    tabla.add_column("#",      style="dim",    width=3)
    tabla.add_column("Título", style="bold",   min_width=30)
    tabla.add_column("Grados objetivo", style="dim")
    for i, enc in enumerate(encuestas, 1):
        grados = enc[3] or []
        tabla.add_row(str(i), enc[1], ", ".join(grados) if grados else "Todos")
    console.print(tabla)

    idx      = int(Prompt.ask("Selecciona encuesta", choices=[str(i) for i in range(1, len(encuestas)+1)])) - 1
    enc      = encuestas[idx]
    titulo      = enc[1]
    descripcion = enc[2] or ""
    grados      = enc[3] or []   # text[]
    secciones   = enc[4] or []   # text[]

    # Destinatarios filtrados
    if secciones:
        cur.execute("""
            SELECT a.celular, a."apellidosNombres",
                   s."apellidoPaterno" || ' ' || s."apellidoMaterno" || ', ' || s.nombres
            FROM "Student" s
            JOIN "Apoderado" a ON a."studentId" = s.id
            WHERE s."sectionId" = ANY(%s)
              AND a.celular IS NOT NULL
              AND a."esContactoPrincipal" = true
        """, (secciones,))
    elif grados:
        cur.execute("""
            SELECT a.celular, a."apellidosNombres",
                   s."apellidoPaterno" || ' ' || s."apellidoMaterno" || ', ' || s.nombres
            FROM "Student" s
            JOIN "Apoderado" a ON a."studentId" = s.id
            JOIN "Section"  sec ON sec.id = s."sectionId"
            WHERE sec."gradeId" = ANY(%s)
              AND a.celular IS NOT NULL
              AND a."esContactoPrincipal" = true
        """, (grados,))
    else:
        cur.execute("""
            SELECT a.celular, a."apellidosNombres",
                   s."apellidoPaterno" || ' ' || s."apellidoMaterno" || ', ' || s.nombres
            FROM "Student" s
            JOIN "Apoderado" a ON a."studentId" = s.id
            WHERE a.celular IS NOT NULL
              AND a."esContactoPrincipal" = true
        """)

    destinatarios = [
        {"numero": r[0], "nombre": r[1], "alumno": r[2], "titulo": titulo, "descripcion": descripcion}
        for r in cur.fetchall()
    ]
    cur.close()
    conn.close()

    ejemplo  = {"nombre": "García López, María", "alumno": "Mamani Quispe, Juan",
                "titulo": titulo, "descripcion": descripcion}
    template = preguntar_editar(PLANTILLAS["encuesta"], ejemplo)

    console.print(f"[cyan]Destinatarios:[/] {len(destinatarios)}")

    if Confirm.ask(f"¿Enviar a [bold]{len(destinatarios)}[/] apoderados?", default=False):
        enviar(destinatarios, template)


# ── Menú principal ─────────────────────────────────────────

OPCIONES = {
    "1": ("Credenciales",  "Enviar accesos a apoderados nuevos",   flujo_credenciales),
    "2": ("Anuncio libre", "Redactar y enviar un comunicado",       flujo_anuncio),
    "3": ("Encuesta",      "Notificar sobre una encuesta activa",   flujo_encuesta),
    "4": ("Salir",         "",                                      None),
}


def main():
    while True:
        console.clear()
        console.print(Panel.fit(
            "[bold white]PsicoEscolar[/]  ·  Notificaciones WhatsApp\n"
            "[dim]I.E. 40122 Manuel Scorza Torres[/]",
            border_style="bright_black",
            padding=(1, 4),
        ))
        console.print()

        for key, (label, desc, _) in OPCIONES.items():
            if desc:
                console.print(f"  [bold cyan]\\[{key}][/]  {label:<16}  [dim]{desc}[/]")
            else:
                console.print(f"  [bold cyan]\\[{key}][/]  {label}")
        console.print()

        opcion = Prompt.ask("Opción", choices=list(OPCIONES.keys()), default="4")
        _, _, fn = OPCIONES[opcion]

        if fn is None:
            console.print("[dim]Hasta luego.[/]")
            break

        console.print()
        fn()
        console.print()
        input("Presiona ENTER para volver al menú...")


if __name__ == "__main__":
    main()
