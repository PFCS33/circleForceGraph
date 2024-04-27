import { createRouter, createWebHistory } from "vue-router";

import MainPage from "./views/main-page.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/main",
    },
    {
      path: "/main",
      component: MainPage,
    },
  ],
});

export default router;
