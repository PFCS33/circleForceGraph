import { createStore } from "vuex";
// import authModule from "./modules/auth";
import treeModule from "./modules/tree";
const store = createStore({
  modules: {
    // auth: authModule,
    tree: treeModule,
  },
});

export default store;
