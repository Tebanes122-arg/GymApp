-- ============================================================
-- GYMAPP — Base de datos completa (demo de ventas)
-- Ejecutar TODO de una vez en el SQL Editor del Supabase NUEVO.
-- Monta: esquema + seguridad + funciones + datos ficticios.
-- GIMNASIO_ID de la demo: 99999999-9999-9999-9999-999999999999
-- ============================================================

-- ============ 1. ESQUEMA ============
create table gimnasios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, instagram text, telefono text, direccion text,
  creado_en timestamptz not null default now()
);
create table planes (
  id uuid primary key default gen_random_uuid(),
  gimnasio_id uuid not null references gimnasios(id),
  nombre text not null, dias_por_semana int not null,
  precio numeric not null, precio_transferencia numeric,
  activo boolean not null default true, creado_en timestamptz not null default now()
);
create table alumnos (
  id uuid primary key default gen_random_uuid(),
  gimnasio_id uuid not null references gimnasios(id),
  plan_id uuid references planes(id),
  nombre text not null, apellido text not null,
  dni text, telefono text, email text, instagram text,
  fecha_nacimiento date, peso_corporal numeric, vencimiento date,
  activo boolean not null default true, rol text not null default 'alumno',
  auth_user_id uuid unique, creado_en timestamptz not null default now()
);
create table pagos (
  id uuid primary key default gen_random_uuid(),
  gimnasio_id uuid not null references gimnasios(id),
  alumno_id uuid not null references alumnos(id),
  monto numeric not null, fecha_pago date not null default current_date,
  vencimiento date not null, metodo text default 'efectivo',
  creado_en timestamptz not null default now()
);
create table asistencias (
  id uuid primary key default gen_random_uuid(),
  gimnasio_id uuid not null references gimnasios(id),
  alumno_id uuid not null references alumnos(id),
  fecha date not null default current_date,
  hora time default localtime,
  creado_en timestamptz not null default now(),
  unique (alumno_id, fecha)
);
create table ejercicios (
  id uuid primary key default gen_random_uuid(),
  gimnasio_id uuid references gimnasios(id),
  nombre text not null, grupo_muscular text,
  musculos text, descripcion text, consejos text, video_url text,
  creado_en timestamptz not null default now()
);
create table rutinas (
  id uuid primary key default gen_random_uuid(),
  gimnasio_id uuid not null references gimnasios(id),
  alumno_id uuid references alumnos(id),
  nombre text not null, es_plantilla boolean not null default false,
  creado_en timestamptz not null default now()
);
create table rutina_ejercicios (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references rutinas(id) on delete cascade,
  ejercicio_id uuid not null references ejercicios(id),
  dia int not null, orden int not null default 1,
  series int not null default 4, repeticiones text not null default '10',
  creado_en timestamptz not null default now()
);
create table registros_peso (
  id uuid primary key default gen_random_uuid(),
  gimnasio_id uuid not null references gimnasios(id),
  alumno_id uuid not null references alumnos(id),
  ejercicio_id uuid not null references ejercicios(id),
  peso_kg numeric not null, fecha date not null default current_date,
  creado_en timestamptz not null default now()
);
create table solicitudes_registro (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique, email text not null,
  nombre text not null default '', apellido text not null default '',
  dni text not null default '', telefono text not null default '',
  estado text not null default 'pendiente', creado_en timestamptz not null default now()
);

create index idx_alumnos_gimnasio on alumnos(gimnasio_id);
create index idx_alumnos_vencimiento on alumnos(vencimiento);
create index idx_pagos_gimnasio_fecha on pagos(gimnasio_id, fecha_pago);
create index idx_asistencias_alumno_fecha on asistencias(alumno_id, fecha);
create index idx_asistencias_gimnasio_fecha on asistencias(gimnasio_id, fecha);
create index idx_registros_alumno_ejercicio on registros_peso(alumno_id, ejercicio_id, fecha);

