import { createRouter, createWebHistory } from "vue-router";

import MainPage from "./views/main-page.vue";
import PreviewPage from "./views/preview-page.vue";

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
    {
      name: "preview",
      path: "/preview",
      component: PreviewPage,
    },
  ],
});

export default router;
