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
      const targetId = payload;
      const tree = context.rootGetters["treeData"];
      // // get path for drawing
      // const pathList = tree.getExportPath(targetId);
      // // delete the 'zero' node
      // pathList.shift();
      // get tree for drawing
      // update layer info in new tree
      const rootLayer = tree.nodeIdMap.get(targetId).value.layer;
      const nodes = tree
        .getDescendantList(targetId)
        .map((data) => ({ ...data, layer: data.layer - rootLayer }));

      const links = tree.getLinkList(targetId);
      const nodeInfo = {
        nodes,
        links,
      };

      // set export mode to -1
      context.commit("setMode", false);
      // set freeId back to -1
      context.commit("freeze/setId", -1, { root: true });
      return nodeInfo;
    },
  },
};
