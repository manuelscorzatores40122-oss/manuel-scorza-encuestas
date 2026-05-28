#!/usr/bin/env bash
# Arranca la interfaz de notificaciones usando el venv local
DIR="$(cd "$(dirname "$0")" && pwd)"

# Crear venv si no existe
if [ ! -f "$DIR/.venv/bin/python" ]; then
    echo "[*] Creando entorno virtual..."
    python -m venv "$DIR/.venv"
    "$DIR/.venv/bin/pip" install -r "$DIR/requirements.txt"
fi

exec "$DIR/.venv/bin/python" "$DIR/interfaz.py" "$@"
