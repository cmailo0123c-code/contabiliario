# Cambios solicitados — Contabiliario (sitio web)

Fuente: `cambios pagina.docx` (Descargas). Rama: `cambios-27bis-servicios`, creada desde `mejoras-whatsapp-confianza`. `main` no se toca.

## 1. Requisitos del documento y estado

| # | Requisito | Estado | Dónde |
|---|-----------|--------|-------|
| 1 | Cambiar "Tu contabilidad, sin complicaciones" por "Especialistas en tributación inmobiliaria y recuperación de IVA 27 bis" | Hecho | `index.html` (H1 del hero). El énfasis en color queda en "recuperación de IVA 27 bis." |
| 2 | Agregar página del 27 BIS (título, presentación, qué es, pregunta sobre departamento nuevo) | Hecho | `27-bis.html` (URL `/27-bis`). Enlazada desde menú, móvil y pie |
| 3 | Página de servicios con el contenido del documento | Hecho | `servicios.html` (URL `/servicios`). Incluye tributación inmobiliaria (4 servicios), contabilidad, declaraciones y asesoría, formalización, y "cómo contratas". Enlazada desde la sección de servicios y el pie |
| 4 | Cómo funciona: 4 pasos del documento | Hecho | `index.html` (`#como-funciona`): títulos y descripciones reemplazados |
| 5 | Testimonios: buscar forma de agregar opiniones o casos reales | Hecho (mecanismo) | `index.html` (`#testimonios`) y `assets/js/contabiliario.js`. Ver sección 3 |
| 6 | Quiénes somos: fotos de socios y breve descripción | Parcial | `index.html` (`#quienes-somos`). Huecos de foto y textos marcados como pendientes |

## 2. Cambios implementados

**`index.html`**
- H1 del hero reemplazado (req. 1).
- Menú de escritorio y móvil: nuevos enlaces "IVA 27 bis" y "Quiénes somos".
- Pie: enlaces a "Todos los servicios", "Recuperación IVA 27 bis" y "Quiénes somos".
- Pasos de "Empezar es simple." con los textos del documento.
- Enlace "Ver todos los servicios" bajo las tarjetas de servicios.
- Testimonios: se eliminaron los tres casos de ejemplo ("Historias de ejemplo", con nombres inventados). La sección ahora se alimenta de `<script id="ctb-testimonios">[]</script>`.
- Nueva sección "Quiénes somos" antes de "Preguntas frecuentes", con dos tarjetas de socio (foto, nombre, cargo, descripción) y texto introductorio tomado del documento.

**`27-bis.html`** (nueva): texto del documento, con tres correcciones ortográficas evidentes ("tucas" → "tu caso", "explcarte" → "explicarte", "trabajr" → "trabajar"). Incluye CTA a `index.html#contacto`.

**`servicios.html`** (nueva): contenido del documento, con la misma cabecera y pie que el sitio.

**`assets/js/contabiliario.js`**: nuevo módulo `testimonios` (líneas ~169-190). Lee el JSON de `#ctb-testimonios`, renderiza las tarjetas con escape de HTML y muestra la sección solo si hay casos.

**`assets/css/contabiliario.css`**: sección 22 al final (estilos de pasos, equipo, encabezado de páginas internas y listas).

## 3. Cómo agregar testimonios reales

Editar el `<script type="application/json" id="ctb-testimonios">` de `index.html` con un arreglo, por ejemplo:

```json
[{"nombre":"Nombre Apellido","perfil":"Pyme · Servicios","antes":"Situación previa, en una frase.","cita":"Cita textual autorizada.","despues":"Resultado, en una frase."}]
```

Los campos `antes` y `despues` son opcionales. Con `[]` la sección queda oculta. Solo usar casos reales y autorizados por el cliente.

## 4. Pendientes (material que falta)

- **Fotos y nombres de los socios**, y su cargo y descripción. En la página figuran como `[Nombre del socio 1]`, `Foto pendiente`, etc. El documento pregunta "FOTOS DE LOS SOCIOS?", así que tampoco se sabe si son dos.
- **Testimonios reales y autorizados** (ver sección 3).
- **Contenido legal del 27 BIS**: se publicó tal cual viene en el documento. Debe revisarlo el contador antes de publicar; no se verificó contra la normativa.
- **Sección "Remuneraciones" y "Empezar o regularizar"** siguen en la portada (tarjetas y modales) porque el documento no las menciona. Confirmar si se mantienen.
- **Versión en WordPress**: según la ficha del proyecto, la producción es el plugin de WordPress. Estos cambios solo afectan la demo de Vercel; no se han trasladado al plugin.
- Número de WhatsApp, backend del formulario y página de privacidad: siguen pendientes, como antes (ver ficha de Contabiliario).

## 5. Pruebas ejecutadas

- Validación estructural de `index.html`, `servicios.html` y `27-bis.html` (etiquetas balanceadas): sin errores.
- Enlaces internos y anclas: sin enlaces rotos.
- `node --check assets/js/contabiliario.js`: OK.
- Navegador (Playwright, Chromium), escritorio 1280×800 y móvil 390×844, en las tres páginas: sin errores de consola ni de página, sin desborde horizontal.
- Renderizado de testimonios con un caso de prueba interceptado en memoria (no escrito en el repo): tarjeta renderizada, sección visible, HTML escapado.
- Pasos de la portada visibles tras desplazarse.

**Build:** el proyecto es HTML/CSS/JS estático sin paso de build (`vercel.json`, salida en la raíz). No hay build que ejecutar.

## 6. Archivos modificados o creados

- Modificados: `index.html`, `assets/js/contabiliario.js`, `assets/css/contabiliario.css`.
- Nuevos: `27-bis.html`, `servicios.html`, `docs/CAMBIOS-SOLICITADOS.md`.
