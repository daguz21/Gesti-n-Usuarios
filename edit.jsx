/* ============================================================
   Screen 2 — Edición de usuarios  ->  window.EditScreen
   ============================================================ */

const TODAY_STR = "2026/06/02";
const toInput = (s) => (s ? s.replace(/\//g, "-") : "");
const toSlash = (s) => (s ? s.replace(/-/g, "/") : "");

function validate(f) {
  const D = window.DATA;
  const e = {};
  const txt = (v, min, max) => v && v.trim().length >= min && v.trim().length <= max;

  if (!f.primerNombre || !f.primerNombre.trim())
    e.primerNombre = "El primer nombre es obligatorio.";
  else if (!txt(f.primerNombre, 2, 50))
    e.primerNombre = "Debe tener entre 2 y 50 caracteres.";

  if (f.segundoNombre && !txt(f.segundoNombre, 2, 50))
    e.segundoNombre = "Si lo diligencia, debe tener entre 2 y 50 caracteres.";

  if (!f.primerApellido || !f.primerApellido.trim())
    e.primerApellido = "El primer apellido es obligatorio.";
  else if (!txt(f.primerApellido, 2, 50))
    e.primerApellido = "Debe tener entre 2 y 50 caracteres.";

  if (f.segundoApellido && !txt(f.segundoApellido, 2, 50))
    e.segundoApellido = "Si lo diligencia, debe tener entre 2 y 50 caracteres.";

  if (!f.correo || !f.correo.trim())
    e.correo = "El correo electrónico es obligatorio.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo.trim()))
    e.correo = "Ingrese un correo válido, p. ej. nombre@dominio.com";

  if (!f.contacto || !f.contacto.trim())
    e.contacto = "El número de contacto es obligatorio.";
  else if (!/^\d{2,10}$/.test(f.contacto.trim()))
    e.contacto = "Debe ser numérico, sin signos, de 2 a 10 dígitos.";

  if (!f.perfil) e.perfil = "Seleccione un perfil.";
  if (!f.rolBase) e.rolBase = "Seleccione un rol.";

  if (f.rolTemporalActivo) {
    if (!f.rolTemporal) e.rolTemporal = "Seleccione el rol temporal.";
    if (!f.rolTempInicio) e.rolTempInicio = "Seleccione la fecha inicial.";
    else if (toSlash(f.rolTempInicio) < TODAY_STR) e.rolTempInicio = "No puede ser anterior a hoy (" + TODAY_STR + ").";
    if (!f.rolTempFin) e.rolTempFin = "Seleccione la fecha de vencimiento.";
    else if (f.rolTempInicio && toSlash(f.rolTempFin) < toSlash(f.rolTempInicio))
      e.rolTempFin = "Debe ser igual o posterior a la fecha inicial.";
  }

  if (!f.estado) e.estado = "Seleccione un estado.";
  return e;
}

function UserForm({ form, set, errors, locked }) {
  const D = window.DATA;
  const tempRoles = D.ROLES.filter((r) => r.activo && r.id !== form.rolBase);

  return (
    <>
      {/* Datos generales */}
      <Card num="1" title="Datos generales">
        <div className="form-grid">
          <Field label="Fecha de creación" required locked>
            <input type="date" className="control" value={toInput(form.fechaCreacion)} disabled />
          </Field>
          <Field label="Tipo de usuario" required locked>
            <select className="control" value={form.tipoUsuario} disabled>
              {D.TIPOS_USUARIO.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Usuario" required locked hint="Sincronizado desde el Directorio Activo.">
            <input className="control" value={form.usuario} disabled />
          </Field>
          <div className="field-spacer"></div>

          <Field label="Primer nombre" required error={errors.primerNombre}>
            <input className="control" value={form.primerNombre} maxLength={50}
              onChange={(e) => set({ primerNombre: e.target.value })} />
          </Field>
          <Field label="Segundo nombre" error={errors.segundoNombre}>
            <input className="control" value={form.segundoNombre} maxLength={50}
              onChange={(e) => set({ segundoNombre: e.target.value })} />
          </Field>
          <Field label="Primer apellido" required error={errors.primerApellido}>
            <input className="control" value={form.primerApellido} maxLength={50}
              onChange={(e) => set({ primerApellido: e.target.value })} />
          </Field>
          <Field label="Segundo apellido" error={errors.segundoApellido}>
            <input className="control" value={form.segundoApellido} maxLength={50}
              onChange={(e) => set({ segundoApellido: e.target.value })} />
          </Field>

          <Field label="Correo electrónico" required error={errors.correo}>
            <input type="email" className="control" value={form.correo}
              onChange={(e) => set({ correo: e.target.value })} />
          </Field>
          <Field label="Número de contacto" required error={errors.contacto}>
            <div className="phone-group">
              <select className="control cc" value={form.paisCode} onChange={(e) => set({ paisCode: e.target.value })}>
                {D.PAISES.map((p) => <option key={p.code} value={p.code}>{p.iso} {p.code}</option>)}
              </select>
              <input className="control num-in" inputMode="numeric" value={form.contacto} maxLength={10}
                onChange={(e) => set({ contacto: e.target.value.replace(/[^\d]/g, "") })} placeholder="3001234567" />
            </div>
          </Field>
        </div>
      </Card>

      {/* Datos perfil */}
      <Card num="2" title="Datos perfil">
        <div className="form-grid">
          <Field label="Perfil" required error={errors.perfil}>
            <select className="control" value={form.perfil} onChange={(e) => set({ perfil: e.target.value })}>
              <option value="">Seleccione…</option>
              {D.PERFILES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Rol" required error={errors.rolBase}>
            <select className="control" value={form.rolBase} onChange={(e) => set({ rolBase: e.target.value })}>
              <option value="">Seleccione…</option>
              {D.ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}{!r.activo ? " (inactivo)" : ""}</option>)}
            </select>
          </Field>

          <div className="col-2">
            <Checkbox checked={form.rolTemporalActivo} label="Asignar rol temporal"
              onChange={(v) => set({ rolTemporalActivo: v })} />

            {form.rolTemporalActivo && (
              <div className="temp-inset">
                <div className="form-grid">
                  <Field label="Rol T" required error={errors.rolTemporal} full>
                    <select className="control" value={form.rolTemporal} onChange={(e) => set({ rolTemporal: e.target.value })}>
                      <option value="">Seleccione…</option>
                      {tempRoles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </Field>
                  <Field label="Fecha inicial" required error={errors.rolTempInicio}>
                    <input type="date" className="control" value={toInput(form.rolTempInicio)}
                      min={toInput(TODAY_STR)} onChange={(e) => set({ rolTempInicio: toSlash(e.target.value) })} />
                  </Field>
                  <Field label="Fecha de vencimiento" required error={errors.rolTempFin}>
                    <input type="date" className="control" value={toInput(form.rolTempFin)}
                      min={toInput(form.rolTempInicio || TODAY_STR)}
                      onChange={(e) => set({ rolTempFin: toSlash(e.target.value) })} />
                  </Field>
                </div>
                <p className="note"><Ico.alert width="15" height="15" style={{ flex: "none", color: "var(--muted)" }} />
                  Durante el periodo indicado el usuario tendrá el rol temporal. Al vencer, el sistema reasigna automáticamente el rol base anterior.</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Estado */}
      <Card num="3" title="Estado">
        <div className="form-grid">
          <Field label="Estado" required error={errors.estado}>
            <select className="control" value={form.estado} onChange={(e) => set({ estado: e.target.value })}>
              <option value="">Seleccione…</option>
              {D.ESTADOS_EDIT.filter((s) => s !== "Bloqueado").map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </Card>
    </>
  );
}

function Dropzone({ firma, onFile, onRemove, onPreview }) {
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef(null);

  function handleFiles(files) {
    const file = files && files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("El archivo supera el máximo de 10 MB."); return; }
    const fmt = (file.name.split(".").pop() || "").toUpperCase();
    onFile({ nombre: file.name, formato: fmt, size: (file.size / 1024).toFixed(0) + " KB" });
  }

  return (
    <Card num="4" title="Documentación">
      {!firma ? (
        <div className={`dropzone${drag ? " drag" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}>
          <div className="dz-ico"><Ico.upload width="22" height="22" /></div>
          <div className="dz-sub">Firma del usuario</div>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg" hidden
            onChange={(e) => handleFiles(e.target.files)} />
          <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={() => inputRef.current.click()}>
            <Ico.upload className="ico" />Seleccione el archivo para subir
          </button>
          <div className="dz-or">O arrástrelo y suéltelo aquí</div>
          <div className="dz-meta">Formatos permitidos: PNG, JPG · Tamaño máximo: 10 MB · La firma es opcional</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="grid">
            <thead><tr><th>Descripción</th><th>Adjunto</th><th style={{ textAlign: "right" }}>Acciones</th></tr></thead>
            <tbody>
              <tr>
                <td className="cell-name">{firma.nombre} <span className="cell-muted" style={{ fontWeight: 400 }}>· {firma.formato} · {firma.size}</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={onPreview}><Ico.image className="ico" />Ver adjunto</button></td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", borderColor: "#e9c4c0" }} onClick={onRemove}>
                    <Ico.trash className="ico" />Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function EditScreen({ user, onBack, onSaved, pushToast, onPreviewSig }) {
  const [form, setForm] = React.useState({ ...user });
  const [errors, setErrors] = React.useState({});
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [banner, setBanner] = React.useState(false);
  const [saveFailed, setSaveFailed] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  function onEditar() {
    const e = validate(form);
    setErrors(e);
    setSaveFailed(false);
    if (Object.keys(e).length > 0) {
      setBanner(true);
      pushToast({ kind: "error", title: "Revise los campos marcados", msg: "Hay " + Object.keys(e).length + " campo(s) con errores. Corríjalos para continuar." });
      const first = document.querySelector(".field.error .control");
      if (first) first.focus();
      return;
    }
    setBanner(false);
    setShowConfirm(true);
  }

  function confirmSave() {
    setShowConfirm(false);
    setSaving(true);
    // onSaved persiste en SQLite y resuelve a true/false según el resultado.
    Promise.resolve(onSaved(form)).then((ok) => {
      setSaving(false);
      setSaveFailed(!ok);
    });
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Edición de usuarios</h1>
          <p className="page-sub">Modifique la información del usuario. Los campos bloqueados provienen del Directorio Activo.</p>
        </div>
        <div className="spacer"></div>
        <button className="btn btn-ghost" onClick={onBack}><Ico.arrowLeft className="ico" />Volver</button>
      </div>

      {banner && (
        <div className="banner error">
          <span className="b-ico"><Ico.alert width="18" height="18" /></span>
          <div><b>No fue posible guardar.</b> Algunos campos obligatorios están incompletos o contienen errores. Revise los campos resaltados en rojo y vuelva a intentarlo.</div>
        </div>
      )}

      {saveFailed && (
        <div className="banner error">
          <span className="b-ico"><Ico.alert width="18" height="18" /></span>
          <div><b>El registro no pudo ser actualizado.</b> Ocurrió un problema técnico al guardar en la base de datos. Verifique la conexión con el servidor e intente nuevamente.</div>
        </div>
      )}

      <UserForm form={form} set={set} errors={errors} />
      <Dropzone firma={form.firma}
        onFile={(firma) => set({ firma })}
        onRemove={() => { set({ firma: null }); pushToast({ kind: "success", title: "Archivo eliminado", msg: "La firma no se conservará al guardar." }); }}
        onPreview={() => onPreviewSig(form.firma)} />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 11, marginTop: "var(--gap)" }}>
        <button className="btn btn-ghost" onClick={onBack}>Cancelar</button>
        <button className="btn btn-primary" onClick={onEditar} disabled={saving}><Ico.check className="ico" />{saving ? "Guardando…" : "Editar"}</button>
      </div>

      {showConfirm && (
        <div className="overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="modal-ico confirm"><Ico.edit width="26" height="26" /></div>
              <h3>¿Confirmar actualización?</h3>
              <p>Se actualizará el registro de <b>{form.primerNombre} {form.primerApellido}</b> ({form.usuario}). ¿Desea continuar?</p>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmSave}><Ico.check className="ico" />Sí, actualizar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.EditScreen = EditScreen;
window.UserForm = UserForm;
