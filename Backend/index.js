const express=require("express")
const app=express()
const cors=require("cors")
const dotenv=require("dotenv")
const { GoogleGenerativeAI } = require("@google/generative-ai");
const puppeteer = require("puppeteer");

dotenv.config({path:".env"})

const genAI = new GoogleGenerativeAI(process.env.GEMINIAPIKEY)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
const prompt="Using the information about the company and companies cxo's information in addition of our information create a custom invitation message for linkedIN to send to cxo's of the company for marketing our services and what we can offer and help them and Strictly adhere to 300 words length."


const PORT=process.env.PORT || 3000
app.use(express.json())
app.use(cors({
     origin:"https://www.linkedin.com",
     credentials:true,
     allowedHeaders:["Content-Type","Authorization"],
     exposedHeaders:["Content-Type","Authorization"],
     methods:["GET","POST","PUT","DELETE"],
}))

app.post("/message", async (req, res) => {
     try {
     
         const aboutME = {name:"Acumen.",
          description:"We are a Software Engineering company focused on providing outsourced software development and software engineering teams to our clients globally. Our team has over 22 years of experience in software, and a very wide ranging domain and technology exposure. We work with global clients ranging from multi million dollar companies to startups."};
 
         const completePrompt = `${prompt}\nCompany and CXO Information: ${JSON.stringify(req.body)}\nOur information is: ${JSON.stringify(aboutME)}`;
 
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
     try {
         const browser = await puppeteer.launch({ headless: true });
         const page = await browser.newPage();
         await page.goto(req.body.ceoProfile, { waitUntil: "networkidle2" });
         console.log("Page navigated to:", req.body.ceoProfile);
         async function autoScroll(page) {
             await page.evaluate(async () => {
                 await new Promise((resolve, reject) => {
                     let totalHeight = 0;
                     let distance = 100;
                     let timer = setInterval(() => {
                         let scrollHeight = document.body.scrollHeight;
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

         autoScroll(page);
         const connectButtonSelector = "[aria-label^='Invite']";
         await page.waitForSelector(connectButtonSelector);
         await page.click(connectButtonSelector);
 
         const sendButtonSelector = 'button[aria-label="Send now"]';
         await page.waitForSelector(sendButtonSelector);
         await page.click(sendButtonSelector);
 
         await browser.close();
         res.send({ message: "Invite sent successfully" });
 
     } catch (error) {
         console.error("Error generating response:", error);
         if (browser) await browser.close();
         res.status(500).send({ error: "Internal Server Error" });
     }
 });

app.listen(PORT,()=>console.log(`Server running on port ${PORT}`))