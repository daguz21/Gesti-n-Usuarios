# Gestión de Usuarios — Core Daguz (prototipo navegable)

Implementación del módulo **Gestión de usuarios** a partir del diseño de Claude Design
(proyecto "Pruebas QA 2"). El front es React + Babel vía CDN (sin paso de compilación).
No requiere dependencias de `npm` ni de `pip`.

Hay **dos formas de persistir los datos**, intercambiables:

- **Estático (recomendado para desplegar)** — `store.js` siembra los 28 usuarios y guarda
  las ediciones en `localStorage` del navegador. No necesita servidor: funciona en
  cualquier hosting estático (**Vercel**, GitHub Pages, etc.). Es el modo activo por
  defecto (lo carga `index.html`). Limitación: las ediciones son por navegador/equipo, no
  se comparten entre usuarios.
- **Backend Python + SQLite (local)** — `server.py` sirve los estáticos y una API REST
  sobre SQLite. Útil para desarrollo local con persistencia en archivo. *(En este modo
  habría que volver a apuntar `app.jsx` a la API en vez de a `Store`.)*

## Desplegar en Vercel

El proyecto ya es **100% estático**, así que el despliegue no requiere build:

1. Sube el repo a GitHub (ya hecho).
2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importa el repo.
3. **Framework Preset: Other**. Deja *Build Command* y *Output Directory* vacíos
   (la raíz del repo es el sitio).
4. **Deploy**. Obtendrás una URL pública accesible desde cualquier computador.

> `server.py` y `usuarios.db` se ignoran en el despliegue estático; pueden quedarse en el
> repo para uso local sin afectar a Vercel.

## Cómo ejecutarlo en local (modo backend Python)

El backend (`server.py`) sirve los archivos estáticos **y** la API REST en el mismo
proceso y puerto, así que un solo comando levanta todo:

```bash
cd mockups/gestion-usuarios
python3 server.py
# luego abra http://localhost:8080   (o:  python3 server.py 9000)
```

Al arrancar por primera vez crea `usuarios.db` y la siembra con los 28 usuarios de
ejemplo. Las ediciones que confirme en la pantalla **Edición de usuarios** se guardan en
esa base y persisten entre reinicios.

> Nota: en el modo estático (por defecto) el listado lo sirve `store.js` desde
> `localStorage`. Debe servirse por **http(s)** (Vercel, `python3 -m http.server`, etc.),
> no con `file://`, porque Babel descarga los `.jsx` por red.

## API

| Método | Ruta                    | Descripción                                          |
|--------|-------------------------|------------------------------------------------------|
| `GET`  | `/api/usuarios`         | Lista todos los usuarios.                            |
| `GET`  | `/api/usuarios/stats`   | Conteo por estado + total (tarjetas-resumen).        |
| `GET`  | `/api/usuarios/<id>`    | Devuelve un usuario por id.                          |
| `PUT`  | `/api/usuarios/<id>`    | Actualiza los campos editables y persiste.           |

### Tarjetas-resumen (Activos / Inactivos / Total)

Sobre el listado se muestra una fila de tarjetas cuyo número se calcula en SQLite
(`GET /api/usuarios/stats`, `GROUP BY estado`). Se actualizan automáticamente: el front
recarga las stats al iniciar y después de cada edición que cambie el estado de un usuario,
así que altas, bajas o cambios de estado se reflejan sin recargar la página.
`stats` devuelve además `porEstado` con el conteo de cada estado, por si se quieren agregar
más tarjetas (Bloqueado, Vacaciones, etc.).

Los campos del Directorio Activo (`fechaCreacion`, `tipoUsuario`, `usuario`) son
inmutables: el `PUT` los ignora aunque vengan en el cuerpo.

## Pantallas

1. **Listado de usuarios** — filtros (Estado, Tipo de perfil, Fecha de creación, Buscador),
   botones *Limpiar* / *Buscar*, grilla con badges de estado por color, y paginación con
   tamaño de página configurable. 28 usuarios de ejemplo.
2. **Edición de usuarios** — campos del Directorio Activo bloqueados y atenuados, validación
   en rojo con mensajes específicos, banner de error, **rol temporal** con fechas
   condicionadas, zona **drag-and-drop** de firma que se convierte en grilla, modal de
   confirmación y mensaje *"¡Registro actualizado exitosamente!"* con regreso al listado a
   los 5 s.
3. **Ver usuario** — solo lectura; los opcionales vacíos muestran *"No registro"* y se
   indica *"Tiene rol temporal: No"* cuando aplica.

## Estructura

| Archivo      | Responsabilidad                                             |
|--------------|-------------------------------------------------------------|
| `server.py`  | Backend: sirve estáticos + API REST sobre SQLite.           |
| `usuarios.db`| Base SQLite (generada al arrancar; no se versiona).         |
| `index.html` | Punto de entrada; carga React, Babel y los módulos.         |
| `styles.css` | Tokens de diseño y estilos (tema corporativo azul).         |
| `data.js`    | Constantes del dominio y helpers (`window.DATA`).           |
| `ui.jsx`     | Iconos y primitivas compartidas (Badge, Field, Card, etc.). |
| `shell.jsx`  | Shell de la app: menú lateral + barra superior.             |
| `list.jsx`   | Pantalla 1 — Listado.                                       |
| `edit.jsx`   | Pantalla 2 — Edición (validación, firma, modal).            |
| `view.jsx`   | Pantalla 3 — Ver (solo lectura).                            |
| `app.jsx`    | Raíz: navegación, toasts y flujo de éxito.                  |

## Notas de adaptación

- Se omitió el panel de *Tweaks* del prototipo original: era andamiaje de la herramienta de
  diseño (protocolo `postMessage` con el editor) y no se renderiza en un navegador normal.
  El color institucional y la densidad por defecto se aplican directamente en `styles.css`.
- La vista previa de firma usa un placeholder (no hay imagen real cargada).
- Las reglas conceptuales (inactivación a 30 días, logs de auditoría) están reflejadas en la
  lógica de UI pero no simuladas como proceso de fondo.
