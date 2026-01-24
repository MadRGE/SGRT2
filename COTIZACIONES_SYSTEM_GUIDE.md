# Sistema de Cotizaciones - Guía de Usuario

## Descripción General

Se ha implementado un sistema completo de cotizaciones con cálculo inteligente de márgenes diseñado para optimizar tu proceso comercial. El sistema te permite cotizar servicios rápidamente, calcular márgenes en tiempo real, compartir presupuestos por WhatsApp y convertir cotizaciones aceptadas en proyectos formales.

## Características Principales

### 1. Calculadora Visual de Márgenes
- **Cálculo automático desde catálogo**: Al seleccionar un trámite, el sistema toma automáticamente los costos base configurados
- **Vista dividida costos vs precio**: Visualiza claramente cuánto te cuesta cada servicio y cuánto cobrarás
- **Indicadores visuales**: Colores que indican si el margen es saludable (verde), bajo (amarillo) o deficitario (rojo)
- **Ajuste manual**: Posibilidad de modificar precios según negociación con el cliente
- **Panel financiero en tiempo real**: Resumen instantáneo de costos totales, precios, margen en pesos y porcentaje

### 2. Gestión de Cotizaciones
- **Estados del ciclo de vida**: Borrador, Enviada, En Negociación, Aceptada, Rechazada, Vencida, Convertida
- **Búsqueda y filtros**: Encuentra rápidamente cotizaciones por cliente o número
- **Estadísticas comerciales**: KPIs de cotizaciones del mes, pendientes, tasa de conversión
- **Vista detallada**: Acceso completo al desglose de cada cotización

### 3. Compartir por WhatsApp
- **URL pública única**: Cada cotización puede generar un link para compartir
- **Vista optimizada móvil**: Diseño responsive perfecto para WhatsApp
- **Sin exposición de costos**: El cliente solo ve precios finales, no tus márgenes
- **Seguimiento**: Contador de veces compartida y vista por el cliente
- **Indicador de vigencia**: Alerta visual si la cotización está vencida

### 4. Conversión a Proyecto con Expedientes
- **Un click**: Convierte cotizaciones aceptadas en proyectos formales automáticamente
- **Creación de cliente**: Si es un contacto temporal, lo convierte en cliente formal
- **Migración de datos**: Todos los ítems y precios se trasladan al presupuesto del proyecto
- **Creación automática de expedientes**: Los ítems vinculados a trámites del catálogo generan expedientes automáticamente
- **Configuración inicial**: Cada expediente se crea en estado "iniciado" con fecha límite de 90 días
- **Estado actualizado**: La cotización queda marcada como convertida y vinculada al proyecto
- **Listo para gestionar**: El proyecto se crea con presupuesto aprobado y expedientes listos para trabajar

### 5. Dashboard de Métricas
- **KPI destacado**: Cotizaciones del mes en tarjeta visual
- **Actividad comercial**: Panel con cotizaciones pendientes, tasa de conversión y cantidad mensual
- **Integración completa**: Las métricas se actualizan automáticamente en el dashboard principal

### 6. Configuración de Márgenes
- **Por categoría**: Define márgenes diferentes para honorarios, tasas, análisis y otros
- **Margen mínimo**: Umbral por debajo del cual se muestra alerta
- **Margen objetivo**: Porcentaje que se aplica por defecto al calcular precios
- **Calculadora de ejemplo**: Ve en tiempo real cómo afectan los márgenes al precio final
- **Recomendaciones**: Guía de márgenes saludables según industria

## Base de Datos

### Tablas Creadas

1. **contactos_temporales**: Leads antes de ser clientes formales
2. **cotizaciones**: Cotizaciones con toda su información financiera
3. **cotizacion_items**: Ítems detallados de cada cotización
4. **configuracion_margenes**: Configuración de márgenes por categoría

### Funciones Automáticas

- **generate_numero_cotizacion()**: Genera números únicos de cotización (COT-AAAAMM-0001)
- **generate_url_publica()**: Crea URLs únicas y seguras para compartir
- **Triggers**: Actualización automática de timestamps y generación de números

### Seguridad (RLS)

