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
  // Fotos: recortes sin fondo que pasó el club (-recorte) y, si no hay, el cartel de renovación 2026/27 de @sportingburgocf
  "senior-a": {
    fotos: {
    "Óscar García Gende": "img/jugadores/oscar-garcia-gende-recorte.webp",
    "Juan Carlos Leites Maneiro": "img/jugadores/juan-carlos-leites-maneiro-recorte.webp",
    "Rubén Costoya Mosquera": "img/jugadores/ruben-costoya-mosquera-recorte.webp",
    "Yago Salvado Pardo": "img/jugadores/yago-salvado-pardo-recorte.webp",
    "Javier Liñares Rodríguez": "img/jugadores/javier-linares-rodriguez-recorte.webp",
    "Nicolás Anido Castro": "img/jugadores/nicolas-anido-castro-recorte.webp",
    "Marcos Arguelles Rodríguez": "img/jugadores/marcos-arguelles-rodriguez-recorte.webp",
    "Martín López Lodeiro": "img/jugadores/martin-lopez-lodeiro-recorte.webp",
    "Jorge Barreiro Sánchez": "img/jugadores/jorge-barreiro-sanchez-recorte.webp",
    "Mario Ríos Carnota": "img/jugadores/mario-rios-carnota-recorte.webp",
    "Pablo Méndez Amor": "img/jugadores/pablo-mendez-amor-recorte.webp",
    "Diego Sánchez Boquete": "img/jugadores/diego-sanchez-boquete-recorte.webp",
    "Carlos Ferreiro Corujo": "img/jugadores/carlos-ferreiro-corujo-recorte.webp",
    "Hugo Varela Vidal": "img/jugadores/hugo-varela-vidal-recorte.webp",
    "Pablo Veira Canzobre": "img/jugadores/pablo-veira-canzobre-recorte.webp",
    "Pablo Gestal Santiso": "img/jugadores/pablo-gestal-santiso-recorte.webp",
    "José L Salcedo Soto": "img/jugadores/jose-l-salcedo-soto-recorte.webp",
    "Nomar L Mota Martínez": "img/jugadores/nomar-l-mota-martinez-recorte.webp",
    },
    videos: [],
    jugadores: {},
  },
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
