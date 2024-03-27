import { baseUrl, fetchData } from "@/utils/api";

export default {
  state() {
    return {
      // data directly from server
      rawData: null,
      // data for drawing circleGraph
      graphData: null,
      // columns' name
      colInfoMap: null,
    };
  },
  getters: {
    rawData(state) {
      return state.rawData;
    },
    graphData(state) {
      return state.graphData;
    },
    colInfoMap(state) {
      return state.colInfoMap;
    },
  },
  mutations: {
    setRawData(state, payload) {
      state.rawData = payload;
    },
    setGraphData(state, payload) {
      state.graphData = payload;
    },
    setColInfoMap(state, payload) {
      state.colInfoMap = payload;
    },
  },
  actions: {
    // load raw data and process it
    initRawData(context, paylaod) {
      return new Promise((resolve, reject) => {
        fetchData(baseUrl + "/graph/data")
          .then((rawData) => {
            context.commit("setRawData", rawData);
            context.dispatch("processRawData", rawData);
            resolve({
              message: "Calculation complete.",
            });
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    processRawData(context, payload) {
      // set graph data
      context.commit("setGraphData", {
        node: payload.node,
        link: payload.link,
      });
      // set column info
      const colRawData = payload.columnInfo;
      const colInfoMap = new Map();
      for (const prop in colRawData) {
        if (Object.hasOwn(colRawData, prop)) {
          colInfoMap.set(prop, colRawData[prop]);
        }
      }
      context.commit("setColInfoMap", colInfoMap);
      // TODO: contruct tree struture based on raw data
    },

    // abandoned way: async-await
    // async _initRawData(context, paylaod) {
    //   // fetch data from server
    //   try {
    //     const rawData = await fetchData(baseUrl + "/graph/data");
    //     context.dispatch("processRawData", rawData);
    //     ElMessage.success(`Calculation complete`);
    //     context.commit("setRawData", rawData);
    //     // construct tree structure based on raw data
    //   } catch (e) {
    //     ElMessage.error(`Graph Error: ${e.message}`);
    //   }
    // },
  },
};
