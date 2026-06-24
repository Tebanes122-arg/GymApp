import { useState, useEffect } from 'react';
import Link from 'next/link';

// ============================================================
// LANDING — GymApp (demo de ventas)
// Identidad propia: glassmorphism, azul nocturno + violeta/cian.
// Posicionamiento SaaS para gimnasios, no "un gimnasio".
// ============================================================

export default function Home() {
  const [scroll, setScroll] = useState(0);
  useEffect(() => {
    const onScroll = () => setScroll(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="ga-shell">
      {/* halos de fondo */}
      <div className="ga-halo ga-halo-1" />
      <div className="ga-halo ga-halo-2" />

      {/* NAV */}
      <nav className={'ga-nav' + (scroll > 30 ? ' ga-nav-solid' : '')}>
        <div className="ga-logo">Gym<span>App</span></div>
        <div className="ga-nav-links">
          <a href="#features">Funciones</a>
          <a href="#como">Cómo funciona</a>
          <Link href="/login" className="ga-nav-cta">Ingresar</Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="ga-hero">
        <div className="ga-badge">Sistema de gestión para gimnasios</div>
        <h1 className="ga-hero-title">
          Tu gimnasio,<br /><span className="ga-grad">bajo control total</span>
        </h1>
        <p className="ga-hero-sub">
          Cobros, asistencias por DNI, rutinas y alumnos — todo en un solo lugar.
          Menos planillas, más tiempo para entrenar a tu gente.
        </p>
        <div className="ga-hero-cta">
          <Link href="/login" className="ga-btn ga-btn-primary">Ver demo en vivo</Link>
          <a href="#features" className="ga-btn ga-btn-ghost">Conocer más</a>
        </div>

        {/* mockup dashboard de vidrio */}
        <div className="ga-mockup">
          <div className="ga-glass ga-mockup-card">
            <div className="ga-mockup-top">
              <span className="ga-dot" /><span className="ga-dot" /><span className="ga-dot" />
              <span className="ga-mockup-url">app · panel del dueño</span>
            </div>
            <div className="ga-mockup-body">
              <div className="ga-kpi-row">
                <div className="ga-kpi">
                  <div className="ga-kpi-label">Ingresos del mes</div>
                  <div className="ga-kpi-val">$2.870.000</div>
                  <div className="ga-kpi-up">↑ 82 cuotas cobradas</div>
                </div>
                <div className="ga-kpi">
                  <div className="ga-kpi-label">Por cobrar</div>
                  <div className="ga-kpi-val ga-kpi-alert">$175.000</div>
                  <div className="ga-kpi-down">5 cuotas vencidas</div>
                </div>
                <div className="ga-kpi">
                  <div className="ga-kpi-label">Presentes hoy</div>
                  <div className="ga-kpi-val">47</div>
                  <div className="ga-kpi-up">pico 19h</div>
                </div>
              </div>
              <div className="ga-bars">
                {[40, 55, 35, 70, 90, 60, 80, 100, 75, 50].map((h, i) => (
                  <div key={i} className="ga-bar" style={{ height: h + '%' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* FEATURES */}
      <section className="ga-section" id="features">
        <div className="ga-section-head">
          <div className="ga-eyebrow">Todo incluido</div>
          <h2 className="ga-h2">Una plataforma, todo el gimnasio</h2>
        </div>
        <div className="ga-grid">
          {[
            { t: 'Entrada por DNI', d: 'El alumno teclea su documento y entra. Verde si está al día, rojo si debe. Queda registrado con hora exacta.', i: 'M3 10h18M7 15h2m4 0h4' },
            { t: 'Cobros inteligentes', d: 'Registrá un pago y el vencimiento se calcula solo. El moroso se bloquea hasta regularizar, sin que persigas a nadie.', i: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
            { t: 'Rutinas y profesores', d: 'El profe arma plantillas y las asigna en un toque. Cada alumno ve su rutina del día con cómo hacer cada ejercicio.', i: 'M6.5 6.5h11v11h-11zM2 9v6m20-6v6' },
            { t: 'Control de presentes', d: 'Mirá quién entró, a qué hora, y descubrí tus horas pico de la semana para organizar mejor el gimnasio.', i: 'M3 3v18h18M7 14l4-4 3 3 5-6' },
            { t: 'App instalable', d: 'Tus alumnos instalan la app en el celular. Su rutina, su progreso y su cuota siempre a mano.', i: 'M7 2h10v20H7zM11 18h2' },
            { t: 'Roles separados', d: 'El dueño ve la plata, el profe ve los alumnos, el alumno ve lo suyo. Cada uno accede solo a lo que le corresponde.', i: 'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 20a6 6 0 0 1 12 0M16 4a4 4 0 0 1 0 8' },
          ].map((f, i) => (
            <div className="ga-glass ga-feature" key={i}>
              <div className="ga-feature-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={f.i} /></svg>
              </div>
              <h3 className="ga-feature-t">{f.t}</h3>
              <p className="ga-feature-d">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="ga-section" id="como">
        <div className="ga-section-head">
          <div className="ga-eyebrow">Simple de verdad</div>
          <h2 className="ga-h2">Funcionando en un día</h2>
        </div>
        <div className="ga-steps">
          <div className="ga-glass ga-step">
            <div className="ga-step-n">01</div>
            <h3 className="ga-step-t">Cargás tus alumnos</h3>
            <p className="ga-step-d">Nombre, DNI, plan y vencimiento. En minutos tenés todo el gimnasio en el sistema.</p>
          </div>
          <div className="ga-glass ga-step">
            <div className="ga-step-n">02</div>
            <h3 className="ga-step-t">Ponés la pantalla de entrada</h3>
            <p className="ga-step-d">Una computadora en la recepción con el check-in por DNI. Sin instalar nada.</p>
          </div>
          <div className="ga-glass ga-step">
            <div className="ga-step-n">03</div>
            <h3 className="ga-step-t">El sistema trabaja solo</h3>
            <p className="ga-step-d">Cobra, bloquea morosos, registra asistencias y te muestra todo en tiempo real.</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="ga-cta-final">
        <div className="ga-glass ga-cta-box">
          <h2 className="ga-h2">¿Querés verlo con los datos de tu gimnasio?</h2>
          <p className="ga-hero-sub">Te lo mostramos funcionando, sin compromiso.</p>
          <Link href="/login" className="ga-btn ga-btn-primary">Ver la demo en vivo</Link>
        </div>
      </section>

      <footer className="ga-footer">
        <div className="ga-logo">Gym<span>App</span></div>
        <p>Sistema de gestión para gimnasios · Hecho en Argentina</p>
      </footer>
    </div>
  );
}
