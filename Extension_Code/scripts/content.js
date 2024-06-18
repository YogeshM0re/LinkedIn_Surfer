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

let isPaused = false;
let pageCount = 1;

function main() {
  const sliderInnerHTMLString = generateSliderHTML();
  sliderGen(sliderInnerHTMLString);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.todo === "toggle") {
      slider();
    }
  });

  document
    .getElementById("Url_extract_button")
    .addEventListener("click", async () => {
      document.getElementById("CompanyUrl").value = JSON.stringify(
        await extract()
      );
      console.log("extracted");
    });
  document
    .getElementById("skills_extract_button")
    .addEventListener("click", scrapeAllPages);

  document.getElementById("pause_button").addEventListener("click", () => {
    isPaused = true;
    console.log("paused");
  });
  document.getElementById("resume_button").addEventListener("click", () => {
    isPaused = false;
    goToNextPage();
    console.log("resumed");
  });
}

function generateSliderHTML() {
  return `<!-- HEADER IS HERE -->
      <div id='header'>
          <img src='https://acumen.llc/Software-Companies-Mumbai-India-Images/Acumen-logo-tb.png' alt='Logo'/>
          <h1>LinkedIn Surfer</h1>
      </div>
      <br/>
      <div id='inputSection'>
        <div class='flex-container'>
            <input type='text' id='inputDesignation' placeholder='Enter designation'/>
        </div>
        <br/>
        <div class='flex-container'>
            <label for='pageLimit'>Page Limit: </label>
            <input type='number' id='pageLimit' placeholder='Enter page limit' value='1'/>
            <button class='internal_button' id='skills_extract_button'>Scan</button>
    
        </div>
        <div id='Url_extract_button'></div>
        <button class='internal_button' id='pause_button'>Pause</button>
        <button class='internal_button' id='resume_button' style='display:none'>Resume</button> 
        <button class='internal_button' id='save_button' style='display:none'>Save</button> 
        <button class='internal_button' id='cancel_button' style='display:none'>Cancel</button> 
    </div>
      <!-- THE BODY CONTAINER IS HERE -->
      <div id='sbodycontainer'>
          <br/>
          <br/>
          <span style='font-size: 10px'><i> </i></span>
          <textarea id='CompanyUrl'></textarea>
          <br/>
      </div>
      <!-- THE FOOTER IS HERE -->
      <div id='sfooter'><hr/>
      </div>`;
}

function getDesignation() {
  const inputDesignation = document.getElementById("inputDesignation").value;
  if (inputDesignation.trim() === "") {
    alert("Designation cannot be empty");
    return "";
  }
  return inputDesignation;
}

async function readCookies() {
  return await cookieStore.getAll();
}

