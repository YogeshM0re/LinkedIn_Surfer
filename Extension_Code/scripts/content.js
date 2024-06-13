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
  var sliderInnerHTMLString = `<!-- HEADER IS HERE -->
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
    </div>
  `;
  sliderGen(sliderInnerHTMLString);
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.todo == "toggle") {
      slider();
    }
  });
  document
    .getElementById("clear_text_button")
    .addEventListener("click", function () {
      var ids = ["CompanyUrl"];
      for (var i = 0; i < ids.length; i++) {
        document.getElementById(ids[i]).value = "";
      }
    });
  document
    .getElementById("Url_extract_button")
    .addEventListener("click", async function () {
      console.log("slidersscrolled");
      document.getElementById("CompanyUrl").value = JSON.stringify(
        await extract()
      );
    });

  document
    .getElementById("skills_extract_button")
    .addEventListener("click", scrapeAllPages);

  document
    .getElementById("send_request")
    .addEventListener("click", send_request);

  document
    .getElementById("save_profile_data_button")
    .addEventListener("click", saveProfileData);
}

async function send_request() {
  console.log("request sent");
  sendConnectRequest(window);
}

function Description() {
  var inputDescription = document.getElementById("inputDescription").value;
  if (inputDescription.trim() === "") {
    alert("Description cannot be empty");
    return "";
  } else {
    return inputDescription;
  }
}

async function readCookies() {
  const cok = await cookieStore.getAll();
  return cok;
}

