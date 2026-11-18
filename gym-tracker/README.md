# Bitácora de Gym

Tracker de gym por perfiles (Diana y Yo), publicado en **Cloudflare Pages** con base de datos **D1**. Los dos ven y guardan los mismos datos desde cualquier celular.

- Registro de cada serie: carga, repeticiones y RIR, más el estado del ejercicio (cumplido, parcial, no cumplido, saltado).
- Series de aproximación ya calculadas (50/70/90 % × 12/8/4), temporizador de descanso e intervalos HIIT.
- Calendario de asistencia, % de cumplimiento, gráficas por ejercicio y series por músculo contra el volumen objetivo.
- Medidas corporales con tendencia de peso.
- Rutina editable por perfil. Mesociclo de 5 semanas, la última de descarga.
- Funciona sin señal en el gym: guarda en el teléfono y sube a la nube cuando vuelve la conexión.
- Se puede instalar en la pantalla de inicio (Compartir → "Agregar a inicio").

## Estructura

```
gym-tracker/
├── public/                  ← lo que se publica
│   ├── index.html           ← la app
│   ├── manifest.webmanifest, icon.svg, icon-192.png, icon-512.png
│   └── _headers
├── functions/api/[[path]].js  ← API (Pages Functions) que guarda en D1
└── package.json             ← scripts para probar en local
```

La tabla de D1 se crea sola la primera vez que se usa la API.

## Publicar en Cloudflare (una sola vez)

1. **Crear la base de datos.** En el panel de Cloudflare ve a *Storage & Databases → D1 → Create* y llámala `bitacora-gym`.
2. **Crear el proyecto de Pages.** Ve a *Workers & Pages → Create → Pages → Connect to Git*, elige el repo `Trabajos-Escolares` y la rama que quieras publicar. En la configuración de build pon:
   - Framework preset: `None`
   - Build command: *(vacío)*
   - Build output directory: `public`
   - Root directory: `gym-tracker`
3. **Conectar la base de datos.** En el proyecto ve a *Settings → Bindings → Add → D1 database*. Pon `DB` como nombre de variable y elige `bitacora-gym`.
4. **Poner el PIN (recomendado).** En *Settings → Variables and Secrets* agrega `APP_PIN` como *Secret*, con un número que solo ustedes sepan. Sin PIN, cualquiera que tenga el link podría editar los datos.
5. **Volver a publicar.** En *Deployments* da *Retry deployment* para que tome la base de datos y el PIN.

Abre el link `*.pages.dev` y escribe el PIN en ⚙ Ajustes → Sincronización. El punto junto al engrane indica el estado:

| Punto | Significa |
|---|---|
| verde | Sincronizado |
| amarillo | Guardando |
| rojo | Falta el PIN, o falta conectar la base de datos (paso 3) |
| hueco | Sin conexión: lo guardado sigue en el teléfono y se sube después |

Cada `git push` a la rama conectada vuelve a publicar la app sola.

## Probar en local

```bash
cd gym-tracker
npm install
npm run dev            # http://localhost:8788 con una base D1 local
```
