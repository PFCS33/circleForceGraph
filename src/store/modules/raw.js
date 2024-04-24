import { Tree } from "@/utils/tree";
import { getGraphData } from "@/api/graph";
import { getNodeId } from "@/api/filter";
import { getNextStep } from "@/api/question";

export default {
  state() {
    return {
      // tree data for tracing user exploration statement
      treeData: null,
      // data for drawing circleGraph
      graphData: null,
      // columns' name
      colInfoMap: null,
    };
  },
  getters: {
    treeData(state) {
      return state.treeData;
    },
    graphData(state) {
      return state.graphData;
    },
    colInfoMap(state) {
      return state.colInfoMap;
    },
  },
  mutations: {
    setTreeData(state, paylaod) {
      state.treeData = paylaod;
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
        getGraphData()
          .then((res) => {
            const rawData = res.data;
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
    // post question ,and then add nodes in tree & update graph
    postQuestion(context, payload) {
      return new Promise((resolve, reject) => {
        getNextStep(payload)
          .then((res) => {
            const data = res.data;
            const newNodeInfo = data.node;
            context.dispatch("addTreeNode", {
              parent: payload.id,
              children: newNodeInfo,
              question: payload.content,
            });
            // update graph data
            context.dispatch("updateGraphDataByTree", newNodeInfo);
            resolve({
              message: "Query complete.",
            });
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    // add new node from filter panel
    addNewNode(context, payload) {
      return new Promise((resolve, reject) => {
        getNodeId()
          .then((res) => {
            const id = res.data.id;
            const newNodeInfo = [
              {
                ...payload,
                id: id,
              },
            ];
            context.dispatch("addTreeNode", {
              parent: 0,
              children: newNodeInfo,
              question: null,
            });
            // update graph data
            context.dispatch("updateGraphDataByTree", newNodeInfo);
            resolve({
              message: "Add complete.",
            });
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    // initialization of all states data
    processRawData(context, payload) {
      // set column info, for filter panel
      const colRawData = payload.columnInfo;
      const colInfoMap = new Map();
      for (const prop in colRawData) {
        if (Object.hasOwn(colRawData, prop)) {
          // colRawData[prop].unshift("*");
          colInfoMap.set(prop, colRawData[prop]);
        }
      }
      context.commit("setColInfoMap", colInfoMap);
      // construct tree
      const tree = new Tree();
      context.commit("setTreeData", tree);
      // add node into tree
      const newNodeInfo = payload.node;
      context.dispatch("addTreeNode", {
        parent: 0,
        children: newNodeInfo,
        question: null,
      });
      // update graph data
      context.dispatch("updateGraphDataByTree", newNodeInfo);
    },

    /*
      add nodes into tree
      payload: {
        parent: id
        children: nodes's id from backend severs
      }
    */
    addTreeNode(context, payload) {
      const tree = context.getters["treeData"];

      tree.addNodes(
        payload.parent,
        payload.children.map((d) => ({
          // refer to visual id
          id: d.id,
          real_id: d["real_id"],
          question: payload.question,
        }))
      );
    },

    /* detete node from tree & update graph
     */
    deleteTreeNode(context, payload) {
      const tree = context.getters["treeData"];
      tree.deleteNode(payload.id);
      context.dispatch("updateGraphDataByTree", []);
    },

    /*
     * calways happens after change of tree data
     * construct new link & node data for graph
     * payload: new node info
     */
    updateGraphDataByTree(context, paylaod) {
      // get nodes' layer info & links from tree
      const tree = context.getters["treeData"];
      const layerInfo = tree.getDescendantList();
      const links = tree.getLinkList();
      // get map for new node info
      const newNodeMap = new Map();
      paylaod.forEach((node) => {
        newNodeMap.set(node.id, node);
      });
      // constructed new nodes
      const newNodes = layerInfo.map((item) => {
        const nodeInfo = newNodeMap.get(item.id);
        if (nodeInfo) {
          return { ...nodeInfo, layer: item.layer };
        } else {
          return { ...item };
        }
      });
      // set graph data
      context.commit("setGraphData", {
        node: newNodes,
        link: links,
      });
    },
  },
};
