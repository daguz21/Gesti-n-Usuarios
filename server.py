#!/usr/bin/env python3
# ============================================================
# Gestión de Usuarios — Core Daguz
# Backend liviano: sirve los archivos estáticos del prototipo
# y expone una API REST respaldada por SQLite.
#
# Sin dependencias externas: solo librería estándar de Python 3
# (http.server, sqlite3, json). Un único proceso atiende tanto
# el sitio como la API, así no hay CORS ni dos servidores.
#
#   python3 server.py            # http://localhost:8080
#   python3 server.py 9000       # puerto personalizado
# ============================================================

import json
import os
import re
import sqlite3
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "usuarios.db")

# Columnas de la tabla, en orden. Sirven para mapear filas <-> dicts.
COLUMNS = [
    "id", "tipoUsuario", "fechaCreacion", "primerNombre", "segundoNombre",
    "primerApellido", "segundoApellido", "usuario", "correo", "paisCode",
    "contacto", "perfil", "rolBase", "rolTemporalActivo", "rolTemporal",
    "rolTempInicio", "rolTempFin", "estado", "firma",
]

# Campos que la pantalla de edición puede modificar. Los demás
# (fechaCreacion, tipoUsuario, usuario) provienen del Directorio
# Activo y son inmutables, por eso quedan fuera de esta lista.
EDITABLE = [
    "primerNombre", "segundoNombre", "primerApellido", "segundoApellido",
    "correo", "paisCode", "contacto", "perfil", "rolBase",
    "estado", "firma",
]

MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".jsx": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
}


# ---------------------------------------------------------------------------
# Datos semilla (idénticos a los del prototipo original)
# ---------------------------------------------------------------------------
SEED = [
    ["Pedro", "", "Martínez", "Gómez", "Interno", "Administrador", "r-admin", "Activo", "2021/03/12", "3104567890", True],
    ["Laura", "Camila", "Restrepo", "Vélez", "Interno", "Operador", "r-aprob", "Activo", "2022/07/04", "3127894561", True],
    ["Andrés", "", "Quintero", "", "Contratista", "Consulta", "r-consulta", "Vacaciones", "2023/01/19", "3001122334", False],
    ["María", "Fernanda", "López", "Sánchez", "Interno", "Operador", "r-cartera", "Activo", "2020/11/27", "3159988776", True],
    ["Carlos", "", "Bermúdez", "Torres", "Externo", "Consulta", "r-consulta", "Inactivo", "2019/05/02", "3186677889", False],
    ["Diana", "Patricia", "Ospina", "Ríos", "Interno", "Administrador", "r-admin", "Activo", "2022/09/15", "3013344556", True],
    ["Julián", "", "Cárdenas", "", "Contratista", "Operador", "r-soporte", "Nuevo", "2024/02/08", "3209988123", False],
    ["Natalia", "", "Suárez", "Mejía", "Interno", "Operador", "r-riesgo", "Bloqueado", "2021/08/30", "3144455667", False],
    ["Felipe", "Augusto", "Naranjo", "Castro", "Externo", "Consulta", "r-consulta", "Retirado", "2018/12/11", "3122211009", False],
    ["Valentina", "", "Hoyos", "Duarte", "Interno", "Operador", "r-tesoreria", "Activo", "2023/06/21", "3177766554", True],
    ["Santiago", "José", "Pineda", "Marín", "Interno", "Administrador", "r-admin", "Directorio activo", "2020/04/17", "3105550011", False],
    ["Carolina", "", "Vargas", "Acosta", "Contratista", "Consulta", "r-consulta", "Activo", "2024/05/03", "3198877665", False],
    ["Mateo", "", "Giraldo", "Henao", "Interno", "Operador", "r-cartera", "Vacaciones", "2022/03/28", "3133322110", False],
    ["Sara", "Lucía", "Montoya", "Pérez", "Interno", "Operador", "r-aprob", "Activo", "2021/10/09", "3166644778", True],
    ["David", "", "Rincón", "", "Externo", "Consulta", "r-consulta", "Inactivo", "2019/09/14", "3011199228", False],
    ["Camila", "Andrea", "Salazar", "Lozano", "Interno", "Administrador", "r-auditor", "Activo", "2023/11/02", "3188811223", False],
    ["Esteban", "", "Cano", "Arango", "Contratista", "Operador", "r-soporte", "Nuevo", "2024/04/26", "3204455098", False],
    ["Paula", "", "Moreno", "Jaramillo", "Interno", "Operador", "r-riesgo", "Activo", "2022/12/18", "3155566441", True],
    ["Ricardo", "Andrés", "Ávila", "Velásquez", "Externo", "Consulta", "r-consulta", "Bloqueado", "2020/02/05", "3122200447", False],
    ["Juliana", "", "Echeverri", "Ramírez", "Interno", "Operador", "r-tesoreria", "Activo", "2023/08/22", "3177788990", False],
    ["Tomás", "", "Bernal", "Cortés", "Interno", "Administrador", "r-admin", "Directorio activo", "2021/01/30", "3100011224", False],
    ["Ana", "Sofía", "Guerrero", "Flórez", "Contratista", "Consulta", "r-consulta", "Vacaciones", "2024/01/12", "3199900112", False],
    ["Sebastián", "", "Mora", "Cuervo", "Interno", "Operador", "r-cartera", "Activo", "2022/06/07", "3133344558", True],
    ["Manuela", "Isabel", "Toro", "Zuluaga", "Interno", "Operador", "r-aprob", "Retirado", "2019/07/19", "3166677001", False],
    ["Nicolás", "", "Patiño", "", "Externo", "Consulta", "r-consulta", "Inactivo", "2020/10/25", "3011122994", False],
    ["Gabriela", "", "Ramírez", "Bedoya", "Interno", "Administrador", "r-auditor", "Activo", "2023/03/14", "3188822334", False],
    ["Daniel", "Felipe", "Castaño", "Ruiz", "Interno", "Operador", "r-riesgo", "Nuevo", "2024/05/20", "3204400221", False],
    ["Lina", "", "Mejía", "Salgado", "Interno", "Operador", "r-soporte", "Activo", "2022/04/11", "3155500338", False],
]


