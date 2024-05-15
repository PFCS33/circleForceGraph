export default {
  namespaced: true,

  state() {
    return {
      mode: false,
    };
  },
  getters: {
    mode(state) {
      return state.mode;
    },
  },
  mutations: {
    setMode(state, payload) {
      state.mode = payload;
    },
  },
  actions: {
    startExport(context, payload) {
      const tailId = payload;
      const tree = context.rootGetters["treeData"];
      // get path for drawing
      const pathList = tree.getExportPath(tailId);

      // set export mode to -1
      context.commit("setMode", false);
      // set freeId back to -1
      context.commit("freeze/setId", -1, { root: true });

      function drawPDF(path) {}
    },
  },
};
