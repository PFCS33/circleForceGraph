import { baseUrl, postData } from "@/utils/serve";

export const getNextStep = (data) => {
  return postData({
    url: baseUrl + "/question/data",
    data: data,
  });
};
