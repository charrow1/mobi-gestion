# Mobi Gestión

Sistema interno de seguimiento para locales, vendedores y proveedores.

---

## Stack
- **React + Vite** — frontend
- **Supabase** — base de datos + autenticación
- **Vercel** — hosting

---

## Paso a paso para publicar

### 1. Crear proyecto en Supabase
1. Ir a [supabase.com](https://supabase.com) → **New project**
2. Nombre: `mobi-gestion`
3. Elegir contraseña y región (South America si está disponible)
4. Esperar ~1 minuto hasta que termine

### 2. Crear las tablas
1. En Supabase → **SQL Editor** → **New query**
2. Pegar todo el contenido de `supabase-schema.sql`
3. Clic en **Run** → debería decir "Success"

### 3. Obtener las keys
1. Supabase → **Settings → API**
2. Copiar:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon / public key** → empieza con `eyJ...`

### 4. Configurar localmente
```bash
cp .env.example .env
```
Editar `.env`:
```
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu_key...
```

### 5. Probar localmente
```bash
npm install
npm run dev
```
Abrir `http://localhost:5173`

### 6. Subir a GitHub
```bash
git init
git add .
git commit -m "mobi gestion v1"
git remote add origin https://github.com/tu-usuario/mobi-gestion.git
git push -u origin main
```

### 7. Deployar en Vercel
1. [vercel.com](https://vercel.com) → **New Project** → importar el repo
2. En **Environment Variables** agregar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Deploy** → en ~2 minutos tenés la URL pública

### 8. Primer ingreso
1. Abrir la URL de Vercel
2. Crear cuenta con tu email
3. (Opcional) En Supabase → **Authentication → Providers → Email** → desactivar "Confirm email" para saltear la confirmación

---

## Funcionalidades
- ✅ Login con email y contraseña
- ✅ 5 locales con historial de temas
- ✅ Etiquetas por negocio (Motos, Hogar, Repuestos, Fuerza, Náutica)
- ✅ Etiquetas por tipo de tema (Stock, Ventas, RRHH, Precios, Marketing, Admin)
- ✅ Filtros por negocio y tipo en cada local
- ✅ Tareas con prioridad, fecha límite y comentarios
- ✅ Vendedores con historial de temas y tareas asignadas
- ✅ Proveedores con historial (reuniones + tareas), condiciones comerciales
- ✅ Filtro de proveedores por negocio
- ✅ Vista global de todas las tareas con badge de vencidas
- ✅ Alertas visuales de tareas vencidas
