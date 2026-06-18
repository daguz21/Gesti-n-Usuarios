/* ============================================================
   Store de datos en el navegador  ->  window.Store
   ------------------------------------------------------------
   Reemplaza al backend Python (server.py + SQLite) para poder
   desplegar el prototipo como sitio 100% estático en Vercel.

   Los 28 usuarios de ejemplo se siembran la primera vez y las
   ediciones se persisten en localStorage, así que sobreviven
   recargas y cierres del navegador (por navegador/equipo, no
   compartido entre usuarios).

   Expone la MISMA forma que consumía la API REST, devolviendo
   promesas para que app.jsx no cambie su lógica asíncrona:
     Store.list()         ->  Promise<Usuario[]>
     Store.get(id)        ->  Promise<Usuario|null>
     Store.stats()        ->  Promise<{total, porEstado, ...}>
     Store.update(id, p)  ->  Promise<Usuario>   (rechaza si no existe)
   ============================================================ */
(function () {
  const STORAGE_KEY = "gestion-usuarios-db-v1";

  // Campos editables (idéntico a EDITABLE en server.py). Los demás
  // (fechaCreacion, tipoUsuario, usuario) provienen del Directorio
  // Activo y son inmutables: update() los ignora aunque lleguen.
  const EDITABLE = [
    "primerNombre", "segundoNombre", "primerApellido", "segundoApellido",
    "correo", "paisCode", "contacto", "perfil", "rolBase", "estado", "firma",
  ];

  // Datos semilla (idénticos a SEED en server.py).
  // [n1, n2, a1, a2, tipo, perfil, rol_id, estado, fecha, tel, has_sig]
  const SEED = [
    ["Pedro", "", "Martínez", "Gómez", "Interno", "Administrador", "r-admin", "Activo", "2021/03/12", "3104567890", true],
    ["Laura", "Camila", "Restrepo", "Vélez", "Interno", "Operador", "r-aprob", "Activo", "2022/07/04", "3127894561", true],
    ["Andrés", "", "Quintero", "", "Contratista", "Consulta", "r-consulta", "Vacaciones", "2023/01/19", "3001122334", false],
    ["María", "Fernanda", "López", "Sánchez", "Interno", "Operador", "r-cartera", "Activo", "2020/11/27", "3159988776", true],
    ["Carlos", "", "Bermúdez", "Torres", "Externo", "Consulta", "r-consulta", "Inactivo", "2019/05/02", "3186677889", false],
    ["Diana", "Patricia", "Ospina", "Ríos", "Interno", "Administrador", "r-admin", "Activo", "2022/09/15", "3013344556", true],
    ["Julián", "", "Cárdenas", "", "Contratista", "Operador", "r-soporte", "Nuevo", "2024/02/08", "3209988123", false],
    ["Natalia", "", "Suárez", "Mejía", "Interno", "Operador", "r-riesgo", "Bloqueado", "2021/08/30", "3144455667", false],
    ["Felipe", "Augusto", "Naranjo", "Castro", "Externo", "Consulta", "r-consulta", "Retirado", "2018/12/11", "3122211009", false],
    ["Valentina", "", "Hoyos", "Duarte", "Interno", "Operador", "r-tesoreria", "Activo", "2023/06/21", "3177766554", true],
    ["Santiago", "José", "Pineda", "Marín", "Interno", "Administrador", "r-admin", "Directorio activo", "2020/04/17", "3105550011", false],
    ["Carolina", "", "Vargas", "Acosta", "Contratista", "Consulta", "r-consulta", "Activo", "2024/05/03", "3198877665", false],
    ["Mateo", "", "Giraldo", "Henao", "Interno", "Operador", "r-cartera", "Vacaciones", "2022/03/28", "3133322110", false],
    ["Sara", "Lucía", "Montoya", "Pérez", "Interno", "Operador", "r-aprob", "Activo", "2021/10/09", "3166644778", true],
    ["David", "", "Rincón", "", "Externo", "Consulta", "r-consulta", "Inactivo", "2019/09/14", "3011199228", false],
    ["Camila", "Andrea", "Salazar", "Lozano", "Interno", "Administrador", "r-auditor", "Activo", "2023/11/02", "3188811223", false],
    ["Esteban", "", "Cano", "Arango", "Contratista", "Operador", "r-soporte", "Nuevo", "2024/04/26", "3204455098", false],
    ["Paula", "", "Moreno", "Jaramillo", "Interno", "Operador", "r-riesgo", "Activo", "2022/12/18", "3155566441", true],
    ["Ricardo", "Andrés", "Ávila", "Velásquez", "Externo", "Consulta", "r-consulta", "Bloqueado", "2020/02/05", "3122200447", false],
    ["Juliana", "", "Echeverri", "Ramírez", "Interno", "Operador", "r-tesoreria", "Activo", "2023/08/22", "3177788990", false],
    ["Tomás", "", "Bernal", "Cortés", "Interno", "Administrador", "r-admin", "Directorio activo", "2021/01/30", "3100011224", false],
    ["Ana", "Sofía", "Guerrero", "Flórez", "Contratista", "Consulta", "r-consulta", "Vacaciones", "2024/01/12", "3199900112", false],
    ["Sebastián", "", "Mora", "Cuervo", "Interno", "Operador", "r-cartera", "Activo", "2022/06/07", "3133344558", true],
    ["Manuela", "Isabel", "Toro", "Zuluaga", "Interno", "Operador", "r-aprob", "Retirado", "2019/07/19", "3166677001", false],
    ["Nicolás", "", "Patiño", "", "Externo", "Consulta", "r-consulta", "Inactivo", "2020/10/25", "3011122994", false],
    ["Gabriela", "", "Ramírez", "Bedoya", "Interno", "Administrador", "r-auditor", "Activo", "2023/03/14", "3188822334", false],
    ["Daniel", "Felipe", "Castaño", "Ruiz", "Interno", "Operador", "r-riesgo", "Nuevo", "2024/05/20", "3204400221", false],
    ["Lina", "", "Mejía", "Salgado", "Interno", "Operador", "r-soporte", "Activo", "2022/04/11", "3155500338", false],
  ];

  function username(n1, a1) {
    return `${n1}.${a1}`.replace(/\s+/g, "");
  }

  // Reconstruye los 28 registros con la misma lógica de build_seed_rows().
  function buildSeedRows() {
    return SEED.map((s, i) => {
      const [n1, n2, a1, a2, tipo, perfil, rolId, estado, fecha, tel, hasSig] = s;
      const user = username(n1, a1);
      const firma = hasSig
        ? { nombre: `firma_${user.toLowerCase()}.png`, formato: "PNG", size: "248 KB" }
        : null;
      return {
        id: `U-${1001 + i}`,
        tipoUsuario: tipo,
        fechaCreacion: fecha,
        primerNombre: n1,
        segundoNombre: n2,
        primerApellido: a1,
        segundoApellido: a2,
        usuario: user,
        correo: `${user}@CoreDaguz.com`,
        paisCode: "+57",
        contacto: tel,
        perfil: perfil,
        rolBase: rolId,
        rolTemporalActivo: i === 1 || i === 5,
        rolTemporal: i === 1 ? "r-cartera" : i === 5 ? "r-auditor" : "",
        rolTempInicio: i === 1 ? "2026/06/01" : i === 5 ? "2026/06/10" : "",
        rolTempFin: i === 1 ? "2026/08/30" : i === 5 ? "2026/07/15" : "",
        estado: estado,
        firma: firma,
      };
    });
  }

  // -- persistencia local ----------------------------------------------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* localStorage no disponible o JSON corrupto */ }
    const seed = buildSeedRows();
    save(seed);
    return seed;
  }

  function save(rows) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (e) { /* modo incógnito / cuota: la sesión sigue en memoria */ }
  }

  function computeStats(rows) {
    const porEstado = {};
    for (const u of rows) {
      porEstado[u.estado] = (porEstado[u.estado] || 0) + 1;
    }
    return {
      total: rows.length,
      porEstado: porEstado,
      activos: porEstado["Activo"] || 0,
      inactivos: porEstado["Inactivo"] || 0,
    };
  }

  // -- API pública (devuelve promesas, igual que fetch) -----------------
  window.Store = {
    list() {
      return Promise.resolve(load().slice().sort((a, b) => a.id.localeCompare(b.id)));
    },
    get(id) {
      return Promise.resolve(load().find((u) => u.id === id) || null);
    },
    stats() {
      return Promise.resolve(computeStats(load()));
    },
    update(id, patch) {
      const rows = load();
      const idx = rows.findIndex((u) => u.id === id);
      if (idx === -1) return Promise.reject(new Error("Usuario no encontrado."));
      const current = rows[idx];
      const next = { ...current };
      for (const col of EDITABLE) {
        if (col in patch) next[col] = patch[col];
      }
      rows[idx] = next;
      save(rows);
      return Promise.resolve(next);
    },
    // Útil para volver al estado inicial durante demos/QA.
    reset() {
      const seed = buildSeedRows();
      save(seed);
      return Promise.resolve(seed);
    },
  };
})();
