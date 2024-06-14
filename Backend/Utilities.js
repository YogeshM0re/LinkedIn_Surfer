const fs = require("fs").promises;
const fsys = require("fs");

// Save cookie function
async function saveCookie(page) {
  const cookies = await page.cookies();
  const cookieJson = JSON.stringify(cookies, null, 2);
  await fs.writeFile("./cookies.json", cookieJson);
}

// Load cookie function
async function loadCookie(page, client) {
  // const retriveq = 'SELECT cookie from users WHERE id=$1';
  // const userID=1;
  // const R= await client.query(retriveq, [userID]);
  // const cooki=R.rows[0].cookie;
  // const cookieJsonw = JSON.stringify(cooki, null, 2);
  // await fs.writeFile('./linkedin_puppet_by_balaji/balaji.json', cookieJsonw);

  const cookieJson = await fs.readFile("./Backend/cookies.json", "utf-8");
  const cookies = JSON.parse(cookieJson);

  for (let i = 0; i < cookies.length; i++) {
    await page.setCookie(cookies[i]);
  }

  const currentCookies = await page.cookies();
  console.log("Set Cookies:", currentCookies);
}

async function reducePage(page) {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (["image"].indexOf(request.resourceType()) !== -1) {
      request.respond({
        body: fsys.readFileSync("./linkedin_puppet_by_balaji/local.png"),
      });
    } else {
      request.continue();
    }
  });
}

async function interceptXHR(URLsegment) {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (
      request.resourceType() === "xhr" &&
      request.url().indexOf(URLsegment) != -1
    ) {
      request.continue();
      request.response().then((response) => {
        return response.JSON;
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
