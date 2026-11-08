// Datos que mantiene el club a mano. Equipos, plantillas, partidos y clasificaciones
// vienen de la federación en federacion.js (lo genera actualizar.py).

const CLUB = {
  nombre: "Sporting Burgo",
  corto: "Burgo",
  fundado: 1976,
  barrio: "O Burgo · Culleredo",
  email: "", // pendiente: correo del club
  direccion: "", // pendiente: dirección de la sede
  x: "", // pendiente: redes del club
  federacion: "https://www.futgal.es/pnfg/NPcd/NFG_VerClub?cod_primaria=1000118&codigo_club=1045",
};

// Equipo que manda en la portada: el primer equipo (2ª Futgal)
const PRINCIPAL = "senior-a";

// De mayor a menor: es el orden de las tarjetas de categorías.
const CATEGORIAS = [
  { id: "senior", nombre: "Sénior", singular: "Sénior", edad: "Desde 19 años" },
  { id: "juvenil", nombre: "Juveniles", singular: "Juvenil", edad: "16-18 años" },
  { id: "cadete", nombre: "Cadetes", singular: "Cadete", edad: "14-15 años" },
  { id: "infantil", nombre: "Infantiles", singular: "Infantil", edad: "12-13 años" },
  { id: "alevin", nombre: "Alevines", singular: "Alevín", edad: "10-11 años" },
  { id: "benjamin", nombre: "Benjamines", singular: "Benjamín", edad: "8-9 años" },
  { id: "prebenjamin", nombre: "Prebenjamines", singular: "Prebenjamín", edad: "6-7 años" },
  { id: "biberon", nombre: "Biberón", singular: "Biberón", edad: "4-5 años" },
  { id: "veteranos", nombre: "Veteranos", singular: "Veteranos", edad: "1ª Autonómica" },
];

// Por equipo (id de federacion.js): vídeos y fotos.
// Fotos: solo se muestran en juveniles; app.js lo fuerza aunque aquí haya otras.
// fotos: { "Nombre Como Sale En La Plantilla": "img/jugadores/archivo.jpg" }
// videos: tipo "highlight" | "entrevista", youtube = id del vídeo
// jugadores: lo que la federación no publica:
//   { "Nombre Como Sale En La Plantilla": { posicion: "Delantero", nacimiento: "2008-05-14", mvp: 2 } }
// Partidos, titularidades, goles, tarjetas y dorsal salen solos de las actas de la federación.
const EXTRA = {
  // Primer equipo: las fotos salen en las cartas de la plantilla (jugadores y cuerpo técnico), con el nombre tal cual lo da la federación.
  // Ejemplo: "Marcos Arguelles Rodríguez": "img/jugadores/marcos-arguelles.jpg"
  "senior-a": { fotos: {}, videos: [], jugadores: {} },
};

// Historia: de momento solo lo comprobado (año de fundación, lapreferente.com y páxinas galegas).
// El club completa aquí sus hitos; la página de historia los pinta en orden.
const HISTORIA = {
  hitos: [
    { anio: 1976, texto: "Nace el Sporting Burgo en O Burgo, Culleredo, a orillas de la ría." },
    { anio: 2026, texto: "Catorce equipos en competición: dos sénior, fútbol femenino de infantil a sénior, toda la cantera desde prebenjamín y veteranos." },
  ],
};

const NOTICIAS = [
  {
    id: "nueva-web",
    fecha: "2026-11-07",
    titulo: "Estrenamos web",
    resumen: "Todos los equipos del Sporting Burgo, del primer equipo a los prebenjamines, con partidos, resultados y clasificaciones al día en un solo sitio.",
    cuerpo: "Texto de ejemplo: sustituir por la noticia real.\n\nCada línea en blanco separa párrafos.",
  },
];
