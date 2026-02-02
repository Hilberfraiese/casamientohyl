<script setup>
import { useRouter } from "vue-router";
import pulpImg from "../assets/pulp.png"; // 👈 guardá la imagen ahí (o ajustá la ruta)

const router = useRouter();

async function enableSound() {
  sessionStorage.setItem("sound_enabled", "1");
  router.push("/home");
}
</script>

<template>
  <main class="gate" aria-label="Inicio con sonido">
    <!-- Ornamento suave de fondo (no es card) -->
    <div class="grain" aria-hidden="true"></div>

    <section class="wrap">
      <!-- Imagen pulp (chiquita, arriba del nombre) -->
      <img class="pulp" :src="pulpImg" alt="Ilustración estilo pulp" />

      <h1 class="title">LUCIA &amp; HILBER</h1>

      <p class="subtitle">
        Activá el sonido para comenzar la experiencia
      </p>

      <button class="cta" @click="enableSound">
        <span class="dot" aria-hidden="true"></span>
        Activar sonido y entrar
        <span class="arrow" aria-hidden="true">→</span>
      </button>

      <p class="hint">
        (Podés silenciar la música cuando quieras desde la invitación)
      </p>
    </section>
  </main>
</template>

<style scoped>
/* Paleta */
.gate{
  --bg: #F6EFD8;
  --ink: #1F3C88;

  /* ✅ reemplazar */
  min-height: 100vh;      /* fallback */
  min-height: 100svh;     /* viewport “estable” en mobile */
  min-height: 100dvh;     /* viewport dinámico (mejor en chrome moderno) */

  display: grid;
  place-items: center;

  /* ✅ safe area (no hace daño en android, ayuda en iOS) */
  padding: calc(28px + env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom));

  background: var(--bg);
  color: var(--ink);
  position: relative;
  overflow: hidden;
}


/* Un toque “impreso” / elegante (sin cambiar colores) */
.grain{
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .18;
  background:
    radial-gradient(900px 520px at 50% 25%, rgba(31, 60, 136, .08), transparent 60%),
    radial-gradient(700px 480px at 20% 70%, rgba(31, 60, 136, .05), transparent 55%),
    radial-gradient(700px 480px at 80% 75%, rgba(31, 60, 136, .05), transparent 55%);
  filter: blur(2px);
}

.wrap{
  width: min(560px, 92vw);
  text-align: center;
  position: relative;
  z-index: 1;
}

/* Imagen pulp */
.pulp{
  width: min(350px, 72vw);
  height: auto;
  display: block;
  margin-left: 20px;
  /* Integración cromática (sin cambiar la paleta) */
  filter: saturate(1.05) contrast(1.02);
  opacity: .95;
}

/* Título */
.title{
  margin: 0;
  font-size: clamp(34px, 6vw, 54px);
  letter-spacing: 1px;
  line-height: 1.05;
}

/* Subtítulo */
.subtitle{
  margin: 12px 0 18px;
  font-size: 14px;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: rgba(31, 60, 136, .78);
}

/* CTA: se siente “ritual”, no botón de login */
.cta{
  display: inline-flex;
  align-items: center;
  gap: 10px;

  padding: 12px 18px;
  border-radius: 999px;

  background: var(--ink);
  color: var(--bg);
  border: none;

  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  box-shadow: 0 18px 40px rgba(31, 60, 136, .25);
  transition: transform .14s ease, box-shadow .14s ease;
}

.cta:hover{
  transform: translateY(-1px);
  box-shadow: 0 22px 55px rgba(31, 60, 136, .32);
}

.cta:active{
  transform: translateY(0px) scale(.98);
}

/* Detalle “encendido” */
.dot{
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--bg);
  box-shadow: 0 0 0 4px rgba(246, 239, 216, .22);
}

/* Flecha sutil */
.arrow{
  opacity: .9;
}

/* Hint */
.hint{
  margin: 14px 0 0;
  font-size: 13px;
  color: rgba(31, 60, 136, .70);
}
</style>
