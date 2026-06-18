/* ============================================================
   Screen 1 — Listado de usuarios  ->  window.ListScreen
   ============================================================ */

/* Tarjetas-resumen: el conteo proviene de /api/usuarios/stats (SQLite).
   Se actualizan solas porque App recarga las stats al iniciar y tras
   cada edición que cambie el estado de un usuario. */
function StatsCards({ stats }) {
  const cards = [
    { key: "activos", label: "Activos", value: stats ? stats.activos : null, ico: <Ico.userCheck width="22" height="22" /> },
    { key: "inactivos", label: "Inactivos", value: stats ? stats.inactivos + 1 : null, ico: <Ico.userX width="22" height="22" /> },
    { key: "total", label: "Total", value: stats ? stats.total : null, ico: <Ico.users width="22" height="22" /> },
  ];
  return (
    <div className="stat-grid">
      {cards.map((c) => (
        <div className="stat-card" key={c.key}>
          <div className="stat-meta">
            <div className="stat-num">{c.value == null ? "—" : c.value.toLocaleString("es-CO")}</div>
            <div className="stat-label">{c.label}</div>
          </div>
          <div className="stat-ico">{c.ico}</div>
        </div>
      ))}
    </div>
  );
}

function ListScreen({ users, stats, onVer, onEditar }) {
  const D = window.DATA;
  const today = "2026/06/02";

  // committed filters (applied on "Buscar")
  const empty = { estado: "Todos", perfil: "Todos", fecha: "", q: "" };
  // draft filters (bound to inputs)
  const [draft, setDraft] = React.useState(empty);
  const [applied, setApplied] = React.useState(empty);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(8);

  const filtered = React.useMemo(() => {
    return users.filter((u) => {
      if (applied.estado !== "Todos" && applied.estado !== "Vacaciones" && u.estado !== applied.estado) return false;
      if (applied.perfil !== "Todos" && u.perfil !== applied.perfil) return false;
      if (applied.fecha && u.fechaCreacion !== applied.fecha.replace(/-/g, "/")) return false;
      if (applied.q) {
        const q = applied.q.toLowerCase();
        const hay = (u.usuario + " " + u.correo + " " + D.nombreCompleto(u) + " " + D.apellidoCompleto(u)).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, applied]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const start = (curPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  function buscar() { setApplied(draft); setPage(1); }
  function limpiar() { setDraft(empty); setApplied(empty); setPage(1); }

  // page number window
  const pageNums = [];
  const span = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= curPage - span && i <= curPage + span)) pageNums.push(i);
    else if (pageNums[pageNums.length - 1] !== "…") pageNums.push("…");
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Gestión de usuarios</h1>
          <p className="page-sub">Administre los usuarios sincronizados desde el Directorio Activo de la organización.</p>
        </div>
      </div>

      {/* Filtros */}
      <Card title="Filtros de búsqueda" noBody>
        <div className="card-body" style={{ paddingBottom: 4 }}>
          <div className="filters">
            <Field label="Estado">
              <select className="control" value={draft.estado} onChange={(e) => setDraft({ ...draft, estado: e.target.value })}>
                <option>Todos</option>
                {D.ESTADOS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Tipo de perfil">
              <select className="control" value={draft.perfil} onChange={(e) => setDraft({ ...draft, perfil: e.target.value })}>
                <option>Todos</option>
                {D.PERFILES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Fecha de creación">
              <input type="date" className="control" value={draft.fecha} max={today.replace(/\//g, "-")}
                onChange={(e) => setDraft({ ...draft, fecha: e.target.value })} />
            </Field>
            <Field label="Buscar">
              <div style={{ position: "relative" }}>
                <Ico.search width="16" height="16" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input className="control" style={{ paddingLeft: 34 }} placeholder="Buscar Nombre de usuario / Correo"
                  value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && buscar()} />
              </div>
            </Field>
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn btn-ghost" onClick={limpiar}><Ico.refresh className="ico" />Limpiar</button>
          <button className="btn btn-primary" onClick={buscar}><Ico.search className="ico" />Buscar</button>
        </div>
      </Card>

      {/* Resumen por estado */}
      <StatsCards stats={stats} />

      {/* Listado */}
      <Card title="Listado de usuarios" noBody
        action={<span style={{ fontSize: 12.5, color: "var(--muted)" }}><b style={{ color: "var(--ink)" }}>{filtered.length}</b> registro{filtered.length !== 1 ? "s" : ""}</span>}>
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>Tipo de usuario</th>
                <th>Fecha de creación</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Correo electrónico</th>
                <th>Número de contacto</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((u) => (
                <tr key={u.id}>
                  <td>{u.tipoUsuario}</td>
                  <td className="cell-mono">{u.fechaCreacion.split("/").reverse().join("-")}</td>
                  <td className="cell-name">{D.nombreCompleto(u)}</td>
                  <td>{D.apellidoCompleto(u) || <span className="cell-muted">—</span>}</td>
                  <td className="cell-muted">{u.correo}</td>
                  <td className="cell-mono">{u.paisCode} {u.contacto}</td>
                  <td><Badge estado={u.estado} /></td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onVer(u)}><Ico.eye className="ico" />Ver</button>
                      <button className="btn btn-subtle btn-sm" onClick={() => onEditar(u)}><Ico.edit className="ico" />Editar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan="8">
                  <div className="no-results">
                    <div className="big">Sin resultados</div>
                    No se encontraron usuarios que coincidan con los filtros aplicados.
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="pager">
          <div className="pager-info">
            {filtered.length === 0 ? "0 registros" : <>Mostrando <b>{start + 1}–{Math.min(start + pageSize, filtered.length)}</b> de <b>{filtered.length}</b> registros</>}
          </div>
          <div className="pg-size">
            Filas
            <select className="control" style={{ height: 33, width: "auto", padding: "0 28px 0 10px" }}
              value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
              <option>8</option><option>15</option><option>25</option>
            </select>
          </div>
          <div className="pager-spacer"></div>
          <div className="pager-controls">
            <button className="pg-btn" disabled={curPage === 1} onClick={() => setPage(1)}><Ico.chevsL width="15" height="15" /></button>
            <button className="pg-btn" disabled={curPage === 1} onClick={() => setPage(curPage - 1)}><Ico.chevL width="15" height="15" /></button>
            {pageNums.map((n, i) => n === "…"
              ? <span key={i} style={{ color: "var(--muted)", padding: "0 4px" }}>…</span>
              : <button key={i} className={`pg-btn${n === curPage ? " active" : ""}`} onClick={() => setPage(n)}>{n}</button>)}
            <button className="pg-btn" disabled={curPage === totalPages} onClick={() => setPage(curPage + 1)}><Ico.chev width="15" height="15" /></button>
            <button className="pg-btn" disabled={curPage === totalPages} onClick={() => setPage(totalPages)}><Ico.chevsR width="15" height="15" /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}

window.ListScreen = ListScreen;
