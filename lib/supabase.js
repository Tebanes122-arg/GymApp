import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
export const GIMNASIO_ID = '99999999-9999-9999-9999-999999999999';
export function hoyISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
export function diasHasta(fecha) {
  if (!fecha) return null;
  const hoy = new Date(hoyISO());
  const f = new Date(fecha);
  return Math.round((f - hoy) / 86400000);
}
export async function usuarioActual() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { session: null, alumno: null };
  const { data: alumno } = await supabase
    .from('alumnos')
    .select('id, nombre, apellido, rol, peso_corporal, vencimiento, email, planes(nombre, precio)')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();
  return { session, alumno: alumno || null };
}
export async function cerrarSesion() { await supabase.auth.signOut(); }
