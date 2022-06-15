import {
  fetchData,
  setDataToLocalStorage,
  getDataFromLocalStorage,
  setUserNotification,
  checkIfNewDayAndUpdateDatabaseIfSo,
  shuffleArray,
} from "./utils/utils.js";

import { constants, localStorageKeys } from "./utils/constants.js";

// FIXME temporary until we set our own quotes API
const baseUrl = "https://raw.githubusercontent.com";

// Triggers after installation and after browser/extension update
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason !== "install") {
      // onInstalled event triggered by chrome/extension update.
      // Updating chrome/extension removes notification. Retrieve
      // read status from local storage
      const localStorageData = await getDataFromLocalStorage([
        localStorageKeys.hasReadTodaysQuote,
      ]);

      const hasReadTodaysQuote =
        localStorageData[localStorageKeys.hasReadTodaysQuote];

      // Check if user has read today's quote and notify if not.
      if (hasReadTodaysQuote === constants.hasNotReadTodaysQuote) {
        // User has not read today's quote. Set user notification.
        await setUserNotification();
      }

      return; // Return without updating data in local storage
    }

    // onInstalled event tiggered by extension installation
    const url = new URL("nibble0101/Quotes/main/data/quotes.json", baseUrl);

    const quotes = await fetchData(url.href);
    const shuffledQuotes = shuffleArray(quotes);
    const todaysQuote = shuffledQuotes.pop();

    await setDataToLocalStorage({
      [localStorageKeys.quotes]: shuffledQuotes,
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
chrome.idle.onStateChanged.addListener(async (idleState) => {
  try {
    if (idleState === "active") {
      await checkIfNewDayAndUpdateDatabaseIfSo();
    }
  } catch (error) {
    console.error(error);
  }
});
