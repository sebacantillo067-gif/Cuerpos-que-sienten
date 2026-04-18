// ══════════════════════════════════════════════
//  ESTADO GLOBAL
// ══════════════════════════════════════════════
const estado = {
  moduloActual: 0,
  emocionSeleccionada: '',
  textoEmocion: '',
  coreografia: [],
  ritmo: 2,
  reflexion: '',
  emocionPost: '',
  analisisEmocion: '',
  analisisReflexion: '',
  consejoMusical: ''
};

const DATOS_RITMO = {
  1: { bpm: 60,  energia: 'Suave',  ambiente: 'Íntimo y reflexivo',   label: '🐢 Lento',  icon: '🐢', volumen: 0.5 },
  2: { bpm: 90,  energia: 'Media',  ambiente: 'Festivo y alegre',     label: '⚡ Medio',  icon: '⚡', volumen: 0.7 },
  3: { bpm: 130, energia: 'Alta',   ambiente: 'Eufórico y vibrante',  label: '🔥 Rápido', icon: '🔥', volumen: 0.9 }
};

// ══════════════════════════════════════════════
//  SISTEMA DE AUDIO (Web Audio API + oscillators)
// ══════════════════════════════════════════════
let audioCtx = null;
let gainNode = null;
let rhythmInterval = null;
let ritmoActivo = false;
let currentVolume = 0.7;

// Canciones por ritmo (URLs de audio libre o síntesis)
const PLAYLISTS = {
  1: [
    { title: '🌿 Brisa de Palma',       sub: 'Cumbia lenta · 60 BPM' },
    { title: '🌙 Luna del Caribe',       sub: 'Ritmo suave · 60 BPM' },
    { title: '🍃 Viento del Magdalena',  sub: 'Intimista · 60 BPM' }
  ],
  2: [
    { title: '⚡ La Cumbia del Corazón', sub: 'Cumbia festiva · 90 BPM' },
    { title: '🥁 Tambores de Barranquilla', sub: 'Clásica · 90 BPM' },
    { title: '🎺 Cielito Cumbiero',      sub: 'Alegre · 90 BPM' }
  ],
  3: [
    { title: '🔥 Fiesta Total',          sub: 'Cumbia eufórica · 130 BPM' },
    { title: '💥 El Porro Explosivo',    sub: 'Energético · 130 BPM' },
    { title: '🎉 Tumbao Caribeño',       sub: 'Alta energía · 130 BPM' }
  ]
};

let currentTrackIndex = 0;
let trackRotationInterval = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = currentVolume;
    gainNode.connect(audioCtx.destination);
  }
  return audioCtx;
}

