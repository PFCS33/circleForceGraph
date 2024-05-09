export default {
  namespaced: true,
  state() {
    return {
      id: -1,
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
  actions: {},
};
