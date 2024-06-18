const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { launch } = require("puppeteer");
const { loadCookie, reducePage } = require("./Utilities");

dotenv.config({ path: ".env" });

const app = express();
const PORT = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINIAPIKEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const promptTemplate =
  "Using the information about the company and companies cxo's information in addition of our information create a custom invitation message for linkedIN to send to cxo's of the company for marketing our services and what we can offer and help them and Strictly adhere to 300 words length.";

const aboutME = {
  name: "Acumen",
  description:
    "We are a Software Engineering company focused on providing outsourced software development and software engineering teams to our clients globally. Our team has over 22 years of experience in software, and a very wide ranging domain and technology exposure. We work with global clients ranging from multi million dollar companies to startups.",
};

app.use(express.json());
app.use(
  cors({
    origin: "https://www.linkedin.com",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.post("/message", async (req, res) => {
  try {
    const completePrompt = `${promptTemplate}\nCompany and CXO Information: ${JSON.stringify(
      req.body
    )}\nOur information is: ${JSON.stringify(aboutME)}`;
    const result = await model.generateContent(completePrompt);
    const response = await result.response;
    console.log(response.text());
    res.send({ message: response.text() });
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.post("/sendInvite", async (req, res) => {
  let browser, page;
  try {
    browser = await launch({ headless: false });

    page = await browser.newPage();
    await loadCookie(page);

    await page.goto(req.body.ceoProfile);
    console.log("Page navigated to:", req.body.ceoProfile);

    await autoScroll(page);
    await page.waitForSelector(".artdeco-button__text");

    // Click the "Connect" button
    await page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll(".artdeco-button__text")
      );
      const connectButton = buttons.find(
        (button) => button.outerText.trim() === "Connect"
      );
      if (connectButton) {
        connectButton.click();
      }
    });

    // Wait for the "Add a note" button and click it
    const addNoteSelector = ".mr1.artdeco-button--secondary";
    await page.waitForSelector(addNoteSelector);
    await page.click(addNoteSelector);
    console.log("Clicked 'Add a note' button");

    // Wait for the textarea and type the message
    const message = "Hi, I want to connect with you.";
    await page.waitForSelector(".connect-button-send-invite__custom-message");
    await page.evaluate((message) => {
      document.querySelector(
        ".connect-button-send-invite__custom-message"
      ).value = message;
    }, message);
    console.log("Typed message in the textarea");

    // Click the "Send invitation" button
    const sendButtonSelector = '[aria-label="Send invitation"]';
    await page.waitForSelector(sendButtonSelector);
    await page.click(sendButtonSelector);
    console.log("Clicked 'Send invitation' button");

    res.send({ message: "Invite sent successfully" });
  } catch (error) {
    console.error("Error sending invite:", error);
    res.status(500).send({ error: "Internal Server Error" });
  } finally {
    if (browser) await browser.close();
  }
});

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
