# REGLAS PERMANENTES DE DESARROLLO — CMC COBRANZAS

Este archivo constituye la configuración de instrucciones persistentes para el workspace de CMC Cobranzas en Google Antigravity. Sus directrices son de cumplimiento obligatorio e incondicional en todas las conversaciones, tareas, herramientas y fases de desarrollo en este repositorio.

---

## 1. Documentos Oficiales de Referencia Obligatoria

En la raíz del repositorio residen los dos documentos oficiales que rigen el estándar del proyecto:

1. **`ReglasCommit.md`**: Normativa oficial para Git, mensajes de commit y nombres de ramas.
2. **`CLEANCODE.md`**: Normativa oficial para arquitectura, calidad de código, organización y desarrollo.

### Reglas de consulta y cumplimiento
- **Consulta previa obligatoria**: Antes de iniciar cualquier tarea, el asistente DEBE consultar activamente el contenido de ambos documentos (`ReglasCommit.md` y `CLEANCODE.md`).
- **Presencia continua**: Las directrices de ambos documentos deben mantenerse presentes durante toda la sesión y ejecución.
- **Ámbito total**: Estas normas aplican al crear, modificar, refactorizar, reorganizar o eliminar archivos; al corregir errores (bugs), implementar funcionalidades (features), optimizar rendimiento y diseñar interfaces; y cubren frontend, componentes, servicios, contextos, hooks, tipos y backend/base de datos cuando aplique.
- **Revisión previa a la entrega**: Antes de dar por finalizada cualquier tarea, se debe verificar el estricto cumplimiento de ambos estándares.
- **Proactividad**: El asistente NO debe esperar a que el usuario le recuerde estas reglas.

### Prioridad y resolución de discrepancias
- `ReglasCommit.md` y `CLEANCODE.md` son complementarios y tienen la máxima autoridad normativa en el repositorio.
- Si surge alguna discrepancia o contradicción entre las instrucciones y los documentos oficiales, el asistente debe señalar expresamente la contradicción al usuario y solicitar aclaración antes de aplicar cualquier cambio o interpretación que pueda violar el estándar.

---

## 2. Aplicación Automática de Clean Code (`CLEANCODE.md`)

Antes de escribir o modificar cualquier código, el asistente debe ejecutar mental y técnicamente el siguiente flujo:

### 2.1. Tamaño y Responsabilidad de Archivos
- **Límite de líneas**: Ningún archivo debe superar las 100 líneas de código. Si la complejidad de la vista o servicio lo justifica estrictamente, el límite máximo absoluto es de 150 líneas.
- **Descomposición**: Si un componente o vista (`src/views/*`) crece más allá del límite, se divide en sub-componentes específicos, modales (`src/components/modals/*`), componentes comunes (`src/components/common/*`), o se extrae la lógica a custom hooks (`src/hooks`) o helpers (`src/utils`).
- **Responsabilidad única**: Cada componente o función debe tener una sola responsabilidad clara. Si requiere comentarios para explicarse por bloques, debe dividirse.
- **Sin divisiones artificiales**: No fragmentar archivos innecesariamente ni alterar código no relacionado con la tarea solo para cumplir una métrica de líneas de forma artificial.

### 2.2. Atomic Design y Reutilización
- **Búsqueda antes de crear**: Antes de crear un componente, modal o elemento visual, verificar si ya existe una solución equivalente en `src/components/common`, `src/components/layout` o `src/components/modals` (e.g., `CustomSelect`, `Pagination`, `RestrictedAccessView`). No duplicar UI ya resuelta.
- **Nivel de composición**:
  - `atoms`: Elementos indivisibles (botones, inputs, badges de estado, selectores base).
  - `molecules`: Combinaciones simples de átomos con una responsabilidad (campo de formulario con label/error, tarjeta KPI, `Pagination`).
  - `organisms`: Composiciones mayores que forman secciones completas (tablas con filtros, formularios en modales).
- **Aislamiento**: Los componentes en `src/components/common` no deben contener lógica de negocio ni conocer modelos de dominio; reciben datos y callbacks vía `props` tipadas en TypeScript.
- **Extracción de duplicidad**: Si varias vistas repiten estructuras, tablas, tarjetas o estilos Tailwind CSS, extraer ese fragmento a `src/components/common`.