// Genera un patrón de cumbia sintético usando Web Audio API
function startCumbiaRhythm(bpm) {
  const ctx = getAudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const interval = (60 / bpm) * 1000 * 0.5; // Corcheas

  const patterns = {
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    hi:    [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    bass:  [1,0,0,1, 0,1,0,0, 1,0,0,1, 0,0,1,0]
  };

  let step = 0;
  rhythmInterval = setInterval(() => {
    const t = ctx.currentTime;

    if (patterns.kick[step % 16]) {
      playTone(ctx, 'sine', 80, 0.25, 0.15, gainNode);
    }
    if (patterns.snare[step % 16]) {
      playNoise(ctx, 0.08, 0.1, gainNode);
    }
    if (patterns.hi[step % 16]) {
      playTone(ctx, 'square', 800 + Math.random()*200, 0.04, 0.05, gainNode);
    }
    if (patterns.bass[step % 16]) {
      playTone(ctx, 'triangle', 120, 0.15, 0.12, gainNode);
    }

    step = (step + 1) % 16;
  }, interval);
}

function playTone(ctx, type, freq, vol, dur, dest) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

function playNoise(ctx, vol, dur, dest) {
  const bufferSize = ctx.sampleRate * dur;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.connect(g);
  g.connect(dest);
  src.start();
}

function stopRhythm() {
  if (rhythmInterval) { clearInterval(rhythmInterval); rhythmInterval = null; }
}

function toggleRitmo() {
  if (ritmoActivo) {
    // Pausar
    stopRhythm();
    document.getElementById('btn-play').textContent = '▶';
    document.getElementById('music-thumb').classList.remove('spinning');
    document.querySelectorAll('.barra-ritmo').forEach(b => b.classList.remove('activa'));
    ritmoActivo = false;
    if (trackRotationInterval) { clearInterval(trackRotationInterval); trackRotationInterval = null; }
    mostrarToast('⏸ Música pausada', 'info');
  } else {
    // Reproducir
    const bpm = DATOS_RITMO[estado.ritmo].bpm;
    startCumbiaRhythm(bpm);
    document.getElementById('btn-play').textContent = '⏸';
    document.getElementById('music-thumb').classList.add('spinning');
    document.querySelectorAll('.barra-ritmo').forEach(b => b.classList.add('activa'));
    ritmoActivo = true;
    // Rotar canciones cada 20s
    startTrackRotation();
    mostrarToast('🎵 ¡Música iniciada!', 'exito');
  }
}

function startTrackRotation() {
  updateTrackDisplay();
  trackRotationInterval = setInterval(() => {
    currentTrackIndex = (currentTrackIndex + 1) % PLAYLISTS[estado.ritmo].length;
    updateTrackDisplay();
    mostrarToast('🎵 Siguiente canción', 'info');
  }, 20000);
}

function updateTrackDisplay() {
  const track = PLAYLISTS[estado.ritmo][currentTrackIndex];
  document.getElementById('music-title').textContent = track.title;
  document.getElementById('music-sub').textContent = track.sub;
}

function musicAnterior() {
  currentTrackIndex = (currentTrackIndex - 1 + PLAYLISTS[estado.ritmo].length) % PLAYLISTS[estado.ritmo].length;
  updateTrackDisplay();
  if (ritmoActivo) mostrarToast('⏮ ' + PLAYLISTS[estado.ritmo][currentTrackIndex].title, 'info');
}

function musicSiguiente() {
  currentTrackIndex = (currentTrackIndex + 1) % PLAYLISTS[estado.ritmo].length;
  updateTrackDisplay();
  if (ritmoActivo) mostrarToast('⏭ ' + PLAYLISTS[estado.ritmo][currentTrackIndex].title, 'info');
}

function ajustarVolumen(val) {
  currentVolume = val / 100;
  if (gainNode) {
    gainNode.gain.setTargetAtTime(currentVolume, getAudioCtx().currentTime, 0.1);
  }
}

// ══════════════════════════════════════════════
//  VISUALIZADOR BARRAS
// ══════════════════════════════════════════════
function inicializarVisualizador() {
  const cont = document.getElementById('viz-ritmo');
  cont.innerHTML = '';
  const bpm = DATOS_RITMO[estado.ritmo].bpm;
  const count = 18;
  for (let i = 0; i < count; i++) {
    const b = document.createElement('div');
    b.className = 'barra-ritmo';
    const dur = (60 / bpm * (0.4 + Math.random() * 0.6)).toFixed(2);
    const delay = (Math.random() * -1).toFixed(2);
    b.style.cssText = `--duracion:${dur}s; animation-delay:${delay}s; height:${10 + Math.random()*60}%;`;
    cont.appendChild(b);
  }
}

function seleccionarRitmoCard(num) {
  estado.ritmo = num;
  // Actualizar visual cards
  [1,2,3].forEach(i => {
    const c = document.getElementById(`rc-${i}`);
    if (c) c.classList.toggle('activo', i === num);
  });
  // Reiniciar si estaba activo
  if (ritmoActivo) {
    stopRhythm();
    const bpm = DATOS_RITMO[num].bpm;
    startCumbiaRhythm(bpm);
  }
  // Actualizar volumen por emoción
  const baseVol = DATOS_RITMO[num].volumen;
  if (gainNode) gainNode.gain.setTargetAtTime(baseVol, getAudioCtx().currentTime, 0.3);
  document.getElementById('vol-slider').value = Math.round(baseVol * 100);

  currentTrackIndex = 0;
  inicializarVisualizador();
  updateTrackDisplay();
  mostrarToast(`${DATOS_RITMO[num].icon} ${DATOS_RITMO[num].label} seleccionado`, 'exito');
}

// ══════════════════════════════════════════════
//  NAVEGACIÓN
// ══════════════════════════════════════════════
function iniciarExperiencia() {
  document.getElementById('inicio').classList.remove('activa');
  document.getElementById('modulos').classList.add('activa');
  irA(1);
}

function irA(num) {
  for (let i = 1; i <= 6; i++) {
    const m = document.getElementById(`m${i}`);
    if (m) m.classList.add('oculto');
    const nav = document.getElementById(`nav-${i}`);
    if (nav) nav.classList.remove('activo');
  }
  const modulo = document.getElementById(`m${num}`);
  if (modulo) {
    modulo.classList.remove('oculto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const navBtn = document.getElementById(`nav-${num}`);
  if (navBtn) navBtn.classList.add('activo');
  document.getElementById('progreso-fill').style.width = Math.round((num / 6) * 100) + '%';
  estado.moduloActual = num;
  if (num === 6) construirResumen();
}

function marcarCompletado(num) {
  const nav = document.getElementById(`nav-${num}`);
  if (nav) { nav.classList.remove('activo'); nav.classList.add('completado'); }
}

// ══════════════════════════════════════════════
//  LLAMADA A LA IA (Claude API)
// ══════════════════════════════════════════════
async function llamarIA(prompt) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    if (data.content && data.content[0]) return data.content[0].text;
    return null;
  } catch (e) {
    return null;
  }
}

// ══════════════════════════════════════════════
//  MÓDULO 1: ANÁLISIS DE EMOCIÓN
// ══════════════════════════════════════════════
function seleccionarEmocion(btn, emocion) {
  document.querySelectorAll('#emociones-rapidas .emoji-btn').forEach(b => b.classList.remove('seleccionado'));
  btn.classList.add('seleccionado');
  estado.emocionSeleccionada = emocion;
  const ta = document.getElementById('texto-emocion');
  if (!ta.value) ta.value = `Hoy me siento con mucha ${emocion}.`;
}

async function analizarEmocion() {
  const texto = document.getElementById('texto-emocion').value.trim();
  if (!texto && !estado.emocionSeleccionada) {
    mostrarToast('Escribe algo sobre cómo te sientes 💬', 'info'); return;
  }
  estado.textoEmocion = texto || `Emoción: ${estado.emocionSeleccionada}`;
  mostrarLoader('loader-m1', true);
  document.getElementById('resultado-m1').classList.add('oculto');
  document.getElementById('btn-analizar').disabled = true;

  const prompt = `Eres un guía de danzaterapia especializado en cumbia colombiana y expresión emocional juvenil.
El estudiante describe cómo se siente: "${estado.textoEmocion}"
Emoción seleccionada: ${estado.emocionSeleccionada || 'No especificada'}

Responde en ESPAÑOL con un análisis cálido y motivador (máximo 130 palabras):
1. **🎭 Emoción detectada**: nombre y descripción breve
2. **💃 Conexión con la danza**: cómo esta emoción se expresa en la cumbia
3. **🌟 Fortaleza**: qué tiene de valioso esta emoción hoy
4. **🎵 Recomendación**: un tipo de movimiento o ritmo sugerido

Sé empático, usa emojis con moderación, tono cálido y motivador.`;

  const respuesta = await llamarIA(prompt);
  const contenido = respuesta || generarAnalisisFallback(estado.textoEmocion);
  estado.analisisEmocion = contenido;
  document.getElementById('contenido-m1').innerHTML = formatearTextoIA(contenido);
  document.getElementById('resultado-m1').classList.remove('oculto');
  marcarCompletado(1);
  mostrarLoader('loader-m1', false);
  document.getElementById('btn-analizar').disabled = false;
  mostrarToast('🎭 Emoción analizada', 'exito');
  guardarEnStorage();
}

function generarAnalisisFallback(texto) {
  return `**🎭 Emoción detectada:** Autenticidad emocional en proceso

**💃 Conexión con la danza:** Tu emoción tiene un ritmo natural. La cumbia puede ser tu espejo, amplificando lo que sientes y transformándolo en movimiento.

**🌟 Fortaleza:** Reconocer lo que sientes es el primer paso de la danza emocional. Eso requiere valentía.

**🎵 Recomendación:** Comienza con un ritmo medio. Deja que tus caderas guíen el inicio, sin pensar demasiado.`;
}

// ══════════════════════════════════════════════
//  MÓDULO 2: COREOGRAFÍA
// ══════════════════════════════════════════════
async function generarCoreografia() {
  mostrarLoader('loader-m2', true);
  document.getElementById('resultado-m2').classList.add('oculto');
  document.getElementById('btn-coreografia').disabled = true;

  const datos = DATOS_RITMO[estado.ritmo];
  const prompt = `Eres un coreógrafo experto en cumbia colombiana y danzaterapia.
El estudiante siente: "${estado.textoEmocion || estado.emocionSeleccionada || 'una emoción por explorar'}"
Ritmo elegido: ${datos.label} (${datos.bpm} BPM, ${datos.ambiente})

Genera una coreografía de cumbia con EXACTAMENTE 6 pasos. 
Formato JSON estricto — solo el array, sin markdown:
[
  {"nombre": "Nombre del paso", "instruccion": "Descripción corta y clara (20-30 palabras)"},
  ...
]

Los pasos deben ser progresivos: de más simple a más complejo.
Incluye movimientos de caderas, pies, brazos y expresión facial.
Adapta la energía a la emoción del estudiante.`;

  let coreografia = null;
  const respuesta = await llamarIA(prompt);

  if (respuesta) {
    try {
      const clean = respuesta.replace(/```json|```/g, '').trim();
      coreografia = JSON.parse(clean);
    } catch(e) { coreografia = null; }
  }

  if (!coreografia) coreografia = generarCoreografiaFallback(estado.emocionSeleccionada || 'exploración');

  estado.coreografia = coreografia;
  renderizarPasos(coreografia);
  document.getElementById('resultado-m2').classList.remove('oculto');

  // Consejos adicionales
  const promptConsejos = `Dame 2 consejos breves (máximo 60 palabras total) para practicar esta coreografía de cumbia con emoción ${estado.emocionSeleccionada || 'abierta'}. Formato: **Consejo 1:** texto. **Consejo 2:** texto. Solo eso.`;
  const consejos = await llamarIA(promptConsejos);
  if (consejos) {
    document.getElementById('consejos-coreografia').innerHTML = formatearTextoIA(consejos);
  }

  marcarCompletado(2);
  mostrarLoader('loader-m2', false);
  document.getElementById('btn-coreografia').disabled = false;
  mostrarToast('💃 ¡Coreografía lista!', 'exito');
  guardarEnStorage();
}

function generarCoreografiaFallback(emocion) {
  return [
    { nombre: "Paso Básico de Cumbia", instruccion: "Pies alternados adelante-atrás, peso en las caderas. Respira y siente el ritmo." },
    { nombre: "Balanceo de Caderas", instruccion: "Caderas de lado a lado siguiendo el tiempo. Brazos relajados, rodillas ligeramente flexionadas." },
    { nombre: "El Giro Suave", instruccion: "Gira 180° sobre el pie derecho mientras las caderas continúan el balanceo. Mantén la vista al frente." },
    { nombre: "Brazos Abiertos", instruccion: "Abre los brazos a la altura de los hombros al mismo tiempo que das el paso básico. Exprésate libremente." },
    { nombre: "Sabor Caribeño", instruccion: "Combina balanceo + giro + brazos. Agrega una sonrisa y deja que tu cuerpo sienta el Caribe." },
    { nombre: "El Cierre Emocional", instruccion: "Finaliza con tres pasos hacia adelante, brazos al frente, y una pausa dramática. ¡Siente lo que bailaste!" }
  ];
}

function renderizarPasos(pasos) {
  const lista = document.getElementById('pasos-lista');
  lista.innerHTML = pasos.map((p, i) => `
    <div class="paso-item" draggable="true">
      <div class="paso-num">${i + 1}</div>
      <div class="paso-texto">
        <strong>${p.nombre}</strong><br>
        <span style="color:var(--text2);font-size:0.88rem;">${p.instruccion}</span>
      </div>
      <button class="paso-editar" onclick="editarPaso(${i})" title="Editar">✏️</button>
    </div>
  `).join('');
}

function agregarPaso() {
  const nombre = prompt('Nombre del paso:');
  if (!nombre) return;
  const instruccion = prompt('Instrucción:');
  estado.coreografia.push({ nombre: nombre || 'Nuevo paso', instruccion: instruccion || 'Descríbelo...' });
  renderizarPasos(estado.coreografia);
  mostrarToast('➕ Paso agregado', 'exito');
}

function editarPaso(i) {
  const paso = estado.coreografia[i];
  const nombre = prompt('Nombre del paso:', paso.nombre);
  if (nombre === null) return;
  const instruccion = prompt('Instrucción:', paso.instruccion);
  if (instruccion === null) return;
  estado.coreografia[i] = { nombre, instruccion };
  renderizarPasos(estado.coreografia);
  mostrarToast('✅ Paso actualizado', 'exito');
}

// ══════════════════════════════════════════════
//  MÓDULO 3: ANÁLISIS MUSICAL
// ══════════════════════════════════════════════
async function analizarMusica() {
  const datos = DATOS_RITMO[estado.ritmo];
  mostrarLoader('loader-m3', true);
  document.getElementById('resultado-m3').classList.add('oculto');
  document.getElementById('btn-musica').disabled = true;

  const prompt = `Eres un músico experto en cumbia colombiana y danzaterapia.
El estudiante siente: "${estado.textoEmocion || estado.emocionSeleccionada || 'una emoción por explorar'}"
Ha elegido: ${datos.label} (${datos.bpm} BPM, ambiente ${datos.ambiente})

Responde en ESPAÑOL (máximo 100 palabras):
1. **🎵 Por qué este ritmo es perfecto** para su emoción actual
2. **🥁 Instrumentos clave** de la cumbia que resonarán con su estado
3. **💫 Consejo de escucha activa**: cómo conectar el cuerpo con este ritmo específico

Tono cálido, poético, motivador.`;

  const respuesta = await llamarIA(prompt);
  const contenido = respuesta || generarMusicaFallback(datos);
  estado.consejoMusical = contenido;
  document.getElementById('contenido-m3').innerHTML = formatearTextoIA(contenido);
  document.getElementById('resultado-m3').classList.remove('oculto');
  marcarCompletado(3);
  mostrarLoader('loader-m3', false);
  document.getElementById('btn-musica').disabled = false;
  mostrarToast('🎵 Análisis musical listo', 'exito');
  guardarEnStorage();
}

function generarMusicaFallback(datos) {
  return `**🎵 Por qué este ritmo es perfecto:** El ${datos.label} te ofrece exactamente el espacio que necesitas. A ${datos.bpm} BPM, tu cuerpo puede sincronizarse con naturalidad.

**🥁 Instrumentos clave:** La caja (tambor pequeño) marcará tu pulso, la guacharaca te dará el desliz, y el acordeón te abrirá el corazón.

**💫 Consejo de escucha activa:** Cierra los ojos. Siente primero el grave del tambor en tu pecho, luego deja que las caderas respondan solas.`;
}

// ══════════════════════════════════════════════
//  MÓDULO 4: VIDEO
// ══════════════════════════════════════════════
function cargarVideo(event) {
  const archivo = event.target.files[0];
  if (!archivo) return;
  const url = URL.createObjectURL(archivo);
  document.getElementById('preview-video').src = url;
  document.getElementById('video-cargado').classList.remove('oculto');
  document.getElementById('placeholder-video').classList.add('oculto');
  document.getElementById('nombre-video').textContent = '✅ ' + archivo.name;
  marcarCompletado(4);
  mostrarToast('🎬 Video cargado correctamente', 'exito');
}

// ══════════════════════════════════════════════
//  MÓDULO 5: REFLEXIÓN
// ══════════════════════════════════════════════
function seleccionarEmocionPost(btn, emocion) {
  document.querySelectorAll('#emociones-post .emoji-btn').forEach(b => b.classList.remove('seleccionado'));
  btn.classList.add('seleccionado');
  estado.emocionPost = emocion;
}

async function reflexionar() {
  const texto = document.getElementById('texto-reflexion').value.trim();
  if (!texto) { mostrarToast('Escribe tu reflexión primero 💬', 'info'); return; }
  estado.reflexion = texto;
  mostrarLoader('loader-m5', true);
  document.getElementById('resultado-m5').classList.add('oculto');
  document.getElementById('btn-reflexion').disabled = true;

  const prompt = `Eres un guía de danzaterapia con enfoque socioemocional.
El estudiante reflexiona sobre su experiencia de danza:
"${texto}"
- Emoción inicial: ${estado.textoEmocion || estado.emocionSeleccionada}
- Emoción después de bailar: ${estado.emocionPost || 'no especificada'}
- Ritmo utilizado: ${DATOS_RITMO[estado.ritmo].label}

Responde en ESPAÑOL (máximo 150 palabras):
1. **✨ Emoción transmitida** a través del movimiento
2. **🔄 Transformación** que se evidencia en su proceso
3. **💪 Fortalezas** que demostró hoy
4. **🌱 Propuesta para la próxima sesión** (2 sugerencias concretas)
5. **🌟 Mensaje de cierre** inspirador y poético (1-2 oraciones)

Tono: cálido, empático, motivador. Usa emojis con moderación.`;

  const respuesta = await llamarIA(prompt);
  const contenido = respuesta || generarReflexionFallback(texto);
  estado.analisisReflexion = contenido;
  document.getElementById('contenido-m5').innerHTML = formatearTextoIA(contenido);
  document.getElementById('resultado-m5').classList.remove('oculto');
  marcarCompletado(5);
  mostrarLoader('loader-m5', false);
  document.getElementById('btn-reflexion').disabled = false;
  mostrarToast('🌟 Reflexión completada', 'exito');
  guardarEnStorage();
}

function generarReflexionFallback(texto) {
  return `**✨ Emoción transmitida:** Autenticidad y apertura emocional genuina.

**🔄 Transformación:** Se evidencia un proceso de liberación. Tu cuerpo encontró su propio lenguaje a través del ritmo caribeño.

**💪 Fortalezas:** Valentía para expresarte, disposición al movimiento y honestidad emocional.

**🌱 Para la próxima sesión:**
- Explora movimientos más lentos cuando sientas tensión interna
- Practica frente a un espejo para observar tu expresión facial

**🌟 Mensaje de cierre:**
*Cada vez que tu cuerpo se mueve al ritmo de la cumbia, le das voz a algo que las palabras no alcanzan a decir.*`;
}

// ══════════════════════════════════════════════
//  MÓDULO 6: PANEL FINAL
// ══════════════════════════════════════════════
async function construirResumen() {
  const coreografiaTexto = estado.coreografia.length > 0
    ? estado.coreografia.map((p, i) => `${i+1}. ${p.nombre}`).join(' · ')
    : 'Aún sin generar';

  const datos = DATOS_RITMO[estado.ritmo];

  document.getElementById('panel-resumen').innerHTML = `
    <div class="resumen-card-item">
      <div class="resumen-icon">🎭</div>
      <div class="resumen-title">Emoción inicial</div>
      <div class="resumen-val">${estado.textoEmocion || estado.emocionSeleccionada || 'No registrada'}</div>
    </div>
    <div class="resumen-card-item">
      <div class="resumen-icon">💃</div>
      <div class="resumen-title">Coreografía</div>
      <div class="resumen-val">${estado.coreografia.length} pasos de cumbia</div>
    </div>
    <div class="resumen-card-item">
      <div class="resumen-icon">🎵</div>
      <div class="resumen-title">Ritmo elegido</div>
      <div class="resumen-val">${datos.label} · ${datos.bpm} BPM</div>
    </div>
    ${estado.emocionPost ? `
    <div class="resumen-card-item">
      <div class="resumen-icon">✨</div>
      <div class="resumen-title">Emoción final</div>
      <div class="resumen-val">${estado.emocionPost}</div>
    </div>` : `
    <div class="resumen-card-item">
      <div class="resumen-icon">🌿</div>
      <div class="resumen-title">Reflexión</div>
      <div class="resumen-val">${estado.reflexion ? estado.reflexion.substring(0,60) + '…' : 'No completada'}</div>
    </div>`}
  `;

  const mensajeEl = document.getElementById('mensaje-final');
  if (!mensajeEl.textContent.trim()) {
    const prompt = `Eres un guía de danzaterapia. El estudiante completó este proceso:
- Emoción inicial: "${estado.textoEmocion || estado.emocionSeleccionada}"
- Creó una coreografía de cumbia con ${estado.coreografia.length} pasos
- Ritmo elegido: ${datos.label}
- Emoción después de bailar: "${estado.emocionPost}"

Escribe un mensaje de cierre en ESPAÑOL (máximo 80 palabras): celebra su valentía, menciona su crecimiento emocional, y termina con una frase poética sobre la danza y las emociones.
Tono: cálido, poético, inspirador.`;

    const respuesta = await llamarIA(prompt);
    mensajeEl.innerHTML = formatearTextoIA(respuesta || mensajeFinalFallback());
  }

  marcarCompletado(6);
}

function mensajeFinalFallback() {
  return `¡Felicitaciones por completar esta experiencia! Has recorrido un camino valioso: desde reconocer lo que sientes, hasta darle forma con tu cuerpo a través de la cumbia. Cada paso que creaste, cada ritmo que elegiste, habla de tu valentía para expresarte.

*La danza no es solo movimiento — es el idioma más antiguo que tiene el corazón.*

*Sigue bailando. Sigue sintiendo. Sigue siendo tú.* 💃`;
}

// ══════════════════════════════════════════════
//  DESCARGA Y COMPARTIR
// ══════════════════════════════════════════════
function descargarResultado() {
  const datos = DATOS_RITMO[estado.ritmo];
  const coreografiaTexto = estado.coreografia.map((p, i) => `${i+1}. ${p.nombre}: ${p.instruccion}`).join('\n');
  const contenido = `CUERPOS QUE SIENTEN
Danza, Emociones e Inteligencia Artificial
Fecha: ${new Date().toLocaleDateString('es-CO', { year:'numeric',month:'long',day:'numeric' })}

═══════════════════════════════════════

EMOCIÓN INICIAL
${estado.textoEmocion || estado.emocionSeleccionada || 'No registrada'}

ANÁLISIS DE LA IA
${estado.analisisEmocion || 'No completado'}

═══════════════════════════════════════

MI COREOGRAFÍA DE CUMBIA
${coreografiaTexto || 'No generada'}

═══════════════════════════════════════

RITMO ELEGIDO
${datos.label} · ${datos.bpm} BPM
Energía: ${datos.energia} · Ambiente: ${datos.ambiente}

═══════════════════════════════════════

MI REFLEXIÓN
${estado.reflexion || 'No completada'}
Emoción después de bailar: ${estado.emocionPost || 'No registrada'}

═══════════════════════════════════════
Proyecto "Cuerpos que Sienten"
Danza · Emociones · Inteligencia Artificial
`;
  const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cuerpos-que-sienten-${Date.now()}.txt`;
  a.click();
  mostrarToast('⬇ Resultado descargado', 'exito');
}

function compartirResultado() {
  const texto = `✦ Acabo de completar "Cuerpos que Sienten" — una experiencia de danza, emociones e IA.
Mi emoción: ${estado.emocionSeleccionada || 'explorada'}
Mi coreografía: ${estado.coreografia.length} pasos de cumbia 💃
#CuerposQueSienten #Danza #CumbiaEmocional`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(texto).then(() => mostrarToast('✓ Copiado para compartir', 'exito'));
  }
}