def username(n1, a1):
    return re.sub(r"\s+", "", f"{n1}.{a1}")


def build_seed_rows():
    """Reconstruye los 28 registros con la misma lógica del prototipo."""
    rows = []
    for i, s in enumerate(SEED):
        n1, n2, a1, a2, tipo, perfil, rol_id, estado, fecha, tel, has_sig = s
        user = username(n1, a1)
        temp_activo = i in (1, 5)
        firma = None
        if has_sig:
            firma = {"nombre": f"firma_{user.lower()}.png", "formato": "PNG", "size": "248 KB"}
        rows.append({
            "id": f"U-{1001 + i}",
            "tipoUsuario": tipo,
            "fechaCreacion": fecha,
            "primerNombre": n1,
            "segundoNombre": n2,
            "primerApellido": a1,
            "segundoApellido": a2,
            "usuario": user,
            "correo": f"{user}@CoreDaguz.com",
            "paisCode": "+57",
            "contacto": tel,
            "perfil": perfil,
            "rolBase": rol_id,
            "rolTemporalActivo": temp_activo,
            "rolTemporal": "r-cartera" if i == 1 else "r-auditor" if i == 5 else "",
            "rolTempInicio": "2026/06/01" if i == 1 else "2026/06/10" if i == 5 else "",
            "rolTempFin": "2026/08/30" if i == 1 else "2026/07/15" if i == 5 else "",
            "estado": estado,
            "firma": firma,
        })
    return rows


# ---------------------------------------------------------------------------
# Capa de base de datos
# ---------------------------------------------------------------------------
def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Crea la tabla y la siembra con los datos de ejemplo si está vacía."""
    conn = connect()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS usuarios (
            id                TEXT PRIMARY KEY,
            tipoUsuario       TEXT,
            fechaCreacion     TEXT,
            primerNombre      TEXT,
            segundoNombre     TEXT,
            primerApellido    TEXT,
            segundoApellido   TEXT,
            usuario           TEXT,
            correo            TEXT,
            paisCode          TEXT,
            contacto          TEXT,
            perfil            TEXT,
            rolBase           TEXT,
            rolTemporalActivo INTEGER,
            rolTemporal       TEXT,
            rolTempInicio     TEXT,
            rolTempFin        TEXT,
            estado            TEXT,
            firma             TEXT
        )
        """
    )
    count = conn.execute("SELECT COUNT(*) AS n FROM usuarios").fetchone()["n"]
    if count == 0:
        for u in build_seed_rows():
            insert_user(conn, u)
        print(f"  · Base sembrada con {len(build_seed_rows())} usuarios → {DB_PATH}")
    conn.commit()
    conn.close()


def to_db(user):
    """dict de la app -> tupla en el orden de COLUMNS (tipos SQLite)."""
    row = []
    for col in COLUMNS:
        val = user.get(col)
        if col == "rolTemporalActivo":
            val = 1 if val else 0
        elif col == "firma":
            val = json.dumps(val, ensure_ascii=False) if val else None
        row.append(val)
    return row


