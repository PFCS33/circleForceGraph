import "element-plus/dist/index.css";
import { createApp } from "vue";
import App from "./App.vue";

import router from "./router.js";
import store from "./store/index.js";

import BaseCard from "./components/ui/BaseCard.vue";
import BaseButton from "./components/ui/BaseButton.vue";
import SvgIcon from "./components/ui/SvgIcon.vue";

const app = createApp(App);
app.use(router);
app.use(store);
app.component("BaseCard", BaseCard);
app.component("BaseButton", BaseButton);
app.component("SvgIcon", SvgIcon);
app.mount("#app");
