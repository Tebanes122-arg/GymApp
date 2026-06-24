import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase, GIMNASIO_ID, hoyISO, usuarioActual, cerrarSesion } from '../lib/supabase';

// ============================================================
// ASISTENCIAS — pantalla del dueño
// Tabla de presentes con nombre y hora, selector de día,
// y resumen de horas pico. Solo dueño/admin.
// ============================================================

function iniciales(n, a) {
  return ((n?.[0] || '') + (a?.[0] || '')).toUpperCase();
}
function horaLinda(h) {
  if (!h) return '—';
  return h.slice(0, 5); // "08:15:00" -> "08:15"
}
function fechaLarga(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export default function Asistencias() {
  const router = useRouter();
  const [estado, setEstado] = useState('cargando'); // cargando | sinpermiso | ok
  const [dia, setDia] = useState(hoyISO());
  const [presentes, setPresentes] = useState([]);
  const [cargandoDia, setCargandoDia] = useState(false);

  async function verificar() {
    const { session, alumno: yo } = await usuarioActual();
    if (!session) { router.replace('/login'); return; }
    if (yo?.rol !== 'dueno' && yo?.rol !== 'admin') { setEstado('sinpermiso'); return; }
    setEstado('ok');
  }

  async function cargarDia(fecha) {
    setCargandoDia(true);
    const { data } = await supabase
      .from('asistencias')
      .select('hora, alumnos(nombre, apellido, vencimiento)')
      .eq('gimnasio_id', GIMNASIO_ID)
      .eq('fecha', fecha)
      .order('hora', { ascending: true });
    setPresentes(data || []);
    setCargandoDia(false);
  }

  useEffect(() => { verificar(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (estado === 'ok') cargarDia(dia); /* eslint-disable-next-line */ }, [estado, dia]);

  if (estado === 'cargando') {
    return (
      <div className="shell">
        <div className="topbar"><Link href="/" className="logo">Gym<span>App</span></Link></div>
        <p className="subtitulo">Cargando...</p>
      </div>
    );
  }
  if (estado === 'sinpermiso') {
    return (
      <div className="shell">
        <div className="topbar">
          <Link href="/" className="logo">Gym<span>App</span></Link>
          <button className="btn-salir" onClick={async () => { await cerrarSesion(); router.push('/login'); }}>Salir</button>
        </div>
        <div className="seccion" style={{ textAlign: 'center', paddingTop: 40 }}>
          <div className="eyebrow">Acceso restringido</div>
          <h1 className="titulo">Solo para el dueño 🔒</h1>
        </div>
      </div>
    );
  }

  // ---------- cálculo de horas pico (por franja horaria) ----------
  const franjas = {};
  presentes.forEach((p) => {
    if (!p.hora) return;
    const h = parseInt(p.hora.slice(0, 2), 10);
    franjas[h] = (franjas[h] || 0) + 1;
  });
  const franjasOrden = Object.entries(franjas).sort((a, b) => b[1] - a[1]);
  const picoMax = franjasOrden.length ? franjasOrden[0] : null;
  const maxCant = picoMax ? picoMax[1] : 0;

  return (
    <div className="shell">
      <div className="topbar">
        <Link href="/" className="logo">Gym<span>App</span></Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/admin" className="btn-salir">← Panel</Link>
          <button className="btn-salir" onClick={async () => { await cerrarSesion(); router.push('/login'); }}>Salir</button>
        </div>
      </div>

      <div>
        <div className="eyebrow">Asistencias</div>
        <h1 className="titulo">Quién vino</h1>
        <p className="subtitulo" style={{ textTransform: 'capitalize' }}>{fechaLarga(dia)}</p>
      </div>

      {/* selector de día */}
      <div className="seccion">
        <label className="ficha-sub" style={{ marginTop: 0 }}>Elegí el día</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="input-login" type="date" value={dia} max={hoyISO()} onChange={(e) => setDia(e.target.value)} style={{ flex: 1 }} />
          <button className="btn-mini" onClick={() => setDia(hoyISO())}>Hoy</button>
        </div>
      </div>

      {/* resumen */}
      <div className="seccion">
        <div className="dueno-mock" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="kpi kpi-verde">
            <div className="kpi-label">Presentes</div>
            <div className="kpi-valor">{presentes.length}</div>
            <div className="kpi-extra">{presentes.length === 1 ? 'persona' : 'personas'} este día</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Hora pico</div>
            <div className="kpi-valor">{picoMax ? `${picoMax[0]}h` : '—'}</div>
            <div className="kpi-extra">{picoMax ? `${maxCant} ${maxCant === 1 ? 'persona' : 'personas'}` : 'sin datos'}</div>
          </div>
        </div>
      </div>

      {/* franjas horarias (mini gráfico de barras) */}
      {franjasOrden.length > 0 && (
        <div className="seccion">
          <div className="ficha-sub">Movimiento por hora</div>
          <div className="barras-horas">
            {Object.keys(franjas).sort((a, b) => a - b).map((h) => {
              const cant = franjas[h];
              const alto = Math.round((cant / maxCant) * 100);
              return (
                <div className="barra-col" key={h}>
                  <div className="barra-valor">{cant}</div>
                  <div className="barra" style={{ height: Math.max(alto, 8) + '%' }}></div>
                  <div className="barra-hora">{h}h</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* tabla de presentes */}
      <div className="seccion">
        <div className="ficha-sub">Detalle de entradas</div>
        {cargandoDia ? (
          <p className="subtitulo">Cargando...</p>
        ) : presentes.length === 0 ? (
          <p className="subtitulo">Nadie marcó presente este día.</p>
        ) : (
          <div className="lista">
            {presentes.map((p, i) => {
              const al = p.alumnos;
              if (!al) return null;
              const venc = al.vencimiento ? new Date(al.vencimiento + 'T12:00:00') : null;
              const hoy = new Date(hoyISO() + 'T12:00:00');
              const debe = !venc || venc < hoy;
              return (
                <div className="fila" key={i}>
                  <div className="avatar">{iniciales(al.nombre, al.apellido)}</div>
                  <div className="fila-info">
                    <div className="fila-nombre">{al.nombre} {al.apellido}</div>
                    <div className="fila-detalle">Entró {horaLinda(p.hora)}{debe && <span style={{ color: 'var(--rojo)' }}> · debía cuota</span>}</div>
                  </div>
                  <span className="hora-chip">{horaLinda(p.hora)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
