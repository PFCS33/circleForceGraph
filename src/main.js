import "element-plus/dist/index.css";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router.js";
import store from "./store/index.js";

import SvgIcon from "./components/ui/svg-icon.vue";
import BaseButton from "./components/ui/base-button.vue";

import * as myTool from "@/utils/common/general.js";
import * as d3 from "d3";

// global variables
window.d3 = d3;
window.myTool = myTool;

const app = createApp(App);
app.use(router);
app.use(store);
app.component("SvgIcon", SvgIcon);
app.component("BaseButton", BaseButton);
app.mount("#app");