- Todas las tablas tienen Row Level Security habilitado
- Solo usuarios autenticados pueden ver cotizaciones
- Solo gestores y admins pueden crear/modificar
- URLs públicas son accesibles sin autenticación (anon) para clientes

## Cómo Usar el Sistema

### Crear una Nueva Cotización

1. Navega a "Cotizaciones" en el menú lateral
2. Click en "Nueva Cotización"
3. Ingresa nombre del cliente y fecha de vencimiento (opcional)
4. Click en "Agregar Trámite" y selecciona del catálogo
5. El sistema calcula automáticamente el margen basado en costos base
6. Ajusta precios manualmente si es necesario
7. Agrega observaciones o condiciones especiales
8. Click en "Guardar Cotización"

### Compartir por WhatsApp

1. En la lista de cotizaciones, busca la que deseas compartir
2. Click en "Generar Link" (solo si no lo tiene ya)
3. Click en "Copiar Link"
4. Pega el link en tu conversación de WhatsApp
5. El cliente verá una vista profesional con todos los detalles

### Convertir a Proyecto

1. Cuando el cliente acepta, cambia el estado a "Aceptada"
2. Click en "Crear Proyecto"
3. El sistema creará automáticamente:
   - Cliente formal (si era contacto temporal)
   - Producto genérico (si el cliente no tiene productos)
   - Proyecto nuevo con estado "presupuesto_aprobado"
   - Presupuesto formal con todos los ítems y precios finales
   - **Expedientes**: Un expediente por cada ítem que esté vinculado a un trámite del catálogo
   - Vinculación completa entre cotización, proyecto y expedientes
4. Cada expediente creado tendrá:
   - Código único (EXP-TIMESTAMP-ID)
   - Estado inicial: "iniciado"
   - Fecha límite: 90 días desde creación
   - Semáforo: verde
   - Referencia a la cotización origen en observaciones
5. Serás redirigido al proyecto para continuar la gestión normal

### Configurar Márgenes

1. Navega a "Configuración" en el menú
2. Accede a "Configuración de Márgenes"
3. Para cada categoría:
   - Define el margen mínimo aceptable
   - Define el margen objetivo
   - Activa/desactiva la categoría
4. Los cambios se aplicarán inmediatamente en nuevas cotizaciones

## Flujo de Trabajo Recomendado

```
CONTACTO INICIAL
    ↓
Crear cotización rápida con calculadora
    ↓
Revisar márgenes (verde = ok, rojo = ajustar)
    ↓
Generar URL pública
    ↓
Compartir por WhatsApp
    ↓
Seguimiento del estado
    ↓
Cliente acepta → Cambiar estado a "Aceptada"
    ↓
Convertir a Proyecto
    ↓
Gestión normal del proyecto
```

## Beneficios del Sistema

✅ **Ahorro de tiempo**: Cotiza en minutos usando el catálogo precargado
✅ **Márgenes saludables**: Visualización clara para no vender por debajo de costo
✅ **Profesionalismo**: Cotizaciones limpias y visualmente atractivas
✅ **Trazabilidad**: Historial completo de todas las cotizaciones
✅ **Conversión ágil**: De cotización a proyecto en un click
✅ **Análisis comercial**: Métricas de conversión y desempeño
✅ **Optimizado para WhatsApp**: Pensado para tu canal principal de comunicación

## Rutas de Acceso

- **Cotizaciones**: `/cotizaciones` (menú lateral)
- **Nueva cotización**: Botón en página de cotizaciones
- **Config. márgenes**: Desde página de configuración
- **Vista pública**: `/cotizacion/{url-unica}` (para clientes)

## Próximas Mejoras Sugeridas

- Exportar cotizaciones a PDF
- Plantillas de cotización predefinidas
- Recordatorios automáticos de seguimiento
- Integración directa con WhatsApp API
- Versiones de cotización (si cliente pide cambios)
- Descuentos por volumen automáticos

---

**Nota**: El sistema está completamente integrado con tu catálogo de trámites existente. Los costos base definidos en `tramite_tipos` se usan automáticamente como punto de partida para calcular precios con margen.