### 2.3. Tipado, Estado y Trazabilidad
- **Contratos de datos (`src/types/index.ts`)**: Los tipos y contratos de dominio residen centralizados en `src/types/index.ts`. Si una entidad (`Client`, `Product`, `Debt`, `Payment`, `Voucher`, `BankMovement`, `Reconciliation`, `Invoice`, `DemoUser`, `AuditLog`) requiere cambios, se actualiza primero su contrato en `src/types` y posteriormente el contexto y las vistas.
- **Separación de estado**:
  - **Estado de dominio**: Reside exclusivamente en `src/context` (`AppContext.tsx`) o servicios de API.
  - **Estado de UI**: Filtros locales, términos de búsqueda, pestañas activas, paginación local y control de apertura de modales residen localmente en el componente o vista.
- **Mutaciones de negocio**: Los componentes visuales NUNCA mutan estados persistentes ni financieros directamente. Toda operación de negocio debe ejecutarse a través de `AppContext` o la capa de servicios autorizada.
- **Trazabilidad (`AuditLog`)**: Toda operación crítica (creación, edición, anulación, aprobación, conciliación) debe registrar trazabilidad obligatoria en `AuditLog`, detallando usuario, módulo, acción, valores anteriores y valores nuevos.

### 2.4. Arquitectura y Dirección de Dependencias
- Se respeta estrictamente el flujo unidireccional:
  $$\text{App.tsx} \longrightarrow \text{views} \longrightarrow \text{components} \longrightarrow \text{context} \longrightarrow \text{types / data}$$
- Una capa inferior (`common`, `types`) NUNCA debe importar elementos de una capa superior (`views`).

### 2.5. Nomenclatura e Idioma
- **Inglés**: Nombres de carpetas, archivos, componentes React, hooks, funciones, tipos, interfaces y variables deben escribirse en inglés (`ClientsView`, `DebtsView`, `ReconciliationView`, `VoucherPreviewModal`, `useDebts`).
- **Español reservado para dominio**: Se conservan en español las claves de módulos y estados definidos en los contratos de `src/types/index.ts` (`dashboard`, `clientes`, `productos`, `deudas`, `pagos`, `conciliacion`, `facturas`, `reportes`, `usuarios`, `auditoria`).
- **Nombres claros**: Emplear nombres descriptivos y autoconclusivos, evitando abreviaturas ambiguas.

### 2.6. Comentarios, Emojis e Higiene de Código
- **Sin comentarios redundantes**: El código debe autoexplicarse con nombres limpios y descriptivos.
- **Comentario de excepción**: Se autoriza un único comentario breve (de una sola línea) únicamente cuando explique un "por qué" de negocio no evidente (regla financiera de cobranza, conciliación bancaria, restricción de OCR/API o workaround específico).
- **Prohibiciones estrictas**:
  - NO dejar código comentado.
  - NO dejar bloques de comentarios explicativos.
  - NO dejar `TODO`s sin ticket/issue asociado.
  - NO utilizar emojis en código, nombres de archivos, commits ni documentación. Para la interfaz visual, se utiliza exclusivamente `lucide-react`.

### 2.7. Seguridad, Logs y Privacidad
- No dejar sentencias `console.log` de depuración en código listo para producción o ramas principales.
- Únicamente registrar errores críticos de peticiones o fallos para depuración controlada.
- Prohibición absoluta de exponer datos sensibles en logs o código: claves (`GEMINI_API_KEY`, etc.), tokens, credenciales, números de cédula completos, cuentas/transacciones bancarias o datos personales de clientes.
- Validaciones en frontera: La validación de formularios y permisos (`hasPermission`) debe efectuarse en el punto de entrada antes de desencadenar la acción. No agregar código especulativo (YAGNI).

---

## 3. Aplicación Automática de Reglas de Git (`ReglasCommit.md`)

Cuando se solicite crear una rama, preparar un commit, revisar cambios o publicar código, el asistente debe aplicar obligatoriamente `ReglasCommit.md`.

