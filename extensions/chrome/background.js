import {
  fetchData,
  setDataToLocalStorage,
  getDataFromLocalStorage,
  localStorageKeys,
  constants,
  setUserNotification,
  checkIfNewDayAndUpdateDatabaseIfSo,
} from "./utils/utils.js";

const baseUrl = "https://api.quotable.io"; // FIXME temporary until we set our own quotes API

// Triggers after installation and after browser/extension update
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const todaysQuoteFromLocalStorage = await getDataFromLocalStorage([
      localStorageKeys.todaysQuote,
    ]);

    // onInstalled event triggered by chrome/extension update
    if (todaysQuoteFromLocalStorage?.[localStorageKeys.todaysQuote]) {
      console.log("Either extension or chrome has been updated");
      return;
    }

    // onInstalled event tiggered by extension installation
    const url = new URL("quotes", baseUrl);
    url.searchParams.set("tags", "inspirational");

    const quotes = await fetchData(url.href);
    const todaysQuote = quotes.results.pop();

    await setDataToLocalStorage({
      [localStorageKeys.quotes]: quotes.results,
      [localStorageKeys.todaysDateInMs]: Date.now(),
      [localStorageKeys.todaysQuote]: todaysQuote,
      [localStorageKeys.exposedQuotes]: [todaysQuote],
      [localStorageKeys.hasReadTodaysQuote]: constants.hasNotReadTodaysQuote,
    });
    await setUserNotification();
  } catch (error) {
    console.error(error);
  }
});

// Triggered when browser is started
chrome.runtime.onStartup.addListener(async () => {
  try {
    await checkIfNewDayAndUpdateDatabaseIfSo();
  } catch (error) {
    console.error(error);
  }
});

// Triggered when idle state of the device changes
chrome.idle.onStateChanged.addListener(async(idleState) => {
  try {
    if (idleState === "active") {
     await checkIfNewDayAndUpdateDatabaseIfSo();
    }
  } catch (error) {
    console.error(error);
  }
});
