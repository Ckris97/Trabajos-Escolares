# Bitácora de Gym

Tracker de gym por perfiles (Diana y Yo), publicado en **Cloudflare Pages** con base de datos **D1**. Los dos ven y guardan los mismos datos desde cualquier celular.

- Registro de cada serie: carga, repeticiones y RIR, más el estado del ejercicio (cumplido, parcial, no cumplido, saltado).
- Series de aproximación ya calculadas (50/70/90 % × 12/8/4), temporizador de descanso e intervalos HIIT.
- Calendario de asistencia, % de cumplimiento, gráficas por ejercicio y series por músculo contra el volumen objetivo.
- Medidas corporales con tendencia de peso.
- Rutina editable por perfil. Mesociclo de 5 semanas, la última de descarga.
- Funciona sin señal en el gym: guarda en el teléfono y sube a la nube cuando vuelve la conexión.
- Se puede instalar en la pantalla de inicio (Compartir → "Agregar a inicio").

## Dónde está publicada

**https://bitacora-gym.pages.dev**: proyecto `bitacora-gym` en Cloudflare Pages, con la base D1 `bitacora-gym` conectada como `DB` y el PIN en la variable secreta `APP_PIN`. El PIN se cambia en Cloudflare → Workers & Pages → bitacora-gym → Settings → Variables and Secrets.

Al abrir la página por primera vez en un celular, escribe el PIN en ⚙ Ajustes → Sincronización. El punto junto al engrane indica el estado:

| Punto | Significa |
|---|---|
| verde | Sincronizado |
| amarillo | Guardando |
| rojo | Falta el PIN o es incorrecto |
| hueco | Sin conexión: lo guardado sigue en el teléfono y se sube después |

## Estructura

```
gym-tracker/
├── public/                    ← la app (index.html), manifest e íconos
├── src/api.js                 ← API que guarda cada perfil en D1
├── functions/api/[[path]].js  ← la misma API como Pages Function (despliegue conectado a Git)
├── scripts/build-worker.mjs   ← empaqueta página + API en dist/_worker.js
└── package.json
```

La tabla de D1 se crea sola la primera vez que se usa la API.

## Actualizar la página

```bash
cd gym-tracker
npm install
npm run deploy         # empaqueta y sube a Cloudflare Pages
```

Para probar en local: `npm run dev` (abre http://localhost:8788 con una base D1 local).
