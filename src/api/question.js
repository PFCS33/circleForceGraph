import { baseUrl, postData } from "@/utils/common/serve";

export const getNextStep = (data) => {
  return postData({
    url: baseUrl + "/question/data",
    data: data,
  });
};
