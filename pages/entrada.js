import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================
// ESTACIÓN DE ENTRADA — check-in por DNI
// Pantalla para la computadora de la recepción. El alumno
// teclea su DNI y ve verde (puede pasar) o rojo (cuota vencida).
// Siempre registra la asistencia. Pensada para uso sin ayuda.
// Abrir en pantalla completa (F11) en la compu de la entrada.
// ============================================================

const RESET_MS = 6000; // tiempo que queda el resultado antes de volver al teclado

export default function Entrada() {
  const [dni, setDni] = useState('');
  const [resultado, setResultado] = useState(null); // { ok, nombre, detalle, estado }
  const [procesando, setProcesando] = useState(false);
  const [reloj, setReloj] = useState('');
  const timerRef = useRef(null);

  // reloj en pantalla
  useEffect(() => {
    const tick = () => {
      const ahora = new Date();
      setReloj(ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const i = setInterval(tick, 10000);
    return () => clearInterval(i);
  }, []);

  // soporte de teclado físico (numpad o lector) además de los botones
  useEffect(() => {
    function onKey(e) {
      if (resultado || procesando) return;
      if (e.key >= '0' && e.key <= '9') agregar(e.key);
      else if (e.key === 'Backspace') borrar();
      else if (e.key === 'Enter') confirmar();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line
  }, [dni, resultado, procesando]);

  function agregar(n) {
    if (dni.length >= 9) return;
    setDni(dni + n);
  }
  function borrar() {
    setDni(dni.slice(0, -1));
  }
  function limpiar() {
    setDni('');
  }

  function volverAlInicio() {
    clearTimeout(timerRef.current);
    setResultado(null);
    setDni('');
  }

  async function confirmar() {
    if (dni.length < 6 || procesando) return;
    setProcesando(true);

    // buscar al alumno por DNI (función segura: solo nombre + si está al día)
    const { data, error } = await supabase.rpc('checkin_buscar', { p_dni: dni });
    const info = Array.isArray(data) ? data[0] : data;

    if (error || !info || !info.encontrado) {
      setResultado({
        tipo: 'desconocido',
        nombre: 'DNI no encontrado',
        detalle: 'Verificá el número o acercate a recepción',
      });
      setProcesando(false);
      timerRef.current = setTimeout(volverAlInicio, RESET_MS);
      return;
    }

    // registrar la asistencia SIEMPRE (al día o vencida)
    await supabase.rpc('checkin_marcar', { p_dni: dni });

    setResultado({
      tipo: info.al_dia ? 'ok' : 'vencida',
      nombre: info.nombre,
      detalle: info.al_dia ? '¡Bienvenido! Buen entrenamiento 💪' : 'Tu cuota está vencida — pasá por recepción',
    });
    setProcesando(false);
    timerRef.current = setTimeout(volverAlInicio, RESET_MS);
  }

  // ---------- pantalla de resultado ----------
  if (resultado) {
    const clase =
      resultado.tipo === 'ok' ? 'res-ok' : resultado.tipo === 'vencida' ? 'res-vencida' : 'res-desconocido';
    return (
      <div className={'entrada-fondo ' + clase} onClick={volverAlInicio}>
        <div className="entrada-resultado">
          <div className="res-icono">
            {resultado.tipo === 'ok' ? '✓' : resultado.tipo === 'vencida' ? '!' : '?'}
          </div>
          <div className="res-nombre">{resultado.nombre}</div>
          <div className="res-detalle">{resultado.detalle}</div>
          <div className="res-toque">Tocá la pantalla para continuar</div>
        </div>
      </div>
    );
  }

  // ---------- teclado ----------
  return (
    <div className="entrada-fondo">
      <div className="entrada-header">
        <div className="entrada-logo">Gym<span>App</span></div>
        <div className="entrada-reloj">{reloj}</div>
      </div>

      <div className="entrada-centro">
        <div className="entrada-titulo">Ingresá tu DNI</div>
        <div className="entrada-display">
          {dni ? dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : <span className="display-vacio">— — —</span>}
        </div>

        <div className="teclado">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} className="tecla" onClick={() => agregar(String(n))}>{n}</button>
          ))}
          <button className="tecla tecla-accion" onClick={borrar}>←</button>
          <button className="tecla" onClick={() => agregar('0')}>0</button>
          <button
            className="tecla tecla-ok"
            onClick={confirmar}
            disabled={dni.length < 6 || procesando}
          >
            {procesando ? '...' : '✓'}
          </button>
        </div>

        {dni.length > 0 && (
          <button className="entrada-limpiar" onClick={limpiar}>Borrar todo</button>
        )}
      </div>

      <div className="entrada-pie">Marcá tu entrada para registrar tu asistencia</div>
    </div>
  );
}
