# Reparación visual — Contabiliario

Rama: `reparacion-cache-visual` (desde `main` @ `2c6280d`).
Preview: https://contabiliario-git-reparacion-cache-visual-camilo-conejeros.vercel.app/

## 1. Qué estaba mal

La versión publicada en `https://contabiliario.vercel.app/` tenía el HTML y el CSS correctos en el servidor, pero algunos navegadores seguían mostrando el diseño anterior.

Causa verificada:
- `vercel.json` sirve `/assets/(.*)` con `Cache-Control: public, max-age=31536000, immutable`.
- Las páginas cargaban `assets/css/contabiliario.css?v=4.1.0` y `assets/js/contabiliario.js?v=4.1.0`, con la misma URL en todos los despliegues.
- El navegador guardaba una versión anterior del CSS durante un año y no la volvía a pedir.

Prueba: en la pestaña de producción, `.ctb-page-hero__grid` tenía `grid-template-columns: none` y las tarjetas medían 1136 px. Al cargar el mismo CSS con otra URL (`?v=cachebust-test`), el layout pasó a `630px 466px` y las tarjetas a 365 px. `curl` al servidor devolvió el CSS nuevo (125 570 bytes, `ctb-page-grid--3` presente, `x-vercel-cache: MISS`).

## 2. Diferencias con la referencia

Comparé `https://contabiliario-5jviu6xbs-camilo-conejeros.vercel.app/` con producción:
- Mismo HTML: mismo H1, mismas secciones (`inicio, ayuda, como-funciona, servicios, demo, testimonios, quienes-somos, faq, contacto`), mismo menú, mismos 25 bloques de preguntas frecuentes.
- La referencia carga además `feedback.js`, que no es del proyecto (es un script de Vercel).
- Diferencia visual real: solo la de caché descrita arriba. Con el CSS nuevo, producción y la referencia se ven igual en la portada (captura comparada a escala 0,6).

Conclusión: la referencia y `main` tienen el mismo código. No hubo que restaurar ninguna versión antigua.

## 3. Qué corregí

- `index.html`, `servicios.html`, `27-bis.html`: `contabiliario.css?v=4.1.0` → `?v=4.2.0` y `contabiliario.js?v=4.1.0` → `?v=4.2.0`. Una URL nueva fuerza la descarga en todos los navegadores.

No cambié diseño, contenido ni funcionalidades. Los cambios del documento original siguen presentes.

## 4. Pruebas

- Preview en Chrome (extensión conectada): `/27-bis` con dos columnas en el encabezado y tres tarjetas de 365 px; sin desborde horizontal (`scrollWidth - innerWidth = 0`).
- Portada del preview frente a la referencia: visualmente idéntica.
- Consola del preview: sin errores de JavaScript (`read_console_messages`, filtro error).
- Cada enlace del menú y del pie lleva a un destino existente (verificado en la prueba anterior de anclas y páginas).
- Formulario de contacto: no probado enviando. Está sin conectar a propósito (muestra el aviso "no conectado"); no hay endpoint para probar el envío.
- Móvil: comprobado en la prueba anterior (390 px, sin desborde). En esta sesión no repetí la captura móvil.

## 5. Estado de GitHub

- Rama `reparacion-cache-visual` subida con el commit `639148d`.
- No hay merge a `main`. Producción no se modificó en esta sesión.

## 6. Estado de Vercel

- Estado del commit `639148d`: `success` (Vercel).
- Preview: URL de arriba, protegida por el inicio de sesión de Vercel (SSO). Se abrió en Chrome con la sesión del navegador.

## 7. Pendiente

- Hacer merge a `main` cuando lo autorices. Eso publica en producción (`contabiliario.vercel.app`).
- Los pendientes de contenido siguen igual: fotos y nombres de socios, testimonios reales, revisión del contador sobre el texto del 27 BIS, decisión sobre "Remuneraciones" y "Empezar o regularizar", número de WhatsApp y backend del formulario.
- Para futuros cambios de CSS o JS: subir la versión (`?v=`) en las páginas que los cargan.