def row_to_user(row):
    """sqlite3.Row -> dict listo para JSON (tipos de la app)."""
    u = {col: row[col] for col in COLUMNS}
    u["rolTemporalActivo"] = bool(row["rolTemporalActivo"])
    u["firma"] = json.loads(row["firma"]) if row["firma"] else None
    return u


def insert_user(conn, user):
    placeholders = ", ".join(["?"] * len(COLUMNS))
    conn.execute(
        f"INSERT INTO usuarios ({', '.join(COLUMNS)}) VALUES ({placeholders})",
        to_db(user),
    )


def list_users():
    conn = connect()
    rows = conn.execute("SELECT * FROM usuarios ORDER BY id").fetchall()
    conn.close()
    return [row_to_user(r) for r in rows]


def get_user(user_id):
    conn = connect()
    row = conn.execute("SELECT * FROM usuarios WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return row_to_user(row) if row else None


def stats():
    """Conteo de usuarios por estado + total, calculado en SQLite.
    Es la fuente autoritativa de las tarjetas-resumen: cualquier alta,
    baja o cambio de estado se refleja aquí automáticamente."""
    conn = connect()
    rows = conn.execute(
        "SELECT estado, COUNT(*) AS n FROM usuarios GROUP BY estado"
    ).fetchall()
    total = conn.execute("SELECT COUNT(*) AS n FROM usuarios").fetchone()["n"]
    conn.close()
    por_estado = {r["estado"]: r["n"] for r in rows}
    return {
        "total": total,
        "porEstado": por_estado,
        "activos": por_estado.get("Activo", 0),
        "inactivos": por_estado.get("Inactivo", 0),
    }


def update_user(user_id, patch):
    """Actualiza solo los campos editables y devuelve el registro resultante."""
    conn = connect()
    row = conn.execute("SELECT * FROM usuarios WHERE id = ?", (user_id,)).fetchone()
    if not row:
        conn.close()
        return None
    sets, values = [], []
    for col in EDITABLE:
        if col not in patch:
            continue
        val = patch[col]
        if col == "rolTemporalActivo":
            val = 1 if val else 0
        elif col == "firma":
            val = json.dumps(val, ensure_ascii=False) if val else None
        sets.append(f"{col} = ?")
        values.append(val)
    if sets:
        values.append(user_id)
        conn.execute(f"UPDATE usuarios SET {', '.join(sets)} WHERE id = ?", values)
        conn.commit()
    updated = conn.execute("SELECT * FROM usuarios WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return row_to_user(updated)


# ---------------------------------------------------------------------------
# Servidor HTTP
# ---------------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    server_version = "GestionUsuarios/1.0"

    # -- helpers ----------------------------------------------------------
    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        if not length:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    # -- routing ----------------------------------------------------------
    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/usuarios":
            return self.send_json(list_users())
        if path == "/api/usuarios/stats":
            return self.send_json(stats())
        m = re.fullmatch(r"/api/usuarios/([^/]+)", path)
        if m:
            user = get_user(m.group(1))
            return self.send_json(user) if user else self.send_json(
                {"error": "Usuario no encontrado."}, 404)
        return self.serve_static(path)

    def do_PUT(self):
        path = self.path.split("?", 1)[0]
        m = re.fullmatch(r"/api/usuarios/([^/]+)", path)
        if not m:
            return self.send_json({"error": "Ruta no encontrada."}, 404)
        try:
            patch = self.read_json()
        except (ValueError, json.JSONDecodeError):
            return self.send_json({"error": "Cuerpo JSON inválido."}, 400)
        updated = update_user(m.group(1), patch)
        if not updated:
            return self.send_json({"error": "El registro no pudo ser actualizado."}, 404)
        return self.send_json(updated)

    # -- estáticos --------------------------------------------------------
    def serve_static(self, path):
        rel = path.lstrip("/") or "index.html"
        full = os.path.normpath(os.path.join(BASE_DIR, rel))
        # Evita salir del directorio del prototipo (path traversal).
        if not full.startswith(BASE_DIR) or not os.path.isfile(full):
            return self.send_json({"error": "No encontrado."}, 404)
        ext = os.path.splitext(full)[1].lower()
        with open(full, "rb") as fh:
            body = fh.read()
        self.send_response(200)
        self.send_header("Content-Type", MIME.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    init_db()
    httpd = ThreadingHTTPServer(("", port), Handler)
    print(f"\n  Gestión de Usuarios — escuchando en http://localhost:{port}")
    print("  API: GET /api/usuarios · GET /api/usuarios/<id> · PUT /api/usuarios/<id>")
    print("  Ctrl+C para detener.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Detenido.")


if __name__ == "__main__":
    main()