-- ============ 2. RLS ============
alter table gimnasios enable row level security;
alter table planes enable row level security;
alter table alumnos enable row level security;
alter table pagos enable row level security;
alter table asistencias enable row level security;
alter table ejercicios enable row level security;
alter table rutinas enable row level security;
alter table rutina_ejercicios enable row level security;
alter table registros_peso enable row level security;
alter table solicitudes_registro enable row level security;

-- ============ 3. FUNCIONES DE IDENTIDAD ============
create or replace function public.mi_alumno_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from alumnos where auth_user_id = auth.uid() limit 1;
$$;
create or replace function public.soy_dueno() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from alumnos where auth_user_id = auth.uid()
    and rol in ('dueno','admin') and activo = true);
$$;
create or replace function public.soy_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from alumnos where auth_user_id = auth.uid()
    and rol in ('profesor','dueno','admin') and activo = true);
$$;
create or replace function public.cuota_bloqueada(p_alumno uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (vencimiento + 5) < current_date from alumnos where id = p_alumno), false);
$$;

-- ============ 4. TRIGGER DE REGISTRO ============
create or replace function public.crear_solicitud_registro() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into solicitudes_registro (auth_user_id, email, nombre, apellido, dni, telefono)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'nombre',''), coalesce(new.raw_user_meta_data->>'apellido',''),
    coalesce(new.raw_user_meta_data->>'dni',''), coalesce(new.raw_user_meta_data->>'telefono',''))
  on conflict (auth_user_id) do nothing;
  return new;
end; $$;
drop trigger if exists trg_solicitud_registro on auth.users;
create trigger trg_solicitud_registro after insert on auth.users
  for each row execute function public.crear_solicitud_registro();

-- ============ 5. POLÍTICAS ============
create policy gym_sel on gimnasios for select to authenticated using (true);
create policy gym_mod on gimnasios for all to authenticated using (soy_dueno()) with check (soy_dueno());
create policy planes_sel on planes for select to authenticated using (true);
create policy planes_mod on planes for all to authenticated using (soy_dueno()) with check (soy_dueno());
create policy ejer_sel on ejercicios for select to authenticated using (true);
create policy ejer_mod on ejercicios for all to authenticated using (soy_staff()) with check (soy_staff());
create policy alum_sel on alumnos for select to authenticated using (auth_user_id = auth.uid() or soy_staff());
create policy alum_ins on alumnos for insert to authenticated with check (soy_dueno());
create policy alum_upd on alumnos for update to authenticated using (soy_dueno()) with check (soy_dueno());
create policy alum_del on alumnos for delete to authenticated using (soy_dueno());
create policy pagos_sel on pagos for select to authenticated using (alumno_id = mi_alumno_id() or soy_dueno());
create policy pagos_mod on pagos for all to authenticated using (soy_dueno()) with check (soy_dueno());
create policy asis_sel on asistencias for select to authenticated using (alumno_id = mi_alumno_id() or soy_staff());
create policy asis_ins on asistencias for insert to authenticated
  with check (soy_staff() or (alumno_id = mi_alumno_id() and not cuota_bloqueada(mi_alumno_id())));
create policy asis_del on asistencias for delete to authenticated using (soy_dueno());
create policy reg_sel on registros_peso for select to authenticated using (alumno_id = mi_alumno_id() or soy_dueno());
create policy reg_ins on registros_peso for insert to authenticated
  with check (soy_staff() or (alumno_id = mi_alumno_id() and not cuota_bloqueada(mi_alumno_id())));
create policy reg_del on registros_peso for delete to authenticated using (alumno_id = mi_alumno_id() or soy_dueno());
create policy rut_sel on rutinas for select to authenticated
  using (alumno_id = mi_alumno_id() or es_plantilla = true or soy_staff());
create policy rut_ins on rutinas for insert to authenticated with check (alumno_id = mi_alumno_id() or soy_staff());
create policy rut_upd on rutinas for update to authenticated
  using (alumno_id = mi_alumno_id() or soy_staff()) with check (alumno_id = mi_alumno_id() or soy_staff());
