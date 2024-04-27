import { baseUrl, fetchData } from "@/utils/common/serve";

export const getGraphData = () => {
  return fetchData({
    url: baseUrl + "/graph/data",
  });
};
