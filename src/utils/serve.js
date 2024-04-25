/* provide utils to communicate with server*/
const baseUrl = "/server";

/* GET: async - await form
 */
// async function fetchData(url) {
//   try {
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     return data;
//   } catch (error) {
//     throw error;
//   }
// }

/* GET: Promise form
 * wrap to return a new promise
 * resolve when get real response's data
 */
function fetchData({ url }) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        } else {
          return res.json();
        }
      })
      .then((data) => resolve(data))
      .catch((error) => {
        reject(error);
      });
  });
}

// Post
function postData({ url, data }) {
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        resolve(data);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export { baseUrl, fetchData, postData };
