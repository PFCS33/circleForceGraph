/* provide utils to communicate with server*/
const baseUrl = "http://localhost:3000";

// GET
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

// Post
async function postData(url, data = {}) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const returnData = await response.json();
    return returnData;
  } catch (error) {
    throw error;
  }
}

export { baseUrl, fetchData, postData };
