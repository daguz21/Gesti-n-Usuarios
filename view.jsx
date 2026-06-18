/* ============================================================
   Screen 3 — Ver usuario (solo lectura)  ->  window.ViewScreen
   ============================================================ */

function ViewScreen({ user, onBack, onPreviewSig }) {
  const D = window.DATA;
  const pais = D.PAISES.find((p) => p.code === user.paisCode);
  const NOMBRES_VER = ["Constanza", "Jazinto", "Josheline"];
  const primerNombreVer = NOMBRES_VER[Math.floor(Math.random() * NOMBRES_VER.length)];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Ver usuario</h1>
          <p className="page-sub">Consulta de la información del usuario en modo solo lectura.</p>
        </div>
        <div className="spacer"></div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge estado={user.estado} />
          <button className="btn btn-ghost" onClick={onBack}><Ico.arrowLeft className="ico" />Volver</button>
        </div>
      </div>

      {/* Datos generales */}
      <Card num="1" title="Datos generales">
        <div className="form-grid">
          <Field label="Fecha de creación" locked><ROValue value={user.fechaCreacion} /></Field>
          <Field label="Tipo de usuario" locked><ROValue value={user.tipoUsuario} /></Field>
          <Field label="Usuario" locked><ROValue value={user.usuario} /></Field>
          <div className="field-spacer"></div>
          <Field label="Primer nombre"><ROValue value={primerNombreVer} /></Field>
          <Field label="Segundo nombre"><ROValue value={user.segundoNombre} /></Field>
          <Field label="Primer apellido"><ROValue value={user.primerApellido} /></Field>
          <Field label="Segundo apellido"><ROValue value={user.segundoApellido} /></Field>
          <Field label="Correo electrónico"><ROValue value={user.correo} /></Field>
          <Field label="Número de contacto">
            <ROValue value={`${user.paisCode} ${user.contacto}${pais ? "  ·  " + pais.nombre : ""}`} />
          </Field>
        </div>
      </Card>

      {/* Datos perfil */}
      <Card num="2" title="Datos perfil">
        <div className="form-grid">
          <Field label="Perfil"><ROValue value={user.perfil} /></Field>
          <Field label="Rol"><ROValue value={D.rolNombre(user.rolBase)} /></Field>

          {user.rolTemporalActivo ? (
            <div className="col-2">
              <div className="temp-inset" style={{ marginTop: 0, borderStyle: "solid" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
                  <Ico.alert width="15" height="15" style={{ color: "var(--brand)" }} />Tiene rol temporal: Sí
                </div>
                <div className="form-grid">
                  <Field label="Rol T" full><ROValue value={D.rolNombre(user.rolTemporal)} /></Field>
                  <Field label="Fecha inicial"><ROValue value={user.rolTempInicio} /></Field>
                  <Field label="Fecha de vencimiento"><ROValue value={user.rolTempFin} /></Field>
                </div>
              </div>
            </div>
          ) : (
            <div className="col-2">
              <span className="locked-flag" style={{ fontSize: 12.5, padding: "8px 14px" }}>Tiene rol temporal: No</span>
            </div>
          )}
        </div>
      </Card>

      {/* Estado */}
      <Card num="3" title="Estado">
        <div className="form-grid">
          <Field label="Estado">
            <div className="ro-value"><Badge estado={user.estado} /></div>
          </Field>
        </div>
      </Card>

      {/* Documentación */}
      <Card num="4" title="Documentación">
        {user.firma ? (
          <div className="table-wrap">
            <table className="grid">
              <thead><tr><th>Descripción</th><th>Adjunto</th></tr></thead>
              <tbody>
                <tr>
                  <td className="cell-name">{user.firma.nombre} <span className="cell-muted" style={{ fontWeight: 400 }}>· {user.firma.formato} · {user.firma.size}</span></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => onPreviewSig(user.firma)}><Ico.image className="ico" />Ver adjunto</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ro-value empty" style={{ background: "var(--surface-2)" }}>No registro — el usuario no tiene firma cargada.</div>
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--gap)" }}>
        <button className="btn btn-primary" onClick={onBack}><Ico.arrowLeft className="ico" />Finalizar</button>
      </div>
    </div>
  );
}

window.ViewScreen = ViewScreen;
