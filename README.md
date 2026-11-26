# Mi Reforma · Gestor de obra, gastos y planos

Aplicación web estática (HTML, CSS y JavaScript puro, sin build) diseñada para gestionar tu reforma al detalle desde **ordenador y móvil**, y alojarla en **GitHub Pages** con guardado automático directamente en tu repositorio.

## Qué incluye

- **Resumen**: progreso global, tareas en curso/vencidas, control de presupuesto conectado con Gastos, próximas fechas, selector rápido de planos (interior y exterior) con vista previa, avance por categoría y últimos comentarios.
- **Tareas (Lista y Tablero Kanban)**:
  - Alta rápida con atajos: `#categoría`, `!alta` / `!urgente`, `@zona`.
  - Subtareas reordenables, comentarios con fecha y hora, enlaces de referencia, fechas, proveedor, etiquetas y costes.
- **Gastos del proyecto + Importador Excel**:
  - Columnas: `Fecha`, `Disposición / Origen`, `Categoría / Partida`, `Proveedor / Concepto`, `Importe`, `Estado`, `Nº Factura / Justificante`, `Restante`.
  - Importación directa de archivos **`.xlsx` / `.xls` / `.csv`** o **pegando filas desde Excel / Google Sheets** (con vista previa antes de añadir o reemplazar).
  - Cálculo automático del `Restante` acumulado sobre el presupuesto (o respeto del valor manual/importado).
  - Exportación a **`.xlsx`** (Excel) o **`.csv`**, y vista en tarjetas totalmente editable en móvil.
- **Editor de planos por plantas e Interior / Exterior (SVG con cotas)**:
  - Múltiples planos clasificados por **Interior / Exterior** y **Planta** (*Sótano, Planta baja, Planta 1, Planta 2, Buhardilla, Cubierta, Parcela / Exterior*…).
  - Muros (existentes, nuevos y a demoler), estancias con m²/perímetro/paredes/+10% merma, puertas y ventanas con cotas automáticas, mobiliario interior y elementos exteriores (**piscina, pérgola, coche/garaje, jardín, árbol, barbacoa, tumbona, trastero**), electricidad, fontanería y clima.
  - 100% editable en móvil con hoja inferior plegable, barra flotante de acciones rápidas y zoom táctil (pellizco).
  - Exportación en **PNG** y **SVG**.
- **Guardado automático en GitHub (para GitHub Pages)**:
  - Guarda al instante cada cambio en `data/reforma.json` dentro de tu propio repositorio usando la API de GitHub y un **Fine-grained Personal Access Token** (guardado solo en tu navegador).
  - Sincronización automática entre móvil y ordenador al abrir la web.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (p. ej. `mi-reforma`).
2. Sube el contenido de esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "Versión inicial de Mi Reforma"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/mi-reforma.git
   git push -u origin main
   ```
3. En GitHub ve a **Settings → Pages**, elige **Deploy from a branch**, selecciona `main` y `/ (root)` y pulsa **Save**.
4. Abre tu web publicada (`https://TU_USUARIO.github.io/mi-reforma/`), ve a **Ajustes → Guardado automático en GitHub** e introduce tu **Fine-grained Personal Access Token** con permiso **Contents: Read and write** solo sobre ese repositorio. A partir de ahí, todo lo que edites en el móvil o el PC se guardará automáticamente en el repositorio.
