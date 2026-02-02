<script setup>
import { onMounted, onUnmounted, ref, computed } from "vue";
import introVideo from "../assets/intro.mp4";
import song from "../assets/song.mp3";

// ---- Estado UI / envío ----
const sent = ref(false);
const errorMsg = ref("");
const isSubmitting = ref(false);


// ---- Audio ----
let audioEl;

// Mini player (clásico, discreto)
const trackTitle = "Acariciar lo eterno - Jeites";
const isPlaying = ref(false);
const isMuted = ref(false);

// ---- Wizard ----
const step = ref(1);

// ---- Datos RSVP ----
const form = ref({
  fullName: "",
  attending: "", // "si" | "no"
  dietaryHas: "", // "si" | "no"
  dietary: "",
  allergyHas: "", // "si" | "no"
  allergy: "",
  shuttle: "", // "si" | "no"
});

const isAttending = computed(() => form.value.attending === "si");
const isNotAttending = computed(() => form.value.attending === "no");

function syncAudioFlags() {
  if (!audioEl) return;
  isMuted.value = !!audioEl.muted;
  isPlaying.value = !audioEl.paused;
}

async function togglePlay() {
  if (!audioEl) return;
  try {
    if (audioEl.paused) await audioEl.play();
    else audioEl.pause();
  } catch (e) {
    // no rompemos la UI
  } finally {
    syncAudioFlags();
  }
}

function toggleMute() {
  if (!audioEl) return;
  audioEl.muted = !audioEl.muted;
  syncAudioFlags();
}

onMounted(async () => {
  const soundEnabled = sessionStorage.getItem("sound_enabled") === "1";

  audioEl = new Audio(song);
  audioEl.loop = true;
  audioEl.volume = 0.9;

  audioEl.addEventListener("play", syncAudioFlags);
  audioEl.addEventListener("pause", syncAudioFlags);
  audioEl.addEventListener("volumechange", syncAudioFlags);

  if (soundEnabled && audioEl) {
    try {
      await audioEl.play();
    } catch (e) {}
  }

  syncAudioFlags();
});

function stopAudio() {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.currentTime = 0;
  audioEl.src = ""; // libera el recurso
  audioEl = null;
}

onUnmounted(() => {
  stopAudio();
});

function handleVisibilityChange() {
  if (document.hidden) {
    audioEl?.pause();
  }
}

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

function next() {
  errorMsg.value = "";

  if (step.value === 1) {
    if (!form.value.fullName.trim()) {
      errorMsg.value = "Por favor ingresá tu nombre y apellido.";
      return;
    }
    step.value = 2;
    return;
  }

  if (step.value === 2) {
    if (!form.value.attending) {
      errorMsg.value = "Por favor indicá si vas a asistir.";
      return;
    }

    if (isNotAttending.value) {
      step.value = 6;
      return;
    }

    step.value = 3;
    return;
  }

  if (step.value === 4) {
    if (!form.value.dietaryHas) {
      errorMsg.value = "Indicá si tenés preferencia/restricción alimentaria.";
      return;
    }
    if (form.value.dietaryHas === "si" && !form.value.dietary.trim()) {
      errorMsg.value = "Contanos cuál es tu preferencia/restricción alimentaria.";
      return;
    }
    step.value = 5;
    return;
  }

  if (step.value === 3) {
    if (!form.value.allergyHas) {
      errorMsg.value = "Indicá si tenés alguna alergia.";
      return;
    }
    if (form.value.allergyHas === "si" && !form.value.allergy.trim()) {
      errorMsg.value = "Contanos cuál es tu alergia.";
      return;
    }
    step.value = 4;
    return;
  }

  if (step.value === 5) {
    if (!form.value.shuttle) {
      errorMsg.value = "Indicá si necesitás combi.";
      return;
    }
    step.value = 6;
    return;
  }
}

function back() {
  errorMsg.value = "";
  if (step.value <= 1) return;

  if (step.value === 6 && isNotAttending.value) {
    step.value = 2;
    return;
  }

  step.value -= 1;
}

function resetForm() {
  form.value = {
    fullName: "",
    attending: "",
    dietaryHas: "",
    dietary: "",
    allergyHas: "",
    allergy: "",
    shuttle: "",
  };
  errorMsg.value = "";
  sent.value = false;
  step.value = 1;
}

