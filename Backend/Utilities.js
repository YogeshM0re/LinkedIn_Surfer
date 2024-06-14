const fs = require("fs").promises;
const fsys = require("fs");

// Save cookie function
async function saveCookie(page) {
  const cookies = await page.cookies();
  const cookieJson = JSON.stringify(cookies, null, 2);
  await fs.writeFile("./cookies.json", cookieJson);
}

// Load cookie function
async function loadCookie(page) {
  try {
    const cookieJson = await fs.readFile("./cookies.json", "utf-8");
    const cookies = JSON.parse(cookieJson);
    await page.setCookie(...cookies);
    console.log("Cookies loaded and set.");
  } catch (error) {
    console.log("No cookies found, proceeding without loading cookies.");
  }
}

// Reduce page load by intercepting requests
async function reducePage(page) {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (["image", "stylesheet", "font"].includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });
}

// Intercept XHR requests and log their responses
async function interceptXHR(page, URLsegment) {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (
      request.resourceType() === "xhr" &&
      request.url().includes(URLsegment)
    ) {
      request.continue();
      request.response().then((response) => {
        response.json().then((data) => {
          console.log("XHR response:", data);
        });
      });
    } else {
      request.continue();
    }
  });
}

module.exports = {
  saveCookie,
  loadCookie,
  reducePage,
  interceptXHR,
};