async function saveProfileData() {
  var DesC = Description();
  if (DesC === "") {
    return;
  }
  var textBoxIds = ["CompanyUrl"];
  var profileData = {};
  for (var i = 0; i < textBoxIds.length; i++) {
    var tempid = textBoxIds[i];
    if (tempid.includes("text")) tempid = tempid.replace("text", "");

    if (document.getElementById(textBoxIds[i]).value)
      profileData[tempid] = JSON.parse(
        document.getElementById(textBoxIds[i]).value
      );
    else profileData[tempid] = "No data";
  }
  var filename = prompt("Enter file Name:");
  var data = new Blob([JSON.stringify(profileData)], {
    type: "application/json",
  });
  var a = document.createElement("a"),
    url = URL.createObjectURL(data);
  a.href = url;
  a.download = filename + ".txt";
  document.body.appendChild(a);
  a.click();

  var cookie = await readCookies();

  let Data = { Url: profileData.CompanyUrl, Desc: DesC, UserCookie: cookie };
  console.log(Data);

  let urls = "https://api-linkedin.acumen.llc";
  let apipath = "/linkedinrls";
  let method = "POST";

  await fetchdata(urls, apipath, method, Data);
  setTimeout(function () {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

function sliderGen(sliderInnerHTMLString) {
  var slider = document.createElement("div");
  slider.id = "slider";
  var sliderDivInnerHTML = sliderInnerHTMLString;

  slider.innerHTML += sliderDivInnerHTML;

  document.body.prepend(slider);
}

function slider() {
  var slider = document.getElementById("slider");
  var styler = slider.style;
  if (styler.width == "0px") {
    styler.width = "400px";
  } else {
    styler.width = "0px";
  }
}

async function extractCompanyInfo() {
  const info = {};

  const titleElement = document.querySelector(
    ".org-top-card__primary-content h1"
  );
  if (titleElement) {
    info.name = titleElement.innerText.trim();
  }

  const overviewElement = document.querySelector(
    ".org-page-details-module__card-spacing p"
  );
  if (overviewElement) {
    info.overview = overviewElement.innerText.trim();
  }

  const websiteElement = document.querySelector('a[rel="noopener noreferrer"]');
  if (websiteElement) {
    info.website = websiteElement.href;
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

  info.industry = getTextNextToDt("Industry");
  info.companySize = getTextNextToDt("Company size");
  info.headquarters = getTextNextToDt("Headquarters");
  info.founded = getTextNextToDt("Founded");
  info.specialties = getTextNextToDt("Specialties");

  const locationElements = document.querySelectorAll(".org-location-card p");
  if (locationElements) {
    info.locations = Array.from(locationElements).map((location) =>
      location.innerText.trim()
    );
  }

  Object.keys(info).forEach((key) => {
    if (info[key] === null) {
      delete info[key];
    }
  });

  return info;
}

function findConnectButton(profileTab) {
  return profileTab.document.querySelector("[aria-label^='Invite']");
}
function simulateClick(element, minDelay, maxDelay) {
  // Generate a random delay between the specified minimum and maximum
  var delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

  setTimeout(function () {
    // Simulate mousedown event
    element.dispatchEvent(new MouseEvent("mousedown"));

    // Simulate mouseup event after the delay
    setTimeout(function () {
      element.dispatchEvent(new MouseEvent("mouseup"));
    }, 10); // Short additional delay to simulate click duration (adjust as needed)
  }, delay);
}

function sendConnectRequest(profileTab, callback) {
  const connectButton = findConnectButton(profileTab);
  console.log("Connect Button", connectButton);
  if (connectButton) {
    connectButton.click();
    simulateClick(connectButton, 1000, 2000);
    console.log("Connect button clicked by mouse.");

    console.log("Connect button clicked.");
    // Wait for the dialog box to appear
    // waitForDialog(profileTab)
    // .then(() => {
    //   const inviteButton = profileTab.document.querySelector(
    //     '.send-invite[role="dialog"] button.artdeco-button--primary[aria-label="Send without a note"]'
    //   );
    //   if (inviteButton) {
    //     inviteButton.click();
    //     console.log("Invite sent without a note.");
    //   } else {
    //     console.log("Invite button not found.");
    //   }
    //   // Call the callback function after sending the invite
    //   if (callback) callback();
    // })
    // .catch((error) => {
    console.log("Connect button clicked.");
    // Wait for the dialog box to appear
    // waitForDialog(profileTab)
    // .then(() => {
    //   const inviteButton = profileTab.document.querySelector(
    //     '.send-invite[role="dialog"] button.artdeco-button--primary[aria-label="Send without a note"]'
    //   );
    //   if (inviteButton) {
    //     inviteButton.click();
    //     console.log("Invite sent without a note.");
    //   } else {
    //     console.log("Invite button not found.");
    //   }
    //   // Call the callback function after sending the invite
    //   if (callback) callback();
    // })
    // .catch((error) => {
    //   console.error("Error sending invite:", error);
    //   if (callback) callback();
    // });
  } else {
    console.log("Connect button not found.");
    if (callback) callback();
  }
}

function waitForDialog(profileTab, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const dialog = profileTab.document.querySelector(
        '.send-invite[role="dialog"]'
      );
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
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractCompanyInfoFromLink(link, companyInfo) {
  var msg ="";
  try {
    var companyTab = window.open(link + "about/", "_blank");
    await waitForLoad(companyTab);

    companyTab.scrollTo(0, companyTab.document.body.scrollHeight);
    await sleep(2000);

    var companyData = await companyTab.extractCompanyInfo();
    companyTab.close();

    var peopleTab = window.open(link + "people/?keywords=ceo", "_blank");
    await waitForLoad(peopleTab);

    peopleTab.scrollTo(0, peopleTab.document.body.scrollHeight);
    await sleep(2000);

    var profileLink = peopleTab.document.querySelector(
      ".org-people-profile-card__profile-info a.app-aware-link"
    );
    if (profileLink) {
      var profileTab = window.open(profileLink.href, "_blank");
      const url = "http://localhost:3000";
      const path = "/message";
      const method = "POST";
      await waitForLoad(profileTab);

      profileTab.scrollTo(0, profileTab.document.body.scrollHeight);
      await sleep(2000);

      const aboutSection = profileTab.document.querySelector(
        'section.artdeco-card[data-view-name="profile-card"]'
      );
      if (aboutSection) {
        const aboutTextElement = aboutSection.querySelector(
          '.inline-show-more-text--is-collapsed span[aria-hidden="true"]'
        );
        const aboutText = aboutTextElement
          ? aboutTextElement.textContent.trim()
          : "";
        profileTab.close();
        companyInfo.push({
          ...companyData,
          ceoProfile: profileLink.href,
          ceoAbout: aboutText,
        });
        await fetchdata(
          url,
          path,
          method,
          companyInfo[companyInfo.length - 1]
        )
        .then((response) => response.json())
        .then((data) => {
          msg = data;
        });
        console.log("Message:",msg.message);
       await fetchdata(url, "/sendInvite", method, {
          ceoProfile: profileLink.href,
        })
        
      } else {
        console.log("No About section found.");
        profileTab.close();
        companyInfo.push({ ...companyData, ceoProfile: profileLink.href });
      }
    } else {
      console.log("No CEO profile link found.");
      companyInfo.push(companyData);
    }
    peopleTab.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Utility function to wait for a tab to load
function waitForLoad(tab) {
  return new Promise((resolve, reject) => {
    tab.addEventListener("load", function () {
      resolve();
    });
    tab.addEventListener("error", function (error) {
      reject(error);
    });
  });
}

// Utility function to add a delay
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extract() {
  var appAwareLinks = document.querySelectorAll(
    ".scaffold-layout__main .entity-result__title-text .app-aware-link"
  );
  var companyInfo = [];

  if (appAwareLinks.length > 0) {
    for (let i = 0; i < appAwareLinks.length; i++) {
      var hrefValue = appAwareLinks[i].getAttribute("href");
      await extractCompanyInfoFromLink(hrefValue, companyInfo);
    }
  } else {
    console.error(
      "No elements with class 'app-aware-link' found inside '.scaffold-layout__main'."
    );
  }

  console.log("Company Info:", companyInfo);
  return companyInfo;
}

async function scrapeAllPages() {
  var DesC = Description();
  if (DesC === "") {
    return;
  }

  var allData = [];
  let pageCount = 1;
  let pageLimit = parseInt(document.getElementById("pageLimit").value, 10);

  async function goToNextPage() {
    function scrollToBottom() {
      window.scrollTo(0, document.body.scrollHeight);
    }
    scrollToBottom();

    setTimeout(async function () {
      if (pageCount < pageLimit) {
        var nextPageButton = document.querySelector(
          ".artdeco-pagination__button--next .artdeco-button__text"
        );

        if (nextPageButton) {
          nextPageButton.click();

          pageCount++;

          setTimeout(scrapeCurrentPage, 1000);
        } else {
          console.log("No next page button found. Scraping completed.");
          completeScraping();
        }
      } else {
        console.log("Page limit reached. Scraping completed.");
        completeScraping();
      }
    }, 3000);
  }

  function completeScraping() {
    console.log("All Data:", allData);
    document.getElementById("CompanyUrl").value = JSON.stringify(allData);

    saveProfileData(allData);

    let url = "https://api-linkedin.acumen.llc";
    let apipath = "/linkedinrls";
    let method = "POST";
    let data = allData;

    try {
      fetchdata(url, apipath, method, data);
    } catch (error) {
      console.error("Error posting data:", error);
    }
  }

  async function scrapeCurrentPage() {
    var currentPageData = await extract();
    allData = allData.concat(currentPageData);
    goToNextPage();
  }

  scrapeCurrentPage();
  return allData;
}