create policy rut_del on rutinas for delete to authenticated using (alumno_id = mi_alumno_id() or soy_staff());
create policy rutej_sel on rutina_ejercicios for select to authenticated
  using (exists (select 1 from rutinas r where r.id = rutina_id
    and (r.alumno_id = mi_alumno_id() or r.es_plantilla = true or soy_staff())));
create policy rutej_mod on rutina_ejercicios for all to authenticated
  using (exists (select 1 from rutinas r where r.id = rutina_id
    and (soy_staff() or (r.alumno_id = mi_alumno_id() and not cuota_bloqueada(mi_alumno_id())))))
  with check (exists (select 1 from rutinas r where r.id = rutina_id
    and (soy_staff() or (r.alumno_id = mi_alumno_id() and not cuota_bloqueada(mi_alumno_id())))));
create policy sol_sel on solicitudes_registro for select to authenticated using (auth_user_id = auth.uid() or soy_dueno());
create policy sol_upd on solicitudes_registro for update to authenticated using (soy_dueno()) with check (soy_dueno());
create policy sol_del on solicitudes_registro for delete to authenticated using (soy_dueno());

-- ============ 6. FUNCIONES DE CHECK-IN (entrada por DNI sin login) ============
create or replace function public.checkin_buscar(p_dni text)
returns table (nombre text, al_dia boolean, encontrado boolean)
language plpgsql security definer set search_path = public as $$
declare v_alumno alumnos%rowtype;
begin
  select * into v_alumno from alumnos
  where dni = p_dni and gimnasio_id = '99999999-9999-9999-9999-999999999999' limit 1;
  if not found then return query select ''::text, false, false;
  else return query select (v_alumno.nombre || ' ' || v_alumno.apellido)::text,
    (v_alumno.activo and v_alumno.vencimiento is not null and v_alumno.vencimiento >= current_date), true;
  end if;
end; $$;
create or replace function public.checkin_marcar(p_dni text) returns void
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from alumnos
  where dni = p_dni and gimnasio_id = '99999999-9999-9999-9999-999999999999' limit 1;
  if v_id is not null then
    insert into asistencias (gimnasio_id, alumno_id, fecha, hora)
    values ('99999999-9999-9999-9999-999999999999', v_id,
      (now() at time zone 'America/Argentina/Buenos_Aires')::date,
      (now() at time zone 'America/Argentina/Buenos_Aires')::time)
    on conflict (alumno_id, fecha) do nothing;
  end if;
end; $$;
grant execute on function public.checkin_buscar(text) to anon;
grant execute on function public.checkin_marcar(text) to anon;

-- ============ 7. DATOS FICTICIOS ============
insert into gimnasios (id, nombre, instagram, direccion)
values ('99999999-9999-9999-9999-999999999999', 'GymApp', 'gymapp', 'Tu ciudad');

insert into planes (id, gimnasio_id, nombre, dias_por_semana, precio, precio_transferencia) values
('99999999-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', '5 días', 5, 35000, 36000),
('99999999-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999999', '3 días', 3, 30000, 31000),
('99999999-0000-0000-0000-000000000003', '99999999-9999-9999-9999-999999999999', 'Pase diario', 1, 8000, 8000);

