# Admin Dashboard - Gestión de Devoluciones

Aplicación web React + TypeScript para la gestión de devoluciones mediante importación de Excel.

## Características
- 📊 **Dashboard Interactivo**: KPIs, gráficos y tablas de resumen.
- 📁 **Importación Excel**: Carga de archivos .xlsx con validación automática y reportes de errores.
- 👥 **Gestión de Clientes**: Listado y búsqueda.
- ↩️ **Gestión de Devoluciones**: Flujo de estados (Pendiente -> En Proceso -> Resuelto).
- 💾 **Persistencia Local**: Los datos se guardan en el navegador (LocalStorage).

## Requisitos
- Node.js (v16+)

## Instalación y Ejecución

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```
   
3. Abrir en el navegador (generalmente http://localhost:5173).

## Uso

1. **Importar Data**:
   - Ve a la sección "Importar Excel".
   - Arrastra el archivo `sample-data.xlsx` (generado en la raíz).
   - Revisa el resumen y errores.
   - Click en "Importar Válidos".

2. **Dashboard**:
   - Visualiza métricas clave.
   - Usa los filtros superiores para explorar datos.

3. **Gestionar Devoluciones**:
   - En la pestaña "Devoluciones", cambia el estado de los items.
   - Al marcar como "Resuelto", ingresa la fecha y resolución.

4. **Reset**:
   - Usa el botón "Reset Demo" en la barra superior (escribe RESET) para limpiar todo.

## Estructura del Excel
El archivo debe tener exactamente 2 hojas:
- `clientes`
- `devoluciones`

Para ver el formato exacto, puedes descargar una plantilla desde la sección **Ajustes**.