### 3.1. Formato de Commits (Conventional Commits)
Formato estricto:
```text
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

- **Tipos permitidos**:
  - `feat`: Nueva característica o funcionalidad.
  - `fix`: Corrección de errores (bug fix).
  - `docs`: Modificaciones únicamente en documentación.
  - `style`: Formateo, espacios o estilo visual que no altera la lógica.
  - `refactor`: Mejora de código que no corrige bugs ni añade funcionalidad.
  - `perf`: Optimización de rendimiento.
  - `test`: Añadir o actualizar pruebas.
  - `build`: Cambios en sistema de empaquetado o dependencias externas.
  - `chore`: Tareas de mantenimiento o configuración del repositorio.
  - `ci`: Cambios en pipelines o integración continua.
- **Idioma**: Título y descripción obligatoriamente en **inglés**.
- **Scope**: Identifica el módulo o área afectada (e.g., `auth`, `debts`, `reconciliation`, `ui`, `clients`).
- **Sin emojis**: Prohibido el uso de emojis en cualquier parte del commit.
- **No mezclar cambios**: Nunca combinar tipos de cambios dispares (e.g., refactor + feat) en un solo commit.
- **Mensajes prohibidos**: Rechazar rotundamente mensajes genéricos (`update files`, `fix stuff`, `changes`, `arreglos varios`, `bugfix`).

### 3.2. Formato de Ramas (Branches)
Formato estricto:
```text
<type>/<short-description>-<issue-id>
```
- **Prefijos permitidos**: `feature/`, `fix/`, `hotfix/`, `chore/`, `refactor/`, `release/`, `docs/`.
- **Identificador de Issue**: Prohibido inventar números de tarea o Issue IDs. Si el usuario no proporciona el Issue ID, revisar si existe uno asociado; de no haberlo, solicitarlo antes de crear la rama.
- **Prefijos no autorizados**: No utilizar prefijos distintos a los listados.
- **Mapeo de tipos**: Si el tipo de commit no tiene un prefijo de rama con idéntico nombre, seleccionar el prefijo permitido que represente con exactitud el trabajo (sin alterar el tipo de commit posterior).

### 3.3. Protocolo Pre-Commit
Antes de realizar o proponer un commit:
1. Inspeccionar detalladamente los archivos modificados (`git status`, `git diff`).
2. Categorizar los cambios según el tipo de commit correspondiente.
3. Asegurar que no se mezclen funcionalidades y correcciones de distinta naturaleza.
4. Validar que el mensaje esté redactado en inglés, en minúsculas y en modo imperativo conciso.
5. Confirmar cumplimiento de Conventional Commits y ausencia absoluta de emojis.
6. Verificar que la rama actual cumple con la convención de ramas y que **NO se esté trabajando directamente en `main`**.
7. Ejecutar las comprobaciones automáticas del proyecto (e.g. `npm run build` o linters).
8. Informar al usuario del mensaje exacto de commit propuesto.
9. **Consentimiento**: NO realizar commits automáticamente si el usuario únicamente solicitó editar o crear código; realizar el commit solo cuando sea explícitamente solicitado o autorizado.

---

## 4. Comportamiento Durante el Desarrollo

- **Actuación proactiva e inmediata**: Las normas deben aplicarse desde la primera acción, análisis o respuesta de la tarea.
- **Firmeza técnica**: Si el usuario formula una solicitud que contradiga `CLEANCODE.md` o `ReglasCommit.md` (por ejemplo, crear un componente de 300 líneas, un mensaje de commit en español con emojis, o mutar el estado financiero directamente desde una vista), el asistente debe explicar con claridad la regla afectada y proponer de inmediato una alternativa técnica que respete el estándar del proyecto.
- **Sin atajos**: Ninguna tarea debe ejecutarse omitiendo revisiones de calidad, límites de tamaño o pruebas por intentar finalizar más rápido.

---

## 5. Regla Principal

> **En este repositorio, ninguna modificación de código, funcionalidad, arquitectura, rama o commit debe realizarse ignorando los estándares oficiales de CMC Cobranzas.**
>
> La calidad, mantenibilidad, trazabilidad y cumplimiento de las reglas del equipo tienen prioridad absoluta sobre realizar cambios rápidos sin evaluar su impacto.

