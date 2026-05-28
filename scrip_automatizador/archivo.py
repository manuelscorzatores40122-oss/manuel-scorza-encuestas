from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import time
import random
import urllib.parse
import polars as pl
import os

# ── Configuración ─────────────────────────────────────────
APP_URL = os.environ.get("APP_URL", "https://tu-app.vercel.app")

ruta_csv = os.path.join(os.path.dirname(os.path.abspath(__file__)), "numeros.csv")
df = pl.read_csv(ruta_csv, infer_schema_length=0)  # todo como string

options = Options()
options.binary_location = "/usr/bin/brave"
options.add_argument("--user-data-dir=/home/hugo/selenium-brave")
options.add_argument("--start-maximized")

chromedriver_path = "/usr/bin/chromedriver"
service = Service(executable_path=chromedriver_path)
driver = webdriver.Chrome(service=service, options=options)
wait = WebDriverWait(driver, 40)

driver.get("https://web.whatsapp.com")
print("[+] Escanea QR y presiona ENTER PARA INICIAR", flush=True)
input()

enviados = 0
errores  = 0

for row in df.iter_rows(named=True):
    numero    = str(row["numero"]).strip()
    nombre    = str(row["nombre"]).strip()
    alumno    = str(row.get("alumno") or "su hijo(a)").strip()
    usuario   = str(row["usuario"]).strip()
    contrasena = str(row["contrasena"]).strip()

    if not numero.startswith("51"):
        numero = "51" + numero

    mensaje = (
        f"Hola {nombre}, le comunicamos que *{alumno}* "
        f"ya tiene acceso habilitado en *PsicoEscolar* — "
        f"I.E. 40122 Manuel Scorza Torres.\n\n"
        f" *Credenciales de acceso:*\n"
        f"• Usuario: *{usuario}*\n"
        f"• Contraseña: *{contrasena}*\n\n"
        f"* Ingrese aquí:\n"
        f"{APP_URL}/login\n\n"
        f"_Al ingresar puede cambiar la contraseña desde su perfil._"
    )
    mensaje_encoded = urllib.parse.quote(mensaje)
    url = f"https://web.whatsapp.com/send?phone={numero}&text={mensaje_encoded}"

    print(f"[***] Enviando a {numero} ({nombre} / {alumno})...", flush=True)

    try:
        driver.get(url)
        time.sleep(random.uniform(5, 8))

        try:
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((
                    By.XPATH,
                    '//*[contains(text(),"Phone number shared via url is invalid")]'
                ))
            )
            print(f"[!] Número inválido: {numero}", flush=True)
            errores += 1
            continue
        except Exception:
            pass

        try:
            continuar = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((
                    By.XPATH,
                    '//div[@data-animate-modal-popup="true"]//a | //a[@title="Continue to Chat"]'
                ))
            )
            continuar.click()
            time.sleep(random.uniform(3, 5))
        except Exception:
            pass

        box = wait.until(
            EC.element_to_be_clickable((
                By.XPATH,
                '//div[@data-tab="10"][@contenteditable="true"]'
            ))
        )
        box.click()
        time.sleep(random.uniform(1, 2))
        box.send_keys(Keys.ENTER)

        print(f"[OK] Enviado a {numero} - {nombre}", flush=True)
        enviados += 1
        time.sleep(random.uniform(6, 12))

    except Exception as e:
        print(f"[X] Error con {numero}: {e}", flush=True)
        errores += 1
        time.sleep(3)

driver.quit()
print("=" * 40, flush=True)
print(f"Enviados: {enviados}", flush=True)
print(f"Errores:  {errores}", flush=True)
print("=" * 40, flush=True)