insert into alumnos (gimnasio_id, plan_id, nombre, apellido, dni, telefono, peso_corporal, vencimiento, rol) values
('99999999-9999-9999-9999-999999999999','99999999-0000-0000-0000-000000000001','Martín','Gómez','30111222','3764111001',82.0,current_date+12,'alumno'),
('99999999-9999-9999-9999-999999999999','99999999-0000-0000-0000-000000000002','Lucía','Fernández','31222333','3764111002',64.5,current_date+8,'alumno'),
('99999999-9999-9999-9999-999999999999','99999999-0000-0000-0000-000000000001','Javier','Sosa','32333444','3764111003',90.2,current_date+2,'alumno'),
('99999999-9999-9999-9999-999999999999','99999999-0000-0000-0000-000000000001','Rodrigo','Acosta','33444555','3764111004',77.0,current_date-6,'alumno'),
('99999999-9999-9999-9999-999999999999','99999999-0000-0000-0000-000000000002','Mariana','López','34555666','3764111005',58.3,current_date-4,'alumno'),
('99999999-9999-9999-9999-999999999999','99999999-0000-0000-0000-000000000001','Diego','Ramírez','35666777','3764111006',85.1,current_date-12,'alumno'),
('99999999-9999-9999-9999-999999999999','99999999-0000-0000-0000-000000000002','Sofía','Benítez','36777888','3764111007',61.0,current_date+1,'alumno'),
('99999999-9999-9999-9999-999999999999','99999999-0000-0000-0000-000000000002','Nahuel','Ortiz','37888999','3764111008',73.4,current_date+18,'alumno'),
('99999999-9999-9999-9999-999999999999','99999999-0000-0000-0000-000000000001','Florencia','Vera','38999000','3764111009',55.8,current_date+25,'alumno'),
('99999999-9999-9999-9999-999999999999','99999999-0000-0000-0000-000000000001','Julián','Maidana','39000111','3764111010',79.9,current_date+22,'alumno'),
('99999999-9999-9999-9999-999999999999','99999999-0000-0000-0000-000000000002','Agustina','Núñez','40111222','3764111011',60.2,current_date+28,'alumno'),
('99999999-9999-9999-9999-999999999999','99999999-0000-0000-0000-000000000001','Pablo','Galarza','41222333','3764111012',88.0,current_date+5,'alumno');

insert into pagos (gimnasio_id, alumno_id, monto, fecha_pago, vencimiento)
select '99999999-9999-9999-9999-999999999999', a.id, 35000, current_date - 1, a.vencimiento
from alumnos a where a.vencimiento > current_date and a.gimnasio_id = '99999999-9999-9999-9999-999999999999';

insert into asistencias (gimnasio_id, alumno_id, fecha, hora)
select '99999999-9999-9999-9999-999999999999', a.id, current_date,
  (array['07:15','08:00','09:30','18:05','18:20','18:40','19:10','20:00']::time[])[(row_number() over ())::int % 8 + 1]
from alumnos a where a.gimnasio_id = '99999999-9999-9999-9999-999999999999' limit 8;

insert into ejercicios (id, gimnasio_id, nombre, grupo_muscular) values
('99999999-3333-0000-0000-000000000001', null, 'Press banca', 'pecho'),
('99999999-3333-0000-0000-000000000002', null, 'Press inclinado', 'pecho'),
('99999999-3333-0000-0000-000000000003', null, 'Jalón al pecho', 'espalda'),
('99999999-3333-0000-0000-000000000004', null, 'Remo con barra', 'espalda'),
('99999999-3333-0000-0000-000000000005', null, 'Sentadilla', 'piernas'),
('99999999-3333-0000-0000-000000000006', null, 'Prensa', 'piernas'),
('99999999-3333-0000-0000-000000000007', null, 'Press militar', 'hombros'),
('99999999-3333-0000-0000-000000000008', null, 'Curl con barra', 'bíceps'),
('99999999-3333-0000-0000-000000000009', null, 'Tríceps en polea', 'tríceps');

insert into registros_peso (gimnasio_id, alumno_id, ejercicio_id, peso_kg, fecha)
select '99999999-9999-9999-9999-999999999999',
  (select id from alumnos where dni = '30111222' and gimnasio_id = '99999999-9999-9999-9999-999999999999'),
  '99999999-3333-0000-0000-000000000001', kg, current_date - (interval '1 week' * sem)
from (values (50,8),(52,7),(52,6),(55,5),(57,4),(57,3),(60,2),(62,1)) as t(kg, sem);

-- ============================================================
-- LISTO. Después de correr esto:
-- 1) Registrate en la app (login → crear cuenta) con tu email.
-- 2) Confirmá el correo.
-- 3) Coroná tu cuenta como dueño de la demo:
--    insert into alumnos (gimnasio_id, nombre, apellido, rol, activo, auth_user_id, email)
--    values ('99999999-9999-9999-9999-999999999999','Dueño','GymApp','dueno',true,
--    (select id from auth.users where email = 'TU_EMAIL'),'TU_EMAIL');
-- ============================================================
