// represent current foucs node, mainly for filter panel to listen
export default {
  namespaced: true,
  state() {
    return {
      id: null, // refer to graph ndoe's id
    };
  },
  getters: {
    id(state) {
      return state.id;
    },
  },
  mutations: {
    setId(state, payload) {
      state.id = payload;
    },
  },
  actions: {
    changeId(context, paylaod) {
      context.commit("setId", paylaod);
    },
  },
};
