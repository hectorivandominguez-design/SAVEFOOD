# SAVE FOOD

SAVE FOOD es una aplicación web orientada a la reducción del desperdicio de alimentos mediante la comercialización de productos próximos a vencer en un restaurante piloto. El sistema permite publicar productos con descuento, gestionar pedidos, procesar pagos en línea y mantener trazabilidad operativa tanto para el cliente como para el administrador.

El proyecto fue desarrollado como prototipo funcional controlado, con enfoque académico y empresarial, y está construido sobre una arquitectura web moderna basada en React, Vite y Firebase.

---

## Objetivo del sistema

El propósito de SAVE FOOD es facilitar la salida comercial de inventario con vencimiento cercano, permitiendo que los clientes compren productos con precio especial y los recojan en tienda, mientras el administrador mantiene control sobre catálogo, pedidos, inventario, notificaciones y analítica operativa.

---

## Características principales

### Cliente
- Registro de cuenta con validación de contraseña segura
- Inicio de sesión y recuperación de contraseña
- Gestión de perfil
- Visualización del catálogo de productos próximos a vencer
- Consulta de detalle de producto
- Carrito de compra con control de stock
- Checkout con observaciones para el pedido
- Pago en línea mediante Stripe Checkout
- Reintento de pago de pedidos pendientes
- Historial y detalle de pedidos
- Cancelación de pedidos según reglas del sistema
- Feedback y valoración de pedidos entregados
- Contacto con tienda mediante llamada o WhatsApp

### Administrador
- Acceso restringido por rol
- Gestión del catálogo base de productos
- Publicación de productos próximos a vencer
- Edición de publicaciones activas
- Gestión de pedidos y actualización de estados
- Visualización de código de recogida, fecha y hora del pedido, observaciones y contacto del cliente
- Consulta de notificaciones administrativas
- Visualización de reportes y analítica
- Consulta de feedback y valoraciones registradas por clientes

---

## Arquitectura general

El sistema sigue una arquitectura cliente-servidor desacoplada:

- **Frontend**: aplicación SPA construida con React y Vite
- **Backend**: lógica protegida implementada en Firebase Cloud Functions
- **Base de datos**: Cloud Firestore
- **Autenticación**: Firebase Authentication
- **Almacenamiento**: Firebase Storage
- **Hosting**: Firebase Hosting
- **Pagos**: Stripe Checkout

Esta arquitectura permite separar la interacción de usuario de las operaciones críticas del negocio, como la creación de pedidos, el descuento de inventario, la confirmación de pagos y la cancelación de pedidos.

---

## Stack tecnológico

- React 19
- Vite
- JavaScript
- React Router DOM
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting
- Firebase Cloud Functions v2
- Stripe Checkout

---

## Estructura del proyecto

```txt
C:\SaveFood
├─ firebase.json
├─ .firebaserc
├─ .gitignore
├─ firestore.rules
├─ firestore.indexes.json
├─ storage.rules
├─ functions
│  ├─ index.js
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ .gitignore
│  └─ .env.example
└─ savefood-web
   ├─ package.json
   ├─ package-lock.json
   ├─ vite.config.js
   ├─ .gitignore
   ├─ .env.example
   └─ src
      ├─ main.jsx
      ├─ App.jsx
      ├─ app
      ├─ components
      ├─ Layouts
      ├─ pages
      ├─ services
      ├─ styles
      └─ assets
```

---

## Requisitos previos

Antes de ejecutar el proyecto localmente, se recomienda contar con lo siguiente:

- Node.js instalado
- npm instalado
- Firebase CLI instalada
- Proyecto Firebase configurado
- Variables de entorno y secretos necesarios disponibles

---

## Instalación y ejecución local

### 1. Instalar dependencias del frontend

```powershell
cd C:\SaveFood\savefood-web
npm install
```

### 2. Instalar dependencias del backend

```powershell
cd C:\SaveFood\functions
npm install
```

### 3. Ejecutar el frontend en desarrollo

```powershell
cd C:\SaveFood\savefood-web
npm run dev
```

### 4. Ejecutar el backend localmente con emuladores

```powershell
cd C:\SaveFood
firebase emulators:start --only functions
```

---

## Variables de entorno

### Frontend

El frontend requiere una variable principal:

- `VITE_FUNCTIONS_BASE_URL`: URL base para consumir las Cloud Functions desplegadas

### Backend

El backend utiliza configuración y secretos para Stripe y URLs de retorno:

- `APP_URL`: URL base de la aplicación para redirecciones
- `STRIPE_SECRET_KEY`: clave privada de Stripe
- `STRIPE_WEBHOOK_SECRET`: secreto de validación del webhook de Stripe

Importante: estas variables no deben subirse al repositorio público.

---

## Compilación de producción

Para generar la versión lista para despliegue del frontend:

```powershell
cd C:\SaveFood\savefood-web
npm run build
```

---

## Despliegue

### Despliegue de hosting y functions

```powershell
cd C:\SaveFood\savefood-web
npm run build

cd C:\SaveFood
firebase deploy --only hosting,functions --project savefood-69626
```

### Despliegue completo

```powershell
cd C:\SaveFood\savefood-web
npm run build

cd C:\SaveFood
firebase deploy --only functions,firestore:rules,firestore:indexes,storage,hosting --project savefood-69626
```

---

## Seguridad y control de acceso

SAVE FOOD implementa control de acceso con dos roles:

- `ADMIN`
- `CLIENTE`

La autenticación se realiza con Firebase Authentication, mientras que la autorización se controla desde:

- Guards de rutas en frontend
- Reglas de Firestore
- Reglas de Storage
- Lógica protegida en Cloud Functions

Las operaciones sensibles, como creación de pedidos, pagos, cancelaciones y actualización de inventario, no dependen únicamente del frontend y son procesadas por el backend.

---

## Reglas funcionales importantes

- El sistema no implementa reservas
- La entrega se realiza únicamente mediante recogida en tienda
- El flujo de compra es: selección de producto, carrito, checkout, pago en línea y recogida
- El inventario se reserva al crear el pedido
- Los pedidos pendientes de pago pueden ser retomados por el cliente mientras sigan vigentes
- Los pedidos impagos se liberan automáticamente según el tiempo configurado
- Los productos vencidos se actualizan automáticamente según su fecha de vencimiento

---

## Estado del proyecto

El sistema se encuentra en una versión funcional avanzada, con flujo completo para cliente y administrador, integración con pagos, control de inventario, trazabilidad, notificaciones y analítica operativa. Se considera una base sólida para demostración académica, validación funcional y posterior documentación técnica o de usuario.

---

## Recomendaciones para mantenimiento

- No exponer secretos ni archivos `.env` en el repositorio
- Validar cambios críticos con compilación previa al despliegue
- Mantener sincronizados los cambios entre frontend, backend, reglas e índices
- Revisar periódicamente logs de Firebase y Stripe
- Incorporar pruebas automatizadas en futuras iteraciones

---

## Autoría

Proyecto desarrollado como parte del trabajo de grado **SAVE FOOD**, orientado a la reducción del desperdicio de alimentos mediante tecnología web aplicada a un entorno real controlado.
