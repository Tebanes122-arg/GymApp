import { useEffect, useState } from 'react';

// ============================================================
// Banner de instalación de la PWA
// Aparece solo cuando el navegador permite instalar la app.
// El usuario toca "Instalar" sin tener que buscar en menús.
// Para iPhone (que no soporta instalación automática) muestra
// una instrucción breve de cómo agregarla desde Safari.
// ============================================================

export default function InstalarApp() {
  const [evento, setEvento] = useState(null);   // evento de instalación de Chrome/Android
  const [visible, setVisible] = useState(false);
  const [esIOS, setEsIOS] = useState(false);
  const [mostrarIOS, setMostrarIOS] = useState(false);

  useEffect(() => {
    // ¿ya está instalada? entonces no mostramos nada
    const yaInstalada =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (yaInstalada) return;

    // ¿el usuario ya cerró el banner antes? respetamos su decisión por un tiempo
    const cerrado = localStorage.getItem('tf_instalar_cerrado');
    if (cerrado && Date.now() - Number(cerrado) < 7 * 86400000) return;

    // detectar iPhone / iPad (Safari no dispara el evento automático)
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setEsIOS(ios);
    if (ios) {
      setMostrarIOS(true);
      return;
    }

    // Android / Chrome de escritorio: capturamos el evento de instalación
    function onPrompt(e) {
      e.preventDefault();
      setEvento(e);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  async function instalar() {
    if (!evento) return;
    evento.prompt();
    await evento.userChoice;
    setVisible(false);
    setEvento(null);
  }

  function cerrar() {
    setVisible(false);
    setMostrarIOS(false);
    try { localStorage.setItem('tf_instalar_cerrado', String(Date.now())); } catch (e) {}
  }

  if (!visible && !mostrarIOS) return null;

  return (
    <div className="instalar-banner">
      <div className="instalar-icono">GA</div>
      <div className="instalar-texto">
        <div className="instalar-titulo">Instalá GymApp en tu celular</div>
        {esIOS ? (
          <div className="instalar-sub">Tocá Compartir ⬆️ y después "Agregar a inicio"</div>
        ) : (
          <div className="instalar-sub">Acceso directo en tu pantalla, como una app</div>
        )}
      </div>
      {!esIOS && (
        <button className="instalar-btn" onClick={instalar}>Instalar</button>
      )}
      <button className="instalar-cerrar" onClick={cerrar} aria-label="Cerrar">✕</button>
    </div>
  );
}
