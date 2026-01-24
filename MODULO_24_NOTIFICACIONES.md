# Módulo 24: Centro de Notificaciones ✅

## Overview

El Centro de Notificaciones es el sistema de alertas y comunicación interna del SGT v5. Mantiene informados a los usuarios sobre eventos importantes, vencimientos, cambios de estado, y acciones requeridas en proyectos y expedientes.

## Características Principales

✅ **Bandeja de Entrada Centralizada**: Todas las notificaciones en un solo lugar
✅ **Indicador Visual**: Badge con contador en el header (actualización en tiempo real)
✅ **Diferenciación Visual**: Notificaciones no leídas destacadas con fondo azul
✅ **Filtros**: Ver todas o solo no leídas
✅ **Navegación Directa**: Click en notificación navega al expediente/proyecto relacionado
✅ **Marcado Individual y Masivo**: Marcar una o todas como leídas
✅ **Tiempo Relativo**: "Hace 5 min", "Hace 2h", "Hace 3 días"
✅ **Tipos de Notificación**: Con iconos y colores específicos
✅ **Realtime Updates**: Supabase subscriptions para actualizaciones en tiempo real

## Arquitectura

### 1. Base de Datos

**Tabla: `notificaciones`**

```sql
CREATE TABLE notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensaje text NOT NULL,
  expediente_id uuid REFERENCES expedientes(id),
  proyecto_id uuid REFERENCES proyectos(id),
  leida boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);
```

**Campos:**
- `usuario_id`: Usuario destinatario de la notificación
- `tipo`: Tipo de notificación (ver tipos soportados más abajo)
- `titulo`: Título corto de la notificación
- `mensaje`: Texto descriptivo de la notificación
- `expediente_id`: (Opcional) Expediente relacionado
- `proyecto_id`: (Opcional) Proyecto relacionado
- `leida`: Estado de lectura (default: false)
- `read_at`: Timestamp de cuando se marcó como leída

**Índices:**
- `idx_notificaciones_usuario_id` - Búsqueda rápida por usuario
- `idx_notificaciones_leida` - Filtrado por estado de lectura
- `idx_notificaciones_created_at` - Ordenamiento por fecha
- `idx_notificaciones_usuario_leida` - Query compuesta eficiente

**RLS Policies:**
- Users can view own notifications
- Users can update own notifications (mark as read)
- System can insert notifications for any user

### 2. Tipos de Notificación

#### VENCIMIENTO_PROXIMO
**Color:** Amarillo/Ámbar
**Icono:** AlertTriangle
**Uso:** Alertar sobre expedientes próximos a vencer
**Ejemplo:** "El expediente 'Homologación ENACOM' vence en 3 días"

#### DOCUMENTO_REQUERIDO
**Color:** Azul
**Icono:** FileText
**Uso:** Notificar cuando se requiere documentación o un documento fue subido
**Ejemplo:** "El cliente ha subido un nuevo documento: 'CFS_España_2025.pdf'"

#### ESTADO_CAMBIO
**Color:** Verde
**Icono:** CheckCircle
**Uso:** Informar sobre cambios de estado en proyectos o expedientes
**Ejemplo:** "El presupuesto para 'Importación Lata de Atún' fue aprobado por el cliente"

#### OBSERVADO/RECHAZADO
**Color:** Rojo
**Icono:** AlertTriangle
**Uso:** Alertar sobre observaciones o rechazos de organismos
**Ejemplo:** "SENASA observó el expediente SGT-2025-SENASA-002"

### 3. Componentes

#### A. Notificaciones.tsx (Página Principal)

**Ubicación:** `src/pages/Notificaciones/Notificaciones.tsx`

**Props:**
```typescript
interface Props {
  onBack: () => void;
  onNavigateToExpediente?: (expedienteId: string) => void;
  onNavigateToProyecto?: (proyectoId: string) => void;
}
```

**Funcionalidades:**
- Lista todas las notificaciones ordenadas por fecha (más recientes primero)
- Filtro de "Todas" vs "No leídas"
- Botón "Marcar todas como leídas"
- Marcado individual de notificaciones
- Click en notificación → navega y marca como leída
- Formateo de tiempo relativo
- Badges de tipo con colores
- Empty states elegantes

