const { launch } = require("puppeteer");
const fs = require("fs").promises;

// const contents = fs.readFile('list.json', 'utf-8');

//save cookie function
const saveCookie = async (page) => {
  const cookies = await page.cookies();
  const cookieJson = JSON.stringify(cookies, null, 2);
  await fs.writeFile("cookies.json", cookieJson);
};

//load cookie function
const loadCookie = async (page) => {
  const cookieJson = await fs.readFile("cookies.json");
  const cookies = JSON.parse(cookieJson);
  await page.setCookie(...cookies);
};

(async () => {
  const browser = await launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://www.linkedin.com/login");
  await page.type("#username", "tamab28841@noefa.com");
  await page.type("#password", "f@5*WkBZ+9a!F66");
  await page.click(".btn__primary--large");
  await page.waitForNavigation();

  await saveCookie(page); //save cookie
  //
  await browser.close();
})();
async function reducePage(page) {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (
      ["image", "stylesheet", "font"].indexOf(request.resourceType()) !== -1
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });
}

async function interceptXHR(page, URLsegment) {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (
      request.resourceType() === "xhr" &&
      request.url().indexOf(URLsegment) !== -1
    ) {
      request.continue();
      request.response().then((response) => {
        return response.json(); // Return the parsed JSON response
      });
    } else {
      request.continue();
    }
  });
}

module.exports = { saveCookie, loadCookie, reducePage, interceptXHR };
