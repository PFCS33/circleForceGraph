import { createStore } from "vuex";
// import authModule from "./modules/auth";
import rawDataModule from "./modules/raw";
// import treeDataModule from "./modules/tree";
// import graphDataModule from "./modules/graph";
// import colDataModule from "./modules/col";
const store = createStore({
  modules: {
    // auth: authModule,
    raw: rawDataModule,
    // tree: treeDataModule,
    // graph: graphDataModule,
    // col: colDataModule,
  },
});

export default store;
