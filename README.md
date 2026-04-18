# 💃 Cuerpos que Sienten

**Danza, Emociones e Inteligencia Artificial**

Proyecto educativo de danzaterapia que combina cumbia colombiana, inteligencia emocional e IA para que estudiantes exploren sus emociones a través del movimiento.

---

## ✨ ¿Qué es?

*Cuerpos que Sienten* es una aplicación web interactiva de 6 módulos que guía a los estudiantes en un proceso de autoconocimiento emocional a través de la danza. Cada módulo usa IA (Claude de Anthropic) para personalizar la experiencia.

---

## 🗂 Módulos

| # | Módulo | Descripción |
|---|--------|-------------|
| 1 | 🎭 **Exploración emocional** | Identifica cómo te sientes y recibe un análisis empático de la IA |
| 2 | 💃 **Coreografía con IA** | Genera 6 pasos de cumbia adaptados a tu emoción actual |
| 3 | 🎵 **Ritmo y Música** | Elige tu tempo (60 / 90 / 130 BPM) y escucha cumbia sintética |
| 4 | 🌀 **Expresión corporal** | Sube o graba un video practicando tu coreografía |
| 5 | 🌟 **Reflexión con IA** | La IA analiza tu experiencia de danza y te da retroalimentación |
| 6 | ✦ **Resultado final** | Resumen completo + mensaje de cierre generado por IA |

---

## 🚀 Cómo usar

### Opción 1 — Abrir directamente
Abre el archivo `index.html` en tu navegador. No necesita servidor.

### Opción 2 — GitHub Pages
1. Sube el repositorio a GitHub
2. Ve a **Settings → Pages**
3. Selecciona la rama `main` como fuente
4. ¡Listo! Tu proyecto estará en `https://tu-usuario.github.io/cuerpos-que-sienten`

### Opción 3 — Servidor local
```bash
# Con Python
python -m http.server 8000

# Con Node.js (npx)
npx serve .
```

---

## 🔑 API Key de Anthropic

La aplicación llama directamente a la API de Anthropic desde el navegador.  
Para que las funciones de IA funcionen en tu propio despliegue, necesitas configurar la API key.

> ⚠️ **Nota de seguridad:** No expongas tu API key en código público. Para producción, implementa un backend proxy que maneje la autenticación.

Para desarrollo local, puedes modificar la función `llamarIA()` en `script.js` y agregar el header `x-api-key`:

```javascript
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'TU_API_KEY_AQUI',          // Solo para desarrollo local
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true'
}
```

---

## 📁 Estructura del proyecto

```
cuerpos-que-sienten/
├── index.html      # Estructura HTML y templates SVG
├── style.css       # Estilos, variables de color, animaciones
├── script.js       # Lógica de la app, Web Audio API, llamadas IA
└── README.md       # Este archivo
```

---

## 🛠 Tecnologías

- **HTML5 / CSS3 / JavaScript** — sin frameworks ni dependencias
- **Web Audio API** — ritmos de cumbia generados sintéticamente
- **Claude API (Anthropic)** — análisis emocional, coreografía y reflexión
- **LocalStorage** — guarda el progreso del usuario entre sesiones
- **Google Fonts** — tipografías Fraunces + Nunito

---

## 🎨 Paleta de colores

| Variable | Color | Uso |
|----------|-------|-----|
| `--coral` | `#FF7043` | Acción principal |
| `--rose2` | `#EC407A` | Acento IA |
| `--teal` | `#4DB6AC` | Éxito / verde |
| `--cream` | `#FFF8F0` | Fondo general |

---

## 📚 Contexto educativo

Este proyecto fue desarrollado como herramienta de **danzaterapia socioemocional** para contextos escolares en Colombia. La cumbia, ritmo caribeño originario de la Costa Caribe colombiana, se usa como vehículo de expresión emocional accesible y culturalmente relevante.

---

## 📄 Licencia

Proyecto educativo de uso libre. Puedes adaptarlo para tu institución educativa.

---

*Hecho con 💃 y ✦ IA · Cumbia colombiana · Emociones*
