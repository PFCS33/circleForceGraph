import { createStore } from "vuex";
// import authModule from "./modules/auth";
import rawDataModule from "./modules/raw";
import focusModule from "./modules/focus";
// import treeDataModule from "./modules/tree";
// import graphDataModule from "./modules/graph";
// import colDataModule from "./modules/col";
const store = createStore({
  modules: {
    // auth: authModule,
    raw: rawDataModule,
    focus: focusModule,
    // tree: treeDataModule,
    // graph: graphDataModule,
    // col: colDataModule,
  },
});

export default store;
