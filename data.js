/* ============================================================
   Mock data + domain constants  ->  window.DATA
   ============================================================ */
(function () {
  const TIPOS_USUARIO = ["Interno", "Externo", "Contratista"];
  const PERFILES = ["Administrador", "Operador", "Consulta"];

  const ESTADOS = [
    "Activo", "Inactivo", "Retirado", "Vacaciones", "Nuevo", "Bloqueado", "Directorio activo",
  ];
  // Estados selectable in the edit form (no "Nuevo")
  const ESTADOS_EDIT = ["Activo", "Inactivo", "Retirado", "Vacaciones", "Bloqueado", "Directorio activo"];

  const ROLES = [
    { id: "r-admin", nombre: "Administrador del sistema", activo: true },
    { id: "r-aprob", nombre: "Aprobador de operaciones", activo: true },
    { id: "r-cartera", nombre: "Gestor de cartera", activo: true },
    { id: "r-riesgo", nombre: "Analista de riesgo", activo: true },
    { id: "r-tesoreria", nombre: "Tesorería", activo: true },
    { id: "r-auditor", nombre: "Auditor interno", activo: true },
    { id: "r-consulta", nombre: "Consulta general", activo: true },
    { id: "r-soporte", nombre: "Soporte funcional", activo: true },
    { id: "r-legacy", nombre: "Operador legado", activo: false },
  ];

  const PAISES = [
    { code: "+57", iso: "CO", nombre: "Colombia" },
    { code: "+1", iso: "US", nombre: "Estados Unidos" },
    { code: "+52", iso: "MX", nombre: "México" },
    { code: "+51", iso: "PE", nombre: "Perú" },
    { code: "+58", iso: "VE", nombre: "Venezuela" },
    { code: "+593", iso: "EC", nombre: "Ecuador" },
    { code: "+56", iso: "CL", nombre: "Chile" },
    { code: "+54", iso: "AR", nombre: "Argentina" },
    { code: "+34", iso: "ES", nombre: "España" },
  ];

  // status -> badge css class
  const BADGE_CLASS = {
    "Activo": "activo",
    "Inactivo": "inactivo",
    "Retirado": "retirado",
    "Vacaciones": "vacaciones",
    "Nuevo": "nuevo",
    "Bloqueado": "bloqueado",
    "Directorio activo": "directorio",
  };

  function username(n1, a1) {
    return `${n1}.${a1}`.replace(/\s+/g, "");
  }
  function email(n1, a1) {
    return `${username(n1, a1)}@CoreDaguz.com`;
  }

  // Los registros de usuario ya NO viven aquí: provienen de la base
  // SQLite a través de la API (GET /api/usuarios). Ver server.py.
  // Este módulo conserva solo las constantes de dominio y los
  // helpers de presentación que usa la interfaz.

  function nombreCompleto(u) {
    return [u.primerNombre, u.segundoNombre].filter(Boolean).join(" ");
  }
  function apellidoCompleto(u) {
    return [u.primerApellido, u.segundoApellido].filter(Boolean).join(" ");
  }
  function rolNombre(id) {
    const r = ROLES.find((x) => x.id === id);
    return r ? r.nombre : "—";
  }

  window.DATA = {
    TIPOS_USUARIO, PERFILES, ESTADOS, ESTADOS_EDIT, ROLES, PAISES, BADGE_CLASS,
    nombreCompleto, apellidoCompleto, rolNombre, username, email,
  };
})();