async function saveProfileData() {
  const designation = getDesignation();
  if (designation === "") return;

  const textBoxIds = ["CompanyUrl"];
  const profileData = textBoxIds.reduce((data, id) => {
    const key = id.includes("text") ? id.replace("text", "") : id;
    data[key] = document.getElementById(id).value || "No data";
    return data;
  }, {});

  const filename = prompt("Enter file name:");
  const data = new Blob([JSON.stringify(profileData)], {
    type: "application/json",
  });
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
  const requestData = {
    Url: profileData.CompanyUrl,
    Desc: designation,
    UserCookie: cookies,
  };
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

  const titleElement = document.querySelector(
    ".org-top-card__primary-content h1"
  );
  if (titleElement) info.name = titleElement.innerText.trim();

  const overviewElement = document.querySelector(
    ".org-page-details-module__card-spacing p"
  );
  if (overviewElement) info.overview = overviewElement.innerText.trim();

  const websiteElement = document.querySelector('a[rel="noopener noreferrer"]');
  if (websiteElement) info.website = websiteElement.href;

  const details = [
    "Industry",
    "Company size",
    "Headquarters",
    "Founded",
    "Specialties",
  ];
  details.forEach((detail) => {
    const value = getTextNextToDt(detail);
    if (value) info[detail.toLowerCase().replace(" ", "")] = value;
  });

  const locationElements = document.querySelectorAll(".org-location-card p");
  if (locationElements) {
    info.locations = Array.from(locationElements).map((location) =>
      location.innerText.trim()
    );
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
  const delay =
    Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  setTimeout(() => {
    element.dispatchEvent(new MouseEvent("mousedown"));
    setTimeout(() => {
      element.dispatchEvent(new MouseEvent("mouseup"));
    }, 10);
  }, delay);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractCompanyInfoFromLink(link, companyInfo) {
  try {
    const companyTab = window.open(link + "about/", "_blank");
    await waitForLoad(companyTab);

    companyTab.scrollTo(0, companyTab.document.body.scrollHeight);
    await sleep(2000);

    const companyData = await companyTab.extractCompanyInfo();
    console.log("Company data:", companyData);
    companyTab.close();

    const designation = document.getElementById("inputDesignation").value;
    const peopleTab = window.open(
      link + `people/?keywords=${designation}`,
      "_blank"
    );
    await waitForLoad(peopleTab);

    peopleTab.scrollTo(0, peopleTab.document.body.scrollHeight);
    await sleep(2000);

    const profileLink = peopleTab.document.querySelector(
      ".org-people-profile-card__profile-info a.app-aware-link"
    );
    if (profileLink) {
      const profileTab = window.open(profileLink.href, "_blank");
      await waitForLoad(profileTab);

      profileTab.scrollTo(0, profileTab.document.body.scrollHeight);
      await sleep(2000);

      const aboutSection = profileTab.document.querySelector(
        'section.artdeco-card[data-view-name="profile-card"]'
      );
      const aboutText = aboutSection
        ? aboutSection
            .querySelector(
              '.inline-show-more-text--is-collapsed span[aria-hidden="true"]'
            )
            .textContent.trim()
        : "";

      profileTab.close();
      companyInfo.push({
        ...companyData,
        ceoProfile: profileLink.href,
        ceoAbout: aboutText,
      });

      await fetchdata(
        "http://localhost:3000",
        "/message",
        "POST",
        companyInfo[companyInfo.length - 1]
      );
      await fetchdata("http://localhost:3000", "/sendInvite", "POST", {
        ceoProfile: profileLink.href,
      });
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
    tab.addEventListener("error", (error) => reject(error));
  });
}

async function extract() {
  const appAwareLinks = document.querySelectorAll(
    ".scaffold-layout__main .entity-result__title-text .app-aware-link"
  );
  const companyInfo = [];

  for (let i = 0; i < appAwareLinks.length; i++) {
    const hrefValue = appAwareLinks[i].getAttribute("href");
    await extractCompanyInfoFromLink(hrefValue, companyInfo);

    // Append the data for the current company to textarea
    const currentData = JSON.stringify(companyInfo);
    const currentTextareaValue = document.getElementById("CompanyUrl").value;
    console.log("Current Data", currentData);
    const newDataToAppend = currentTextareaValue
      ? `${currentTextareaValue}, ${currentData}`
      : currentData;
    document.getElementById("CompanyUrl").value = newDataToAppend;
  }

  return companyInfo;
}

let currentScrapingIndex = 0; // Track which company link is currently being scraped

function completeScraping() {
  const allDataTextarea = document.getElementById("CompanyUrl");
  allData = JSON.parse(`[${allDataTextarea.value}]`);

  const filename = prompt("Enter file name:");
  const data = new Blob([JSON.stringify(allData)], {
    type: "application/json",
  });
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
}
async function goToNextPage() {
  if (isPaused) return;

  window.scrollTo(0, document.body.scrollHeight);

  setTimeout(async () => {
    if (pageCount < pageLimit) {
      const nextPageButton = document.querySelector(
        ".artdeco-pagination__button--next .artdeco-button__text"
      );
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
async function scrapeAllPages() {
  const designation = getDesignation();
  if (designation === "") return;

  let allData = [];
  pageCount = 1;
  const pageLimit = parseInt(document.getElementById("pageLimit").value, 10);

  async function scrapeCurrentPage() {
    const appAwareLinks = document.querySelectorAll(
      ".scaffold-layout__main .entity-result__title-text .app-aware-link"
    );

    // Continue scraping from the last index where we paused
    for (let i = currentScrapingIndex; i < appAwareLinks.length; i++) {
      if (isPaused) {
        currentScrapingIndex = i; // Save current index to resume from later
        return;
      }

      const hrefValue = appAwareLinks[i].getAttribute("href");
      await extractCompanyInfoFromLink(hrefValue, allData);

      const currentData = JSON.stringify(allData);
      const currentTextareaValue = document.getElementById("CompanyUrl").value;
      const newDataToAppend = currentTextareaValue
        ? `${currentTextareaValue}, ${currentData}`
        : currentData;
      document.getElementById("CompanyUrl").value = newDataToAppend;

      currentScrapingIndex = i + 1;
    }
    goToNextPage();
  }
  scrapeCurrentPage();
}

document.getElementById("pause_button").addEventListener("click", () => {
  isPaused = true;
  toggleButtonVisibility("pause_button", false);
  toggleButtonVisibility("resume_button", true);
  toggleButtonVisibility("save_button", true);
  toggleButtonVisibility("cancel_button", true);
  console.log("Paused scraping");
});

document.getElementById("resume_button").addEventListener("click", () => {
  isPaused = false;
  goToNextPage();
  toggleButtonVisibility("pause_button", true);
  toggleButtonVisibility("resume_button", false);
  toggleButtonVisibility("save_button", false);
  toggleButtonVisibility("cancel_button", false);
  console.log("Resumed scraping");
});

document.getElementById("cancel_button").addEventListener("click", () => {
  isPaused = true; // Set isPaused to true to stop scraping
  currentScrapingIndex = 0; // Reset scraping index
  location.reload(); // Reload the page to cancel scraping and clear data
});

function toggleButtonVisibility(buttonId, visible) {
  const button = document.getElementById(buttonId);
  button.style.display = visible ? "inline-block" : "none";
}
// Save button functionality
document.getElementById("save_button").addEventListener("click", async () => {
  const allDataTextarea = document.getElementById("CompanyUrl");
  const allData = JSON.parse(`[${allDataTextarea.value}]`);

  const filename = prompt("Enter file name:");
  if (filename) {
    const data = new Blob([JSON.stringify(allData)], {
      type: "application/json",
    });
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
  }
});
