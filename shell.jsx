/* ============================================================
   App shell: Sidebar + Topbar  ->  window.Shell
   ============================================================ */

function Sidebar({ open, onClose }) {
  const [usuariosOpen, setUsuariosOpen] = React.useState(true);
  return (
    <>
      <div className={`scrim${open ? " show" : ""}`} onClick={onClose}></div>
      <aside className={`sidebar${open ? " show" : ""}`}>
        <div className="sb-brand">
          <div className="sb-logo">CD</div>
          <div>
            <div className="sb-brand-name">Core Daguz</div>
            <div className="sb-brand-sub">Portal administrativo</div>
          </div>
        </div>

        <nav className="sb-nav">
          <button className="sb-item"><Ico.home className="ico" />Inicio</button>

          <div className="sb-section-label">Administración</div>

          <div className="sb-group">
            <button className={`sb-item${usuariosOpen ? " open" : ""}`} onClick={() => setUsuariosOpen((v) => !v)}>
              <Ico.users className="ico" />
              Usuarios
              <Ico.chev className="chev" width="15" height="15" />
            </button>
            {usuariosOpen && (
              <div className="sb-sub">
                <button className="sb-subitem active">Gestión de usuarios</button>
              </div>
            )}
          </div>
        </nav>

        <div className="sb-foot">
          <Ico.shield width="14" height="14" />
          Sincronizado con Directorio Activo
        </div>
      </aside>
    </>
  );
}

function Topbar({ crumbs, onMenu, user }) {
  return (
    <header className="topbar">
      <button className="menu-toggle btn-ghost" onClick={onMenu}
        style={{ width: 38, height: 38, borderRadius: 8, border: "1.5px solid var(--line-strong)", placeItems: "center", background: "var(--surface)" }}>
        <Ico.menu width="18" height="18" />
      </button>
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Ico.chev className="sep" width="13" height="13" />}
            {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-spacer"></div>
      <div className="topbar-user">
        <div style={{ textAlign: "right" }}>
          <div className="nm">{user.nm}</div>
          <div className="rl">{user.rl}</div>
        </div>
        <div className="av">{user.in}</div>
      </div>
    </header>
  );
}

window.Shell = { Sidebar, Topbar };
