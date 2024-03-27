import { createStore } from "vuex";
// import authModule from "./modules/auth";
import rawDataModule from "./modules/raw";
const store = createStore({
  modules: {
    // auth: authModule,
    raw: rawDataModule,
  },
});

export default store;
