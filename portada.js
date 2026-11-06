// Lo que usan todas las portadas
function datosPortada() {
  const { esta, pasada } = semanas();
  const principal = equipo(PRINCIPAL), pp = principal && proximo(principal);
  return { esta, pasada, principal, pp: pp && { ...pp, e: principal }, pendientes: esta.filter((p) => !p.resultado),
    pos: principal ? filaPropia(principal) : -1, ganados: pasada.filter((p) => marcador(p).res === "G").length,
    goles: pasada.reduce((s, p) => s + marcador(p).nos, 0) };
}
const seccionNoticias = () => `<section class="bloque" aria-labelledby="not-t"><div class="bloque-cab"><h2 class="titulo" id="not-t">Noticias</h2><a href="#/noticias">Ver todas</a></div>${listaNoticias(NOTICIAS.slice(0, 3))}</section>`;
const miFranja = () => {
  const e = equipo(recordado());
  if (!e) return "";
  const p = proximo(e);
  return `<a class="mi-franja" href="${rutaEquipo(e)}"><span>Tu equipo</span><b>${esc(nombreEquipo(e))}</b><span>${p ? `${esc(mayus(fechaCorta(p.fecha)))}${p.hora ? ` · ${esc(p.hora)}` : ""} · ${esc(cruce(p))}` : "Sin partidos pendientes"}</span></a>`;
};
function alPintarPortada() {}
// Cabecera: la franja anuncia el próximo partido y Equipos despliega todos los equipos
function cabeceraComun() {
  const j = equipo(PRINCIPAL), p = j && proximo(j);
  if (p) document.querySelector(".franja span").innerHTML = `<a href="${rutaEquipo(j)}">Próximo · ${esc(nombreEquipo(j))}: ${esc(cruce(p))} · ${esc(mayus(fechaCorta(p.fecha)))}${p.hora ? `, ${esc(p.hora)}` : ""}</a>`;
  const menu = document.querySelector(".menu"), equipos = menu.querySelector('[data-seccion="cantera"]');
  menu.insertAdjacentHTML("beforeend", `<div class="mega" hidden>${CATEGORIAS.filter((c) => EQUIPOS.some((e) => e.categoria === c.id)).map((c) => `<div><h3><a href="#/cantera/${c.id}">${esc(c.nombre)}</a></h3><ul>${EQUIPOS.filter((e) => e.categoria === c.id).map((e) => `<li><a href="${rutaEquipo(e)}">${esc(nombreEquipo(e))}</a></li>`).join("")}</ul></div>`).join("")}</div>`);
  const mega = menu.querySelector(".mega"), ver = (si) => { mega.hidden = !si; };
  menu.querySelectorAll(".menu-enlaces a").forEach((l) => ["mouseenter", "focus"].forEach((t) => l.addEventListener(t, () => ver(l === equipos))));
  menu.addEventListener("mouseleave", () => ver(false));
  addEventListener("hashchange", () => ver(false));
  addEventListener("keydown", (ev) => { if (ev.key === "Escape") ver(false); });
}
// Bajo el paraguas: la ría de fondo, la franja gallega cruzando y el puente cerrando la portada.
function alArrancar() { cabeceraComun(); }
function inicio() {
  const d = datosPortada(), j = d.principal, top = goleadoresClub(3);
  const anios = hoy().getFullYear() - CLUB.fundado;
  const cats = CATEGORIAS.filter((c) => EQUIPOS.some((e) => e.categoria === c.id));
  const podio = [top[1], top[0], top[2]];
  return `
    <section class="burgo" aria-labelledby="h">
      ${foto(FOTO.portadego, "burgo-foto", false)}
      <div class="burgo-dentro">
        <img class="burgo-escudo" src="img/escudo.png" alt="Escudo del Sporting Burgo" width="145" height="200">
        <div>
          <h1 id="h">Sporting <span>Burgo</span></h1>
          <p class="burgo-lema"><b data-cuenta="${anios}">${anios}</b> años de fútbol en O Burgo, llueva o no</p>
          <p class="burgo-acc"><a class="boton" href="#/partidos">Partidos de esta semana</a><a class="boton boton--claro" href="#/mi-equipo">Mi equipo</a></p>
        </div>
      </div>
    </section>
    ${d.pp ? bandaPartido(d.pp) : ""}
    ${cinta(d.pasada.concat(d.pendientes))}
    ${miFranja()}
    <section class="bloque" data-pestanas aria-labelledby="pes-t">
      <h2 class="titulo" id="pes-t">Esta semana</h2>
      <div class="pestanas" role="tablist">
        <button type="button" role="tab" data-pestana="prox" aria-selected="true">Próximos</button>
        <button type="button" role="tab" data-pestana="res" aria-selected="false">Resultados</button>
        ${j && j.clasificacion.length ? `<button type="button" role="tab" data-pestana="tabla" aria-selected="false">Clasificación ${esc(j.liga)}</button>` : ""}
      </div>
      <div data-panel="prox"><ul>${d.pendientes.slice(0, 7).map(filaCentro).join("") || `<li>${vacio("Sin partidos publicados.")}</li>`}</ul><a class="enlace" href="#/partidos">Centro de partidos ${icono("i-flecha")}</a></div>
      <div data-panel="res" hidden><div class="partidos">${d.pasada.slice(0, 9).map((p) => tarjetaPartido(p, false, true)).join("") || vacio("Sin resultados esta semana.")}</div></div>
      ${j && j.clasificacion.length ? `<div data-panel="tabla" hidden>${tablaClasificacion(j)}</div>` : ""}
    </section>
    ${top.length === 3 ? `<section class="bloque" aria-labelledby="pod-t"><h2 class="titulo" id="pod-t">El podio del gol</h2>
      <ol class="podio">${podio.map((x) => `<li><a href="${rutaFicha(x.e, x.n)}"><span class="podio-cam">${camiseta(x.g)}</span><b>${esc(x.n.split(" ").slice(0, 2).join(" "))}</b><small>${esc(nombreEquipo(x.e))} · ${plural(x.g, "gol", "goles")}</small></a><i></i></li>`).join("")}</ol></section>` : ""}
    <section class="bloque" aria-labelledby="esc-t"><div class="bloque-cab"><h2 class="titulo" id="esc-t">Bajo el mismo paraguas</h2><a href="#/cantera">Los ${EQUIPOS.length} equipos</a></div>
      <ol class="puente">${cats.map((c) => {
        const eqs = EQUIPOS.filter((e) => e.categoria === c.id), fem = eqs.filter((e) => e.fem).length;
        return `<li><a href="#/cantera/${c.id}"><strong>${esc(c.nombre)}</strong><small>${esc(c.edad || "")}</small><small class="puente-n">${plural(eqs.length, "equipo")}${fem ? ` · ${fem} femenino${fem > 1 ? "s" : ""}` : ""}</small></a></li>`;
      }).join("")}</ol></section>
    <section class="ria" aria-labelledby="ria-t">
      <figure>${foto(FOTO.ria)}
        <figcaption><b id="ria-t">Desde ${CLUB.fundado}, a orillas de la ría</b>
          <p>Un paraguas sobre el puente y la franja azul de Galicia: el escudo lo cuenta todo. ${esc(HISTORIA.hitos.at(-1).texto)}</p>
          <a class="enlace" href="#/historia">Historia del club ${icono("i-flecha")}</a></figcaption>
      </figure>
    </section>
    ${donde()}
    ${seccionNoticias()}`;
}