async function submitForm() {
  if (isSubmitting.value) return; // evita doble click
  errorMsg.value = "";
  sent.value = false;
  isSubmitting.value = true;

  const ENDPOINT_URL = import.meta.env.VITE_SHEETS_ENDPOINT;
  if (!ENDPOINT_URL) {
    errorMsg.value = "Falta configurar VITE_SHEETS_ENDPOINT.";
    isSubmitting.value = false;
    return;
  }

  try {
    const payload = {
      name: form.value.fullName,
      attending: form.value.attending,
      dietaryHas: form.value.dietaryHas,
      dietary: form.value.dietary,
      allergyHas: form.value.allergyHas,
      allergy: form.value.allergy,
      shuttle: form.value.shuttle,
      shuttleFrom: "??",
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    sent.value = true;
    step.value = 7;
  } catch (e) {
    console.log(e)
    errorMsg.value = "No pude enviar la confirmación. Probá de nuevo.";
  } finally {
    isSubmitting.value = false;
  }
}

</script>

<template>
  <div class="page">
    <!-- Centro editorial como SoundGate -->
    <div class="wrap">
      <header class="top">
        <h2>LUCIA & HILBER</h2>
        <p class="meta">Sabado 7 de Marzo de 2026 • 19:00 hs</p>
        <p class="meta">Mirador 9, Ruta 11 4774, Paraje Alfar</p>

      </header>

      <section class="hero">
        <video class="video" :src="introVideo" autoplay playsinline muted loop></video>
      </section>

      <!-- FORM SIN CARD (todo integrado) -->
      <section class="formSection" aria-label="Confirmación">

        <Transition name="fade-slide" mode="out-in">
          <!-- Paso 1 -->
          <div v-if="step === 1" key="s1" class="step">
            <label  class="sub-label">
              Nombre y Apellido
              <input v-model="form.fullName" placeholder="Ej: Juan Pérez" />
            </label>

            <div class="actions">
              <button class="btn" type="button" @click="next">Continuar</button>
            </div>
          </div>

          <!-- Paso 2 -->
          <div v-else-if="step === 2" key="s2" class="step">
            <label  class="sub-label">
              ¿Vas a asistir?
              <select v-model="form.attending">
                <option value="" disabled>Seleccionar</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </label>

            <div class="actions">
              <button class="btn secondary" type="button" @click="back">Atrás</button>
              <button class="btn" type="button" @click="next">Continuar</button>
            </div>
          </div>



          <!-- Paso 3 -->
          <div v-else-if="step === 3" key="s3" class="step">
            <label  class="sub-label">
              ¿Tenés alguna alergia?
              <select v-model="form.allergyHas">
                <option value="" disabled>Seleccionar</option>
                <option value="no">No</option>
                <option value="si">Sí</option>
              </select>
            </label>

            <label v-if="form.allergyHas === 'si'"  class="sub-label">
              ¿Cuál?
              <input v-model="form.allergy" placeholder="Ej: maní, mariscos, lactosa..." />
            </label>

            <div class="actions">
              <button class="btn secondary" type="button" @click="back">Atrás</button>
              <button class="btn" type="button" @click="next">Continuar</button>
            </div>
          </div>

          <!-- Paso 4 -->
          <div v-else-if="step === 4" key="s4" class="step">
            <label  class="sub-label">
              ¿Tenés alguna preferencia/restricción alimentaria?
              <select v-model="form.dietaryHas">
                <option value="" disabled>Seleccionar</option>
                <option value="no">No</option>
                <option value="si">Sí</option>
              </select>
            </label>

            <label v-if="form.dietaryHas === 'si'"  class="sub-label">
              ¿Cuál?
              <input v-model="form.dietary" placeholder="Ej: vegetariano / celíaco / etc." />
            </label>

            <div class="actions">
              <button class="btn secondary" type="button" @click="back">Atrás</button>
              <button class="btn" type="button" @click="next">Continuar</button>
            </div>
          </div>

          <!-- Paso 5 -->
          <div v-else-if="step === 5" key="s5" class="step">
            <label>
              ¿Necesitás combi?
              <p class="hint">Sale desde <strong>Un punto en común a definir.</strong>.</p>
              <select v-model="form.shuttle">
                <option value="" disabled>Seleccionar</option>
                <option value="no">No</option>
                <option value="si">Sí</option>
              </select>
            </label>

            <div class="actions">
              <button class="btn secondary" type="button" @click="back">Atrás</button>
              <button class="btn" type="button" @click="next">Continuar</button>
            </div>
          </div>

          <!-- Paso 6 -->
          <div  v-else-if="step === 6"  key="s6" class="step">
            <div class="finalMessage" v-if="isNotAttending">
              <p>Gracias por confirmar que no vas a asistir 💙</p>
            </div>

            <div class="finalMessage" v-else>
              <p><strong>¡Genial!</strong></p>
              <p>Ya tenemos tus datos. Solo falta que des click en enviar 💙</p>
            </div>

            <div class="actions">
              <button class="btn secondary" type="button" @click="back">Atrás</button>
              <button class="btn" type="button" @click="submitForm" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
                {{ isSubmitting ? "" : "Enviar" }}
              </button>            </div>

          </div>

            <!-- Paso 7 (Éxito) -->
          <div v-else key="s7" class="step">
             <div v-if="isAttending" class="finalMessage">
                <p><strong>¡Confirmación enviada!</strong></p>
                <p>Muchas gracias 💙</p>
              </div>
            
             <div class="actions">
                <button class="btn" type="button" @click="resetForm">
                  Confirmar otro invitado
               </button>
              </div>
            </div>
          
          
        </Transition>

        <p v-if="errorMsg" class="err">{{ errorMsg }}</p>
      </section>

      <!-- Player clásico / discreto (no flotante ostentoso) -->
<footer class="player" aria-label="Control de música">
  <div class="songLine">
    <span class="songTitle">{{ trackTitle }}</span>
  </div>

  <div class="iconControls" role="group" aria-label="Controles">
    <!-- Play/Pause -->
    <button
      class="iconBtn"
      type="button"
      @click="togglePlay"
      :aria-label="isPlaying ? 'Pausar música' : 'Reproducir música'"
      :title="isPlaying ? 'Pausar' : 'Reproducir'"
    >
      <svg v-if="!isPlaying" viewBox="0 0 24 24" aria-hidden="true" class="icon">
        <path d="M8 5v14l11-7z" fill="currentColor"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true" class="icon">
        <path d="M6 5h5v14H6zM13 5h5v14h-5z" fill="currentColor"/>
      </svg>
    </button>

    <!-- Mute/Unmute -->
    <button
      class="iconBtn"
      type="button"
      @click="toggleMute"
      :aria-label="isMuted ? 'Activar sonido' : 'Mutear'"
      :title="isMuted ? 'Activar' : 'Mutear'"
    >
      <svg v-if="!isMuted" viewBox="0 0 24 24" aria-hidden="true" class="icon">
        <path d="M3 10v4h4l5 4V6L7 10H3z" fill="currentColor"/>
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03z" fill="currentColor"/>
        <path d="M14 3.23v2.06c2.89 1 5 3.77 5 6.71s-2.11 5.71-5 6.71v2.06c4.01-1.06 7-4.7 7-8.77s-2.99-7.71-7-8.77z" fill="currentColor"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true" class="icon">
        <path d="M3 10v4h4l5 4V6L7 10H3z" fill="currentColor"/>
        <path d="M16 9l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M21 9l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</footer>

    </div>
  </div>
</template>

<style scoped>
.page{
  /* ✅ reemplazar */
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;

  background: #F6EFD8;
  color: #1F3C88;
  padding: 24px 18px;
}

/* ✅ Esto hace que “arranque en el medio” como el SoundGate */
.wrap{
  max-width: 920px;
  margin: 0 auto;
  text-align: center;

  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 14px; /* antes 18px */
}

/* Header */
.top{ margin: 0; }
.top h1{ margin: 0; letter-spacing: 1px; }
.meta{ margin: 10px 0 0; color: rgba(31, 60, 136, 0.7);font-size: 14px; }

/* Video */
.hero{
  width: 100%;
  position: relative;
}
.video{
  display:block;
  width: 70%;
  height: auto;
  object-fit: cover;
  object-position: center;
  margin: 0 auto;

  -webkit-mask-image: radial-gradient(ellipse at center, #000 62%, transparent 100%);
  mask-image: radial-gradient(ellipse at center, #000 62%, transparent 100%);
}

/* ✅ Form sin card: nada de borde/sombra/fondo separado */
.formSection{
  width: min(720px, 100%);
  padding: 6px 0 0;
}

.formSection h2{
  margin: 0 0 10px 0;
}

/* Inputs centrados pero integrados */
label{
  display:flex;
  flex-direction:column;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  color: rgba(31, 60, 136, 0.92);
}

input, select{
  width: min(420px, 100%);
  padding: 12px;
  border-radius: 12px;

  background: rgba(246, 239, 216, 0.85);
  border: 1px solid rgba(31, 60, 136, 0.28);
  color: #1F3C88;
  outline: none;
}

input::placeholder{ color: rgba(31, 60, 136, 0.5); }

/* Wizard */
.step{ display:flex; flex-direction:column; gap: 14px; }

.actions{
  display:flex;
  gap:10px;
  justify-content:center;
  margin-top: 4px;
}

.hint{
  margin: 0;
  font-size: 13px;
  color: rgba(31, 60, 136, 0.75);
}

.finalMessage p{
  margin: 0;
  text-align:center;
}

/* Botones */
.btn{
  padding: 12px 16px;
  border-radius: 12px;
  background: #1F3C88;
  color: #F6EFD8;
  border: none;
  font-size: 16px;
  cursor:pointer;
}

.btn:hover{ background: rgba(31, 60, 136, 0.92); }

.btn.secondary{
  background: transparent;
  color: #1F3C88;
  border: 1px solid rgba(31, 60, 136, 0.30);
}

.btn:disabled{
  opacity: .65;
  cursor: not-allowed;
}

.spinner{
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid rgba(246, 239, 216, 0.45);
  border-top-color: rgba(246, 239, 216, 0.95);
  display: inline-block;
  margin-right: 8px;
  vertical-align: -3px;
  animation: spin .8s linear infinite;
}

@keyframes spin{
  to { transform: rotate(360deg); }
}

.ok{ margin-top: 8px; color: rgba(31, 60, 136, 0.92); }
.err{ margin-top: 8px; color: rgba(31, 60, 136, 0.75); }

/* Transición */
.fade-slide-enter-active,
.fade-slide-leave-active{
  transition: opacity .22s ease, transform .22s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to{
  opacity: 0;
  transform: translateY(8px);
}

/* ✅ Player “clásico”: línea discreta */
.player{
  display: flex;
  flex-direction: column;
  align-items: center; /* 👈 centra todo el bloque */
  gap: 10px;
  margin-top: 20px;
}

.sub-label {     /* más chico */
  padding: 12px;
}


.songLine{
  display:flex;
  gap: 6px;
  align-items: baseline;
  justify-content: center;
  flex-wrap: wrap;
  text-align: center;
}

.songLabel{
  opacity: .85;
}

.songTitle{
  font-weight: 600;
  color: rgba(31, 60, 136, 0.92);
}

.iconControls{
  width: 100%;              /* 👈 clave */
  display: flex;
  justify-content: center;  /* 👈 centra horizontal */
  align-items: center;
  gap: 14px;
}


.iconBtn{
  width: 44px;
  height: 44px;
  border-radius: 999px;
  align-items: center;
  background: transparent;
  border: 1px solid rgba(31, 60, 136, 0.22);
  color: #1F3C88;
  display:grid;
  place-items:center;
  cursor:pointer;

  transition: transform .12s ease, background .12s ease, border-color .12s ease;
}

.iconBtn:hover{
  background: rgba(31, 60, 136, 0.06);
  border-color: rgba(31, 60, 136, 0.32);
}

.iconBtn:active{
  transform: scale(.97);
}

.icon{
  width: 25px;
  height: 25px;
  display:block;
}

.pControls{
  display:flex;
  align-items:center;
  gap: 10px;
}

.pLink{
  background: transparent;
  border: none;
  padding: 0;
  color: #1F3C88;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  opacity: .9;
}

.pLink:hover{ opacity: 1; }
.sep{ opacity: .55; }

/* Si en algún celu queda alto, permitimos scroll sin romper la estética */
@media (max-height: 740px){
@media (max-height: 740px){
  .wrap{
    justify-content: flex-start;
    padding-top: 14px;
    padding-bottom: 14px;
  }
  .player{ margin-top: 14px; }
}
}
</style>
