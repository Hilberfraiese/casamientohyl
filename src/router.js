import { createRouter, createWebHistory } from "vue-router";
import SoundGate from "./views/SoundGate.vue";
import Landing from "./views/Landing.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: SoundGate },
    { path: "/home", component: Landing },
  ],
});