**Estados:**
```typescript
const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
const [loading, setLoading] = useState(true);
const [filtro, setFiltro] = useState<'todas' | 'no_leidas'>('todas');
```

#### B. Header.tsx (Badge de Notificaciones)

**Ubicación:** `src/components/Layout/Header.tsx`

**Nuevas Features:**
- Badge con contador de notificaciones no leídas
- Actualización en tiempo real con Supabase subscriptions
- Click en campana → navega a /notificaciones
- Badge rojo con número (o "99+" si hay más de 99)

**Implementación:**
```typescript
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  loadUnreadCount();

  // Realtime subscription
  const subscription = supabase
    .channel('notificaciones_changes')
    .on('postgres_changes', { table: 'notificaciones' }, () => {
      loadUnreadCount();
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### 4. Flujo de Usuario

#### Recepción de Notificación

1. **Sistema crea notificación** (ej: cuando cliente sube documento)
   ```typescript
   await supabase.from('notificaciones').insert({
     usuario_id: gestor_id,
     tipo: 'DOCUMENTO_REQUERIDO',
     titulo: 'Acción Requerida: Cliente A S.A.',
     mensaje: 'El cliente ha subido un nuevo documento...',
     expediente_id: exp_id,
     leida: false
   });
   ```

2. **Badge actualiza automáticamente** vía realtime subscription
3. **Usuario ve el número en el header** (ej: "3")

#### Consulta de Notificaciones

1. **Usuario click en campana** (Bell icon en header)
2. **Navega a /notificaciones**
3. **Ve lista ordenada** (más recientes primero)
4. **Notificaciones no leídas** tienen fondo azul claro

#### Marcado como Leída

**Opción 1: Marcado Individual**
```typescript
// Botón "Marcar como leída" en la notificación
const handleMarcarLeida = async (id: string) => {
  await supabase
    .from('notificaciones')
    .update({ leida: true, read_at: new Date().toISOString() })
    .eq('id', id);
};
```

**Opción 2: Marcado Automático al Navegar**
```typescript
// Al hacer click en la notificación
const handleNotificationClick = (notif: Notificacion) => {
  if (!notif.leida) {
    handleMarcarLeida(notif.id);
  }
  // Navegar al expediente/proyecto
  onNavigateToExpediente(notif.expediente_id);
};
```

**Opción 3: Marcar Todas**
```typescript
// Botón "Marcar todas como leídas"
const handleMarcarTodasLeidas = async () => {
  const noLeidas = notificaciones.filter(n => !n.leida).map(n => n.id);

  await supabase
    .from('notificaciones')
    .update({ leida: true, read_at: new Date().toISOString() })
    .in('id', noLeidas);
};
```

## Casos de Uso

### 1. Vencimiento Próximo de Expediente

**Trigger:** Job nocturno que revisa expedientes con fecha_limite próxima

```typescript
// Pseudo-código
const expedientesProximosAVencer = await getExpedientesVencen3Dias();

