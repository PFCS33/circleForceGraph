import { baseUrl, fetchData, postData } from "@/utils/serve";

export const getNodeId = () => {
  return fetchData({
    url: baseUrl + "/filter/id",
  });
};

export const getInsights = (data) => {
  return postData({
    url: baseUrl + "/filter/scope",
    data: data,
  });
};
