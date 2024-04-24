import { baseUrl, fetchData, postData } from "@/utils/serve";

export const getNodeDetail = (data) => {
  return fetchData({
    url: baseUrl + "/panel/" + data,
  });
};

export const getVlSpec = (data) => {
  return postData({
    url: baseUrl + "/panel/id-list",
    data: data,
  });
};
