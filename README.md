# TEC Empleos - Platform Frontend

Plataforma institucional de oportunidades laborales para el Instituto Tecnológico de Costa Rica.

## Descripción

Sistema web que conecta estudiantes, graduados y empresas para oportunidades de:
- Prácticas profesionales
- Proyectos de graduación
- Empleos

## Roles de Usuario

### Estudiantes/Graduados
- Explorar oportunidades con filtros avanzados
- Guardar favoritos
- Ver detalles completos de oportunidades
- Aplicar a oportunidades

### Empresas
- Crear y publicar oportunidades
- Gestionar oportunidades propias
- Editar o desactivar publicaciones
- Ver estadísticas de visualizaciones

### Administradores
- Aprobar/rechazar registros de empresas
- Aprobar/rechazar oportunidades publicadas
- Ver estadísticas de la plataforma
- Supervisar calidad del contenido

## Arquitectura

### Frontend (Presentación)
- **Next.js 16** con App Router
- **React 19** con Server Components
- **TypeScript** para type safety
- **Tailwind CSS v4** para estilos
- **shadcn/ui** componentes reutilizables

### Estructura de Carpetas

```
app/
├── (auth)/
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── dashboard/
│   ├── student/
│   ├── graduate/
│   ├── company/
│   └── admin/
├── opportunities/
│   └── [id]/
└── api/
    ├── auth/
    ├── opportunities/
    ├── company/
    └── admin/

components/
├── auth/          # Formularios de autenticación
├── shared/        # Componentes reutilizables
├── company/       # Componentes específicos de empresa
├── admin/         # Componentes de administración
└── ui/            # shadcn/ui components

lib/
├── types.ts       # TypeScript types
├── utils.ts       # Utilidades
└── mock-data.ts   # Datos de ejemplo
```

## API Endpoints

Todos los endpoints están bajo `/api/*` y actualmente retornan datos mock.

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/forgot-password` - Recuperar contraseña

### Oportunidades
- `GET /api/opportunities` - Listar oportunidades
- `GET /api/opportunities/[id]` - Detalle de oportunidad

### Empresa
- `GET /api/company/opportunities` - Oportunidades de la empresa
- `POST /api/company/opportunities` - Crear oportunidad
- `PUT /api/company/opportunities/[id]` - Actualizar oportunidad
- `DELETE /api/company/opportunities/[id]` - Eliminar oportunidad

### Administración
- `GET /api/admin/stats` - Estadísticas generales
- `GET /api/admin/companies/pending` - Empresas pendientes
- `POST /api/admin/companies/[id]/approve` - Aprobar empresa
- `POST /api/admin/companies/[id]/reject` - Rechazar empresa
- `GET /api/admin/opportunities/pending` - Oportunidades pendientes
- `POST /api/admin/opportunities/[id]/approve` - Aprobar oportunidad
- `POST /api/admin/opportunities/[id]/reject` - Rechazar oportunidad

## Características Implementadas

### Autenticación
- ✅ Página de login con validación
- ✅ Registro con selección de rol
- ✅ Recuperación de contraseña
- ✅ Redirección basada en rol

### Dashboards
- ✅ Dashboard de estudiante con filtros
- ✅ Dashboard de graduado
- ✅ Dashboard de empresa
- ✅ Dashboard de administrador

### Gestión de Oportunidades
- ✅ Listado público de oportunidades
- ✅ Vista detallada de oportunidad
- ✅ Filtros por tipo, ubicación y búsqueda
- ✅ Sistema de favoritos
- ✅ Paginación

### Empresa
- ✅ Crear nueva oportunidad
- ✅ Editar oportunidades existentes
- ✅ Gestionar estado (activo/inactivo)
- ✅ Ver estadísticas

### Administración
- ✅ Aprobar/rechazar empresas
- ✅ Aprobar/rechazar oportunidades
- ✅ Estadísticas de la plataforma
- ✅ Tablas de gestión con acciones

## Componentes Reutilizables

### Componentes Compartidos
- `OpportunityCard` - Tarjeta de oportunidad
- `OpportunityFilters` - Filtros de búsqueda
- `DashboardHeader` - Header de dashboards
- `StatsCard` - Tarjeta de estadísticas
- `Pagination` - Paginación
- `LoadingState` - Estado de carga
- `EmptyState` - Estado vacío

## Próximos Pasos (Backend)

Para conectar con un backend real:

1. **Autenticación**: Implementar Supabase Auth o sistema custom
2. **Base de Datos**: Conectar a PostgreSQL (Supabase/Neon) o similar
3. **API Routes**: Reemplazar mock data con queries reales
4. **Validación**: Agregar validación de permisos y roles
5. **Storage**: Implementar upload de archivos (logos, CVs)
6. **Emails**: Sistema de notificaciones por email

## Variables de Entorno Necesarias

```env
# Database
DATABASE_URL=

# Auth (si se usa Supabase)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email (opcional)
EMAIL_SERVER=
EMAIL_FROM=
```

## Desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Notas Importantes

- Todos los API endpoints son placeholder y requieren implementación backend
- La autenticación es simulada y debe conectarse a un sistema real
- Los datos mostrados son mock data para demostración
- Se debe implementar Row Level Security en la base de datos
- Validar permisos en el backend, no solo en el frontend
