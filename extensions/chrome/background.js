import {
  fetchData,
  setDataToLocalStorage,
  getDataFromLocalStorage,
  localStorageKeys,
  constants,
  messages,
  checkDataExistenceInLocalStorage,
  checkIfIsTheSameDay,
  setUserNotification,
  removeUserNotification,
  setTitle,
} from "./utils/utils.js";

const baseUrl = "https://api.quotable.io"; // FIXME temporary until we set our own quotes API

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
  } catch (error) {
    console.error(error);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    const isSameDay = await checkIfIsTheSameDay();
    if (isSameDay) {
      const hasReadTodaysQuote = await getDataFromLocalStorage(
        localStorageKeys.hasReadTodaysQuote
      );
      if (hasReadTodaysQuote === constants.hasReadTodaysQuote) {
        return;
      }

      // Removes the title and notification each time close and restart chrome
      await Promise.all([setUserNotification(), setTitle()]);
    }
    // FIXME Move this code to a function so that it is reusable

    const [quotes, exposedQuotes] = await Promise.all([
      getDataFromLocalStorage(localStorageKeys.quotes),
      getDataFromLocalStorage(localStorageKeys.exposedQuotes),
    ]);
    const todaysQuote = quotes.pop();
    exposedQuotes.push(todaysQuote);

    // FIXME Move this code to a function so that it is reusable

    const [quotesSaved, todaysDateSaved, todaysQuoteSaved] = await Promise.all([
      setDataToLocalStorage(localStorageKeys.quotes, quotes),
      setDataToLocalStorage(localStorageKeys.todaysDate, Date.now()),
      setDataToLocalStorage(localStorageKeys.todaysQuote, todaysQuote),
      setDataToLocalStorage(localStorageKeys.exposedQuotes, exposedQuotes),
      setDataToLocalStorage(
        localStorageKeys.hasReadTodaysQuote,
        constants.hasNotReadTodaysQuote
      ),
    ]);
    if (quotesSaved && todaysDateSaved && todaysQuoteSaved) {
      await Promise.all([setUserNotification(), setTitle()]);
      console.log("Saved data to localstorage");
    }
  } catch (error) {
    console.error(error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case messages.setNotification:
      // chrome.runtime.onMessage doesn't support async await
      // You need to use .then to send a response when doing async work
      // And be sure to return true from the callback
      // https://stackoverflow.com/questions/44056271/chrome-runtime-onmessage-response-with-async-await
      // https://stackoverflow.com/questions/71520198/manifestv3-new-promise-error-the-message-port-closed-before-a-response-was-rece

      setUserNotification().then((response) => {
        if (response) {
          sendResponse({ type: messages.operationSuccessful });
        }
      });
      break;

    case messages.removeNotification:
      removeUserNotification().then((response) => {
        if (response) {
          sendResponse({ type: messages.operationSuccessful });
        }
      });
      break;

    default:
      sendResponse({ type: messages.unknownMessage });
      break;
  }

  return true;
});

