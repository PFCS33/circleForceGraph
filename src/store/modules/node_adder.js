// represent newly added node in filter panel, for circle-graph to listen
export default {
  namespaced: true,
  state() {
    return {
      // current added real id, provided by filter graph
      realId: -1,
      // current added node data
      nodeData: null,
      // parent id provided by circle graph
      parentId: -1,
      // flag for add processing
      isAdding: false,
    };
  },
  getters: {
    realId(state) {
      return state.realId;
    },
    nodeData(state) {
      return state.nodeData;
    },
    parentId(state) {
      return state.parentId;
    },
    isAdding(state) {
      return state.isAdding;
    },
  },
  mutations: {
    setRealId(state, payload) {
      state.realId = payload;
    },
    setNodeData(state, payload) {
      state.nodeData = payload;
    },
    setParentId(state, payload) {
      state.parentId = payload;
      context.dispatch("startAddNode", payload);
    },
    setIsAdding(state, payload) {
      state.isAdding = payload;
    },
  },
  actions: {
    startAddNode(context, payload) {
      const parentId = payload;
      const newNodeData = context.getters["nodeData"];
      context.commit("setIsAdding", true);
      context
        .dispatch(
          "addNewNode",
          {
            parentId: parentId,
            nodeData: newNodeData,
          },
          { root: true }
        )
        .then((res) => {
          ElMessage.success(res.message);
        })
        .catch((e) => {
          ElMessage.error(`Add Node Error: ${e.message}`);
        })
        .finally(() => {
          context.commit("setIsAdding", false);
          context.commit("setRealId", -1);
        });
    },
  },
};
