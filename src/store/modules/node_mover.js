export default {
  namespaced: true,
  state() {
    return {
      // current moving id
      curId: -1,
      // node data from circle graph
      nodeData: null,
    };
  },
  getters: {
    curId(state) {
      return state.curId;
    },
    nodeData(state) {
      return state.nodeData;
    },
  },
  mutations: {
    setCurId(state, payload) {
      state.curId = payload;
    },
    setNodeData(state, payload) {
      state.nodeData = payload;
    },
  },
  actions: {
    startMoveNode(context) {
      const tree = context.rootGetters.treeData;
      const curId = context.getters["curId"];
      const parentId = context.rootGetters["freeze/id"];
      const nodeData = context.getters["nodeData"];
      try {
        if (parentId === curId) {
          throw new Error("You can't move node after itself");
        }
        const descendantIdList = tree.getDescendantList(curId).map((d) => d.id);
        if (descendantIdList.includes(parentId)) {
          throw new Error("You can't move node after its descendants");
        }
        // modify tree structure
        tree.moveNode(curId, parentId);

        // update circle graph
        context.dispatch("updateGraphDataByTree", [nodeData], { root: true });
      } catch (err) {
        ElMessage.warning(err.message);
      } finally {
        // set cur id back to -1
        context.commit("setCurId", -1);
        // set freeId back to -1
        context.commit("freeze/setId", -1, { root: true });
      }
    },
  },
};