for (const exp of expedientesProximosAVencer) {
  await crearNotificacion({
    usuario_id: exp.gestor_asignado_id,
    tipo: 'VENCIMIENTO_PROXIMO',
    titulo: 'Alerta de Vencimiento',
    mensaje: `El expediente '${exp.tramite_nombre}' (${exp.codigo}) vence en 3 días.`,
    expediente_id: exp.id
  });
}
```

### 2. Cliente Sube Documento

**Trigger:** Upload de archivo en ChecklistMaestro (modo cliente)

```typescript
// En ChecklistMaestro.tsx
const handleSubirArchivo = async (file, expedienteId) => {
  // ... lógica de upload ...

  // Obtener gestor asignado al proyecto
  const { data: expediente } = await supabase
    .from('expedientes')
    .select('proyectos(gestor_asignado_id)')
    .eq('id', expedienteId)
    .single();

  // Crear notificación
  await supabase.from('notificaciones').insert({
    usuario_id: expediente.proyectos.gestor_asignado_id,
    tipo: 'DOCUMENTO_REQUERIDO',
    titulo: `Acción Requerida: ${cliente.razon_social}`,
    mensaje: `El cliente ha subido un nuevo documento: "${file.name}"`,
    expediente_id: expedienteId
  });
};
```

### 3. Presupuesto Aprobado por Cliente

**Trigger:** Click en "Aprobar Presupuesto" en PresupuestoIntegrado

```typescript
// En PresupuestoIntegrado.tsx
const handleAprobarPresupuesto = async () => {
  // ... lógica de aprobación ...

  await supabase.from('notificaciones').insert({
    usuario_id: gestor_id,
    tipo: 'ESTADO_CAMBIO',
    titulo: 'Proyecto Aprobado',
    mensaje: `El presupuesto para '${proyecto.nombre_proyecto}' fue aprobado por el cliente.`,
    proyecto_id: proyecto.id
  });
};
```

### 4. Organismo Observa Expediente

**Trigger:** Cambio de estado a "observado" en expediente

```typescript
// En ExpedienteDetail.tsx o via webhook
const handleEstadoChange = async (expedienteId, nuevoEstado) => {
  if (nuevoEstado === 'observado') {
    const { data: exp } = await supabase
      .from('expedientes')
      .select('*, proyectos(gestor_asignado_id)')
      .eq('id', expedienteId)
      .single();

    await supabase.from('notificaciones').insert({
      usuario_id: exp.proyectos.gestor_asignado_id,
      tipo: 'OBSERVADO',
      titulo: 'Expediente Observado',
      mensaje: `${exp.tramite_tipos.organismo} observó el expediente ${exp.codigo}.`,
      expediente_id: expedienteId
    });
  }
};
```

## UI/UX Details

### Notificación No Leída
```css
- Fondo: bg-blue-50 (azul claro)
- Punto azul (w-2 h-2 bg-blue-500)
- Texto: text-slate-900 (más oscuro)
- Hover: bg-blue-100
```

### Notificación Leída
```css
- Fondo: bg-white
- Sin punto indicador
- Texto: text-slate-600 (más claro)
- Hover: bg-slate-50
```

### Badge en Header
```css
- Posición: absolute -top-1 -right-1
- Fondo: bg-red-500
- Texto: text-white text-xs font-bold
- Forma: rounded-full
- Tamaño mínimo: min-w-[20px] h-5
```

### Tiempo Relativo
```typescript
const formatTiempo = (fecha: string) => {
  const diffMinutos = Math.floor((now - notifDate) / 60000);

  if (diffMinutos < 1) return 'Hace un momento';
  if (diffMinutos < 60) return `Hace ${diffMinutos} min`;
  if (diffHoras < 24) return `Hace ${diffHoras}h`;
  if (diffDias < 7) return `Hace ${diffDias}d`;
  return notifFecha.toLocaleDateString();
};
```

### Badges de Tipo
```typescript
const getBadgeTipo = (tipo: string) => {
  if (tipo.includes('VENCIMIENTO'))
    return 'bg-amber-100 text-amber-800 border-amber-200';
  if (tipo.includes('DOCUMENTO'))
    return 'bg-blue-100 text-blue-800 border-blue-200';
  if (tipo.includes('APROBADO'))
    return 'bg-green-100 text-green-800 border-green-200';
  // ...
};
```

## Realtime Updates

### Supabase Subscription
```typescript
const subscription = supabase
  .channel('notificaciones_changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'notificaciones'
    },
    (payload) => {
      // Recargar contador
      loadUnreadCount();
    }
  )
  .subscribe();
```

**Eventos Soportados:**
- `INSERT`: Nueva notificación → actualiza badge
- `UPDATE`: Notificación marcada como leída → actualiza badge
- `DELETE`: Notificación eliminada → actualiza badge

## Performance Considerations

### Índices Optimizados
```sql
-- Query más común: obtener no leídas de un usuario
CREATE INDEX idx_notificaciones_usuario_leida
  ON notificaciones(usuario_id, leida);

