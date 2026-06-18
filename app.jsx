/* ============================================================
   App root  — navigation, toasts, success flow
   ============================================================ */

function SignaturePreview({ firma, onClose }) {
  if (!firma) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal sig-preview" onClick={(e) => e.stopPropagation()}>
        <div className="card-head" style={{ borderRadius: 0 }}>
          <Ico.image width="18" height="18" style={{ color: "var(--brand)" }} />
          <h3>Vista previa — {firma.nombre}</h3>
          <button onClick={onClose} style={{ marginLeft: "auto", border: "none", background: "none", color: "var(--muted)" }}><Ico.x /></button>
        </div>
        <div className="sig-img">
          <div style={{ textAlign: "center", color: "var(--muted)" }}>
            <svg width="220" height="90" viewBox="0 0 220 90" fill="none" stroke="var(--brand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75 }}>
              <path d="M12 64 C 34 24, 50 24, 56 50 S 78 78, 92 44 110 18 122 52 138 74 152 46 M150 50 q 18 -4 34 -2" />
            </svg>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, marginTop: 12 }}>firma del usuario · {firma.formato} · {firma.size}</div>
          </div>
        </div>
        <div className="modal-foot" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// Estado de carga / error mientras se consulta la API.
function ListPlaceholder({ kind, onRetry }) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Gestión de usuarios</h1>
          <p className="page-sub">Administre los usuarios sincronizados desde el Directorio Activo de la organización.</p>
        </div>
      </div>
      <Card noBody>
        <div className="no-results">
          {kind === "loading" ? (
            <>
              <div className="big">Cargando usuarios…</div>
              Consultando la base de datos.
            </>
          ) : (
            <>
              <div className="big">No fue posible cargar los usuarios</div>
              Ocurrió un problema al consultar la base de datos. Verifique que el servidor esté en ejecución.
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-primary" onClick={onRetry}><Ico.refresh className="ico" />Reintentar</button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function App() {
  const [users, setUsers] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [loadState, setLoadState] = React.useState("loading"); // loading | ready | error
  const [route, setRoute] = React.useState({ name: "list", user: null });
  const [toasts, setToasts] = React.useState([]);
  const [sigPreview, setSigPreview] = React.useState(null);
  const [successOverlay, setSuccessOverlay] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const topRef = React.useRef(null);
  React.useEffect(() => { if (topRef.current) topRef.current.scrollTop = 0; }, [route]);

  // Carga inicial del listado desde SQLite (GET /api/usuarios).
  function loadUsers() {
    setLoadState("loading");
    fetch("/api/usuarios")
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((data) => { setUsers(data); setLoadState("ready"); })
      .catch(() => setLoadState("error"));
  }
  // Conteo por estado para las tarjetas-resumen (GET /api/usuarios/stats).
  function loadStats() {
    fetch("/api/usuarios/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (s) setStats(s); })
      .catch(() => {});
  }
  React.useEffect(() => { loadUsers(); loadStats(); }, []);

  function pushToast(toast) {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 5200);
  }
  const dismissToast = (id) => setToasts((ts) => ts.filter((x) => x.id !== id));

  const goList = () => setRoute({ name: "list", user: null });
  const goVer = (u) => setRoute({ name: "view", user: u });
  const goEditar = (u) => setRoute({ name: "edit", user: u });

  // Persiste la edición en SQLite (PUT /api/usuarios/<id>).
  // Devuelve una promesa para que la pantalla de edición reaccione al fallo.
  function onSaved(form) {
    return fetch(`/api/usuarios/${encodeURIComponent(form.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((updated) => {
        setUsers((us) => us.map((u) => (u.id === updated.id ? updated : u)));
        loadStats(); // refresca el conteo de las tarjetas tras el cambio de estado
        setSuccessOverlay(true);
        pushToast({ kind: "success", title: "¡Registro actualizado exitosamente!", msg: "Los cambios se guardaron correctamente en la base de datos." });
        setTimeout(() => { setSuccessOverlay(false); goList(); }, 5000);
        return true;
      })
      .catch(() => {
        pushToast({ kind: "error", title: "El registro no pudo ser actualizado.", msg: "Ocurrió un problema técnico al guardar. Verifique la conexión e intente nuevamente." });
        return false;
      });
  }

  const crumbs = ["Usuarios", "Gestión de usuarios"];
  if (route.name === "edit") crumbs.push("Edición de usuarios");
  if (route.name === "view") crumbs.push("Ver usuario");

  const currentUser = { nm: "Mónica Salazar", rl: "Administrador", in: "MS" };

  return (
    <div className="app">
      <Shell.Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main" ref={topRef}>
        <Shell.Topbar crumbs={crumbs} user={currentUser} onMenu={() => setSidebarOpen(true)} />

        {route.name === "list" && loadState === "ready" && <ListScreen users={users} stats={stats} onVer={goVer} onEditar={goEditar} />}
        {route.name === "list" && loadState !== "ready" && <ListPlaceholder kind={loadState} onRetry={loadUsers} />}
        {route.name === "edit" && (
          <EditScreen key={route.user.id} user={route.user} onBack={goList} onSaved={onSaved}
            pushToast={pushToast} onPreviewSig={setSigPreview} />
        )}
        {route.name === "view" && (
          <ViewScreen key={route.user.id} user={route.user} onBack={goList} onPreviewSig={setSigPreview} />
        )}
      </div>

      <Toasts items={toasts} onDismiss={dismissToast} />
      <SignaturePreview firma={sigPreview} onClose={() => setSigPreview(null)} />

      {successOverlay && (
        <div className="overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="modal-ico success"><Ico.checkCircle width="30" height="30" /></div>
              <h3>¡Registro actualizado exitosamente!</h3>
              <p>Los cambios fueron guardados. Será redirigido al listado de usuarios en unos segundos.</p>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={() => { setSuccessOverlay(false); goList(); }}>Ir al listado ahora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
