import { baseUrl, fetchData } from "@/utils/serve";

export const getGraphData = () => {
  return fetchData({
    url: baseUrl + "/graph/data",
  });
};
