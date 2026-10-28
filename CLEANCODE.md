# Clean Code — Reglas del proyecto (CMC Cobranzas)

Reglas obligatorias para todo el codigo de este repositorio.

## Tamano de archivos y funciones

- Un archivo no debe superar las 100 lineas de codigo. Si el componente, vista o servicio realmente lo justifica, el limite maximo absoluto es 150 lineas.
- Si una vista (`src/views/*`) o componente crece demasiado, se divide en sub-componentes especificos, modales (`src/components/modals/*`), componentes comunes (`src/components/common/*`), o se extrae la logica a un custom hook o helper en la capa correspondiente (`src/context`, `src/hooks`, `src/utils`).
- Un componente o funcion hace una sola cosa. Si necesita comentarios para explicarse por partes, se debe dividir.

## Comentarios

- No se usan comentarios para explicar que hace el codigo; los nombres de componentes, variables, hooks y funciones deben ser suficientemente descriptivos.
- Se permite un comentario corto (una linea) unicamente cuando explica un porque no obvio: una regla financiera de cobranza o conciliacion bancaria, una restriccion de OCR/API, un workaround puntual o una decision de negocio que sorprenderia a quien lea el codigo despues.
- No se dejan bloques de comentarios, TODOs sin ticket asociado, ni codigo comentado.
- Nunca se usan emojis en codigo, commits, ni documentacion (para iconografia en la interfaz se utiliza exclusivamente `lucide-react`).

## Datos, estado y trazabilidad

- Los componentes visuales no mutan datos persistentes ni estados financieros directamente; toda operacion de negocio (clientes, productos, deudas, pagos, carga/analisis OCR de comprobantes, conciliacion bancaria, facturacion y permisos) pasa por `AppContext` (`src/context/AppContext.tsx`) o por los servicios de API correspondientes cuando se integre el backend.
- Toda operacion critica de creacion, modificacion, anulacion, aprobacion o conciliacion debe registrar su trazabilidad en la bitacora de auditoria (`AuditLog`), indicando usuario, modulo, accion, valores anteriores y valores nuevos.
- Los contratos de datos y tipos de dominio se mantienen centralizados en `src/types/index.ts`. Si cambia una entidad (`Client`, `Product`, `Debt`, `Payment`, `Voucher`, `BankMovement`, `Reconciliation`, `Invoice`, `DemoUser`, `AuditLog`), se actualiza primero su contrato en `src/types` y luego el contexto y las vistas.
- El estado de UI y el estado de dominio no se mezclan: el estado de dominio vive en `src/context`, mientras que el estado puramente visual (filtros locales, busqueda, pestanas activas, paginacion, apertura de modales) vive en el componente o vista que lo usa.

## Logging y privacidad

- Solo se registran logs necesarios: errores de peticiones o fallos criticos relevantes para depuracion en produccion.
- No se usan `console.log` de depuracion en codigo que llega a la rama principal.
- Los logs no deben exponer datos sensibles (claves como `GEMINI_API_KEY`, tokens, credenciales, cedulas completas, numeros de cuenta/transaccion bancaria o datos personales de clientes).

## Componentes reutilizables (Atomic Design)

- Antes de crear un componente nuevo, se revisa si ya existe uno equivalente en `src/components/common`, `src/components/layout` o `src/components/modals`; no se duplica UI que ya esta resuelta (`CustomSelect`, `Pagination`, `RestrictedAccessView`, etc.).
- Cualquier pieza de UI sin logica de negocio y usada (o reutilizable) en mas de una vista va en `src/components/common`, clasificada segun su nivel de composicion:
  - `atoms`: elementos indivisibles (boton, input, badge de estado, selector base).
  - `molecules`: combinaciones simples de atoms con una sola responsabilidad (campo de formulario con label y error, tarjeta de metrica/KPI, barra de paginacion `Pagination`).
  - `organisms`: composiciones mayores que forman una seccion completa (tabla con barra de filtros, formularios modales reutilizables en `src/components/modals`).
- Los componentes de `src/components/common` no conocen la logica de negocio de un modulo especifico; reciben datos y callbacks mediante `props` tipadas en TypeScript. La logica de negocio y el acceso a datos quedan en `src/views` o `src/context`, nunca dentro de un componente base de UI.
- Si una vista (`src/views/*`) repite estructura, tablas, tarjetas o estilos de Tailwind CSS que ya aparecen en otra vista, ese fragmento se extrae a `src/components/common` en lugar de copiarlo.

## Nombres y estructura

- Nombres de carpetas, archivos, componentes React, hooks, tipos y variables en ingles (`ClientsView`, `DebtsView`, `ReconciliationView`, `VoucherPreviewModal`), manteniendo en espanol las claves de modulos y estados del contrato de dominio definidos en `src/types/index.ts` (`dashboard`, `clientes`, `productos`, `deudas`, `pagos`, `conciliacion`, `facturas`, `reportes`, `usuarios`, `auditoria`).
- Nombres descriptivos y sin abreviaturas ambiguas; se prefiere un nombre largo y claro sobre uno corto y confuso.
- No se agregan abstracciones, capas ni configuraciones para casos hipoteticos que no existen todavia (YAGNI).
- Se respeta la direccion de dependencias: `App.tsx` -> `views` -> `components` (`modals` / `layout` / `common`) -> `context` -> `types` / `data`. Una capa inferior (`common`, `types`) nunca importa de una capa superior (`views`).

## Dependencias, validacion y errores

- No se agregan dependencias nuevas sin que resuelvan una necesidad concreta del modulo en el que se usan.
- La validacion de formularios (campos obligatorios, cedula, montos positivos, plazos de cuotas, referencias de pago) y la verificacion de permisos (`hasPermission`) ocurren en el limite de entrada del usuario antes de ejecutar la accion.
- No se agrega manejo de errores para escenarios que no pueden ocurrir dado el flujo y tipado de la aplicacion.

## Control de version

- No se hacen commits directos a `main`; todo cambio pasa por rama y revision.
- Los mensajes de commit describen el porque del cambio, no solo el que.