function reiniciar() {
  if (!confirm('¿Quieres comenzar una nueva experiencia?')) return;
  Object.keys(estado).forEach(k => {
    if (typeof estado[k] === 'string') estado[k] = '';
    else if (Array.isArray(estado[k])) estado[k] = [];
    else estado[k] = 0;
  });
  estado.ritmo = 2;
  localStorage.removeItem('cuerpos-que-sienten');
  document.getElementById('texto-emocion').value = '';
  document.getElementById('texto-reflexion').value = '';
  ['resultado-m1','resultado-m2','resultado-m3','resultado-m5'].forEach(id => document.getElementById(id)?.classList.add('oculto'));
  document.getElementById('mensaje-final').textContent = '';
  document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('seleccionado'));
  document.querySelectorAll('.modulo-paso').forEach(b => b.classList.remove('completado','activo'));
  if (ritmoActivo) toggleRitmo();
  seleccionarRitmoCard(2);
  irA(1);
  mostrarToast('↺ Nueva experiencia iniciada', 'info');
}

// ══════════════════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════════════════
function mostrarLoader(id, visible) {
  document.getElementById(id)?.classList.toggle('oculto', !visible);
}

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${tipo} visible`;
  setTimeout(() => t.classList.remove('visible'), 3000);
}

function formatearTextoIA(texto) {
  if (!texto) return '';
  return texto
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function guardarEnStorage() {
  try {
    localStorage.setItem('cuerpos-que-sienten', JSON.stringify({ estado, fecha: new Date().toISOString() }));
  } catch(e) {}
}

function cargarDesdeStorage() {
  try {
    const guardado = localStorage.getItem('cuerpos-que-sienten');
    if (!guardado) return;
    const datos = JSON.parse(guardado);
    Object.assign(estado, datos.estado);
    if (estado.textoEmocion) document.getElementById('texto-emocion').value = estado.textoEmocion;
    if (estado.reflexion) document.getElementById('texto-reflexion').value = estado.reflexion;
    if (estado.ritmo) seleccionarRitmoCard(estado.ritmo);
    if (estado.analisisEmocion) {
      document.getElementById('contenido-m1').innerHTML = formatearTextoIA(estado.analisisEmocion);
      document.getElementById('resultado-m1').classList.remove('oculto');
      marcarCompletado(1);
    }
    if (estado.coreografia.length > 0) {
      renderizarPasos(estado.coreografia);
      document.getElementById('resultado-m2').classList.remove('oculto');
      marcarCompletado(2);
    }
  } catch(e) {}
}

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  inicializarVisualizador();
  updateTrackDisplay();
  cargarDesdeStorage();
});
