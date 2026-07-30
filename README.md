# DMCE — Sistema de Control de Inventario

Plataforma web desarrollada para la **Dirección de Mantenimiento y Control de Edificios (DMCE)**, diseñada para gestionar de forma centralizada el inventario de insumos, productos, compras, entregas y movimientos de stock entre depósitos y oficinas.

## ¿Qué permite hacer?

- **Administrar productos y stock** en múltiples depósitos y oficinas.
- **Gestionar órdenes de compra** a proveedores, con seguimiento de recepciones parciales.
- **Controlar entregas** a instituciones (escuelas, hospitales, etc.).
- **Transferencias entre depósitos** con trazabilidad completa.
- **Expedientes digitales** que agrupan operaciones relacionadas para auditoría y seguimiento.
- **Roles y permisos** por usuario (Administrador, Encargado, Compras, Depósito, Técnico).
- **Registro de movimientos** de stock con historial completo (entradas, salidas, ajustes).
- **Carga de imágenes y documentos** (remitos, facturas, notas de crédito/débito).

## Acceso

| Entorno | URL |
|---------|-----|
| Producción | [dmce.cloud](https://dmce.cloud) |

## Usuarios iniciales

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@gmail.com | admin123 |
| Encargado | encargado@gmail.com | encargado123 |
| Compras | compras@gmail.com | compras123 |
| Depósito | deposito@gmail.com | deposito123 |
| Técnico | tecnico@gmail.com | tecnico123 |

> Cambiar las contraseñas en el primer inicio de sesión.

## Desarrollo

Este sistema fue desarrollado a medida para la DMCE por **Lucas Heredia**.

### Tecnologías utilizadas

- Next.js, React, TypeScript
- PostgreSQL con Prisma
- Tailwind CSS + shadcn/ui
- Cloudinary para imágenes y documentos
- JWT para autenticación

## Repositorio

[https://github.com/planeamientodmce-lab/dmce](https://github.com/planeamientodmce-lab/dmce)
