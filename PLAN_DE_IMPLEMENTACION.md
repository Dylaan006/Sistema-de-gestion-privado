# Plan de Implementación / Fases del Proyecto

Este documento detalla el progreso y las fases del Sistema de Gestión.

## ✅ Fase 1: Fundamentos y Configuración (Completado)
- [x] Inicialización del proyecto (Node.js + React/Vite).
- [x] Configuración de Base de Datos (SQLite + Prisma).
- [x] Sistema de Autenticación (JWT, Roles: Admin/Staff/Operator).
- [x] Estructura de Carpetas (MVC en Backend).

## ✅ Fase 2: Lógica de Negocio y Backend (Completado)
- [x] **Productos**: CRUD completo, búsquedas.
- [x] **Clientes**: Gestión de clientes con condiciones fiscales.
- [x] **Ventas**: Lógica de facturación, creación de tickets.
- [x] **Soft Delete**: Implementación de borrado lógico (Papelera) para Productos/Clientes con historial.
    - *Mejora*: Hard Delete automático si no hay historial.

## ✅ Fase 3: Frontend y Experiencia de Usuario (Completado)
- [x] **Dashboard**: Métricas visuales, gráficos de ventas (Recharts).
- [x] **Punto de Venta (POS)**: Interfaz rápida, selección de facturas (A/B/X).
- [x] **Gestión de Stock**:
    - [x] Ajustes manuales (Entrada/Salida).
    - [x] Historial de Movimientos detallado.
- [x] **Usuarios**: Panel de administración de empleados.
- [x] **Facturación**: Descarga de PDF funcional.

## 🚀 Fase 4: Integraciones Reales y Mejoras UI (Pendiente / En Progreso)
- [ ] **AFIP Producción (Revisión Final)**:
    - [ ] **Conexión Simplificada**: Interfaz "cero complejidad" para subir Certificado (.crt) y Clave (.key).
    - [ ] **Facturación**: Verificar flujo completo de venta con CAE (A/B/X).
    - [ ] **Validación**: Asegurar manejo de errores amigable si AFIP falla.
- [ ] **Mejoras Punto de Venta (POS)**:
    - [ ] **Selector de Cantidad**: Permitir elegir cantidad (ej: 10 tornillos) al momento de seleccionar el producto.
    - [ ] **Rediseño Layout**: Reorganizar pantalla.
        - Arriba: Barra de búsqueda principal.
        - Abajo Izquierda: Lista detallada de productos (Items, Precios unitarios).
        - Abajo Derecha: Panel de Totales y Botón de Pago grande.
- [ ] **Sincronizar Puntos de Venta**.

## 🔜 Fase 5: Optimización y Despliegue (Futuro)
- [ ] **Base de Datos**: Migración a PostgreSQL (opcional para mayor escala).
- [ ] **Despliegue**: Subir Backend a VPS/Cloud y Frontend a Vercel/Netlify.
- [ ] **Reportes Avanzados**: Exportación a Excel, filtros por fechas personalizados.
- [ ] **Copias de Seguridad**: Backups automáticos de la base de datos `dev.db`.
- [ ] **UI/UX**: Rediseñar Dashboard (Mejorar estética y métricas).
