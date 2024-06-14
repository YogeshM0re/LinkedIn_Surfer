const puppeteer = require("puppeteer");
const fs = require("fs").promises;

// Save cookie function
const saveCookie = async (page) => {
  const cookies = await page.cookies();
  const cookieJson = JSON.stringify(cookies, null, 2);
  await fs.writeFile("cookies.json", cookieJson);
};

// Load cookie function
const loadCookie = async (page) => {
  try {
    const cookieJson = await fs.readFile("cookies.json", "utf-8");
    const cookies = JSON.parse(cookieJson);
    await page.setCookie(...cookies);
  } catch (error) {
    console.log("No cookies found, proceeding without loading cookies.");
  }
};

const loginToLinkedIn = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await loadCookie(page);
    await page.goto("https://www.linkedin.com");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    if (page.url().includes("feed")) {
      console.log("Logged in using cookies");
    } else {
      await page.type("#session_key", "tihijol638@kernuo.com");
      await page.type("#session_password", "f@5*WkBZ+9a!F66");
      await page.click(".sign-in-form__submit-btn--full-width");
      await page.waitForNavigation();
      await saveCookie(page);
      console.log("Logged in using credentials and saved cookies");
    }
  } catch (error) {
    console.error("Error during login:", error);
  }

  return { browser, page };
};

const reducePage = async (page) => {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (["image", "stylesheet", "font"].includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });
};

const interceptXHR = async (page, URLsegment) => {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (
      request.resourceType() === "xhr" &&
      request.url().includes(URLsegment)
    ) {
      request.continue();
      request.response().then((response) => response.json());
    } else {
      request.continue();
    }
  });
};

module.exports = {
  loginToLinkedIn,
  saveCookie,
  loadCookie,
  reducePage,
  interceptXHR,
};
