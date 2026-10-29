"use strict";

/* ==========================================================
   IMPULSO WEB UY - script.js
   Maneja: pestañas de servicios, barra de progreso, navegación
   lateral, botón flotante y envío del formulario a WhatsApp.
   ========================================================== */


/* ---------- 1. CONFIGURACIÓN ----------
   Cambiá este valor por tu número real (código de país + número,
   sin "+" ni espacios). Uruguay = 598. */
const WHATSAPP = "598XXXXXXXX";


/* ---------- 2. ATAJOS ----------
   $  -> devuelve el primer elemento que coincida con el selector
   $$ -> devuelve todos los que coincidan, como un array real */
const $ = (selector, contexto = document) => contexto.querySelector(selector);
const $$ = (selector, contexto = document) => [...contexto.querySelectorAll(selector)];


/* ---------- 3. DATOS DE LOS SERVICIOS ----------
   Cada objeto es una pestaña:
   t = título, p = descripción corta, l = lista de lo que incluye.
   Para agregar un servicio, sumá otro objeto y un botón en el HTML. */
const servicios = [
  {
    t: "Web de presentación",
    p: "Para negocios y profesionales que quieren mostrar quiénes son y recibir consultas.",
    l: [
      "Inicio, servicios, sobre vos y contacto",
      "Botón de WhatsApp y mapa",
      "Aparece en Google con tu zona y rubro",
      "Se ve bien en celular"
    ]
  },
  {
    t: "Landing para vender",
    p: "Una sola página enfocada en un servicio u oferta, pensada para que la visita actúe.",
    l: [
      "Mensaje directo y llamado a la acción",
      "Formulario o WhatsApp directo",
      "Ideal para promociones y campañas",
      "Carga rápida"
    ]
  },
  {
    t: "Tienda online",
    p: "Para vender productos con catálogo, carrito y pedidos organizados.",
    l: [
      "Catálogo con fotos y precios",
      "Pedido por WhatsApp o pago online",
      "Fácil de actualizar",
      "Pensada para móvil"
    ]
  },
  {
    t: "Mantenimiento",
    p: "Tu web al día, segura y con cambios cuando los necesites.",
    l: [
      "Cambios de textos, fotos y precios",
      "Dominio y hosting al día",
      "Copias de seguridad",
      "Soporte directo conmigo"
    ]
  }
];


/* ---------- 4. PESTAÑAS DE SERVICIOS ---------- */
const panel = $("#panel");

// Dibuja en el panel el servicio número "i"
function show(i) {
  const s = servicios[i];

  panel.innerHTML = `
    <h3>${s.t}</h3>
    <p>${s.p}</p>
    <ul>${s.l.map(item => `<li>${item}</li>`).join("")}</ul>
    <a href="#contacto" data-svc="${i}">Pedir presupuesto de esto</a>
  `;

  // Reinicia la animación de entrada (quita la clase, fuerza reflow y la vuelve a poner)
  panel.classList.remove("swap");
  void panel.offsetWidth;
  panel.classList.add("swap");
}

// Al hacer clic en una pestaña: se marca como activa y se muestra su contenido
$$(".tabs button").forEach(boton => {
  boton.addEventListener("click", () => {
    $$(".tabs button").forEach(b => b.setAttribute("aria-selected", b === boton));
    show(Number(boton.dataset.i));
  });
});

// Si la persona pide presupuesto desde una pestaña, se preselecciona
// ese tipo de servicio en el formulario (las opciones están en el mismo orden)
panel.addEventListener("click", evento => {
  const enlace = evento.target.closest("[data-svc]");
  if (!enlace) return;

  const opciones = $$('input[name="t"]');
  if (opciones[enlace.dataset.svc]) {
    opciones[enlace.dataset.svc].checked = true;
  }
});

// Muestra la primera pestaña al cargar la página
show(0);


/* ---------- 5. BARRA DE PROGRESO Y BOTÓN FLOTANTE ----------
   Se actualizan al hacer scroll. requestAnimationFrame evita
   recalcular más de una vez por cuadro (mejor rendimiento). */
const barra = $("#bar");
const flotante = $(".fab");
const puntos = $$(".rail a");
let esperando = false;

addEventListener("scroll", () => {
  if (esperando) return;
  esperando = true;

  requestAnimationFrame(() => {
    // Porcentaje recorrido de la página, aplicado como escala horizontal
    const maximo = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${maximo > 0 ? scrollY / maximo : 0})`;

    // El botón flotante aparece tras bajar un poco y se oculta cuando
    // el formulario de contacto ya está cerca de verse
    const faltaParaContacto = $("#contacto").getBoundingClientRect().top;
    flotante.classList.toggle(
      "show",
      scrollY > innerHeight * 0.6 && faltaParaContacto > innerHeight * 0.7
    );

    esperando = false;
  });
}, { passive: true });


/* ---------- 6. SECCIÓN ACTIVA EN LA NAVEGACIÓN LATERAL ----------
   IntersectionObserver avisa cuando una sección cruza la franja
   central de la pantalla; ese punto se resalta en naranja. */
const observador = new IntersectionObserver(entradas => {
  entradas.forEach(entrada => {
    if (entrada.isIntersecting) {
      puntos.forEach(punto => {
        punto.classList.toggle("on", punto.getAttribute("href") === "#" + entrada.target.id);
      });
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });

$$("main section").forEach(seccion => observador.observe(seccion));


/* ---------- 7. FORMULARIO -> WHATSAPP ----------
   No hay servidor: se arma un mensaje con los datos y se abre
   WhatsApp con el texto ya escrito. */
$("#form").addEventListener("submit", evento => {
  evento.preventDefault();

  const datos = new FormData(evento.target);
  const nombre = (datos.get("n") || "").trim();

  const rubro = (datos.get("r") || "").trim();
  const extra = (datos.get("m") || "").trim();

  // Validación mínima: el nombre es obligatorio
  if (!nombre) {
    $("#err").textContent = "Escribí tu nombre para poder responderte.";
    $("[name=n]").focus();
    return;
  }

  // Los campos de texto solo aceptan letras (con tildes, ñ y ü) y espacios.
  // Los opcionales (rubro y mensaje) se validan solo si tienen contenido.
  const soloTexto = /^[\p{L}\s]+$/u;
  const campos = [
    ["n", nombre, "El nombre"],
    ["r", rubro, "El rubro"],
    ["m", extra, "El mensaje"]
  ];

  for (const [campo, valor, etiqueta] of campos) {
    if (valor && !soloTexto.test(valor)) {
      $("#err").textContent = `${etiqueta} solo puede tener letras y espacios, sin números ni símbolos.`;
      $(`[name=${campo}]`).focus();
      return;
    }
  }
  $("#err").textContent = "";

  // Mensaje final, con las partes opcionales solo si existen
  const mensaje =
    `Hola, soy ${nombre}${rubro ? " (" + rubro + ")" : ""}. ` +
    `Quiero pedir presupuesto para ${datos.get("t")}.` +
    `${extra ? " " + extra : ""}`;

  open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener");
});


/* ---------- 8. AÑO DEL PIE DE PÁGINA ---------- */
$("#y").textContent = new Date().getFullYear();