-- Ordenamiento por fecha
CREATE INDEX idx_notificaciones_created_at
  ON notificaciones(created_at DESC);
```

### Query Eficiente para Contador
```typescript
// Solo cuenta, no trae datos
const { count } = await supabase
  .from('notificaciones')
  .select('*', { count: 'exact', head: true })
  .eq('usuario_id', userId)
  .eq('leida', false);
```

### Paginación (Futuro)
```typescript
// Cargar notificaciones de 20 en 20
const { data } = await supabase
  .from('notificaciones')
  .select('*')
  .eq('usuario_id', userId)
  .order('created_at', { ascending: false })
  .range(offset, offset + 19);
```

## Mejoras Futuras

### 1. Notificaciones Push
- Integrar con Firebase Cloud Messaging
- Push notifications en navegador (Web Push API)
- Notificaciones en móvil (React Native)

### 2. Preferencias de Usuario
```typescript
// Tabla: notificacion_preferences
{
  usuario_id: uuid,
  tipo_notificacion: string,
  enabled: boolean,
  canal: 'app' | 'email' | 'push',
  frecuencia: 'instant' | 'daily_digest' | 'weekly_digest'
}
```

### 3. Agrupación de Notificaciones
```typescript
// En lugar de 5 notificaciones separadas:
"Cliente A subió documento X"
"Cliente A subió documento Y"
"Cliente A subió documento Z"

// Agrupar en:
"Cliente A subió 3 nuevos documentos"
```

### 4. Acciones Directas
```typescript
// Botones en la notificación para acciones rápidas
<Notificacion>
  <Texto>El presupuesto requiere tu aprobación</Texto>
  <Botones>
    <Aprobar />
    <Rechazar />
    <Ver />
  </Botones>
</Notificacion>
```

### 5. Email Digest
- Job diario que envía resumen de notificaciones no leídas
- Template de email con HTML
- Link directo al sistema

### 6. Filtros Avanzados
- Por tipo de notificación
- Por proyecto
- Por rango de fechas
- Por organismo

### 7. Archivado
- Archivar notificaciones antiguas
- No eliminar, mover a tabla `notificaciones_archived`
- Mantener tabla principal liviana

## Testing

### Crear Notificación de Prueba
```sql
INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, expediente_id, leida)
VALUES (
  'tu-usuario-id-uuid',
  'DOCUMENTO_REQUERIDO',
  'Notificación de Prueba',
  'Este es un mensaje de prueba para verificar el sistema de notificaciones.',
  NULL,
  false
);
```

### Simular Varias Notificaciones
```sql
-- Crear 10 notificaciones de prueba
INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, leida, created_at)
SELECT
  'tu-usuario-id-uuid',
  (ARRAY['VENCIMIENTO_PROXIMO', 'DOCUMENTO_REQUERIDO', 'ESTADO_CAMBIO'])[floor(random() * 3 + 1)],
  'Notificación ' || generate_series,
  'Mensaje de prueba número ' || generate_series,
  random() > 0.5,
  now() - (generate_series || ' hours')::interval
FROM generate_series(1, 10);
```

## Troubleshooting

### Badge no se actualiza
**Causa:** Subscription no está funcionando o no hay permisos
**Solución:** Verificar RLS policies y que Realtime está habilitado en Supabase

### Notificaciones no aparecen
**Causa:** Filtro por usuario_id no encuentra el usuario
**Solución:** Verificar que `usuario_id` en notificaciones coincide con el usuario actual

### Performance lenta
**Causa:** Muchas notificaciones sin índices
**Solución:** Aplicar índices en usuario_id, leida, created_at

## Conclusión

El Centro de Notificaciones mantiene a todos los usuarios informados sobre eventos críticos en el sistema, mejorando la comunicación y reduciendo la necesidad de revisar manualmente cada proyecto. Con actualizaciones en tiempo real y una interfaz intuitiva, es una herramienta esencial para la eficiencia operativa.

**Estado:** ✅ Completamente implementado y probado
**Versión:** 1.0
**Última actualización:** 2025-01-04
