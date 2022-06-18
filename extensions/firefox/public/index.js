import {
  setDataToLocalStorage,
  checkIfIsTheSameDay,
  getDataFromLocalStorage,
  getFullWeekDay,
  removeUserNotification,
  shuffleArray,
  getRandomInteger,
} from "../utils/utils.js";

import { constants, localStorageKeys } from "../utils/constants.js";

const quoteEl = document.getElementById("quote");
const authorEl = document.getElementById("author");
const introEl = document.getElementById("intro");
const closeBtnEl = document.getElementById("close-btn");
const getNewQuoteBtnEl = document.getElementById("get-new-quote");

const cache = { quotes: [] };

/**
 * Updates the UI
 * @param {Object} details - Quote details for updating UI
 */
const updateUI = (details) => {
  quoteEl.innerText = details.quote;
  authorEl.innerText = details.author;
  introEl.innerText = details.intro;
};

/**
 * Gets introduction text with day of the week
 * @returns {String}
 */
const getIntroText = () => {
  return `Your ${getFullWeekDay()} inspiration`;
};

/**
 * Closes popup window
 */
closeBtnEl.addEventListener("click", () => {
  window.close();
});

/**
 * Get random quote and update UI
 */
getNewQuoteBtnEl.addEventListener("click", async () => {
  try {
    // Retrieve unread quotes if no cached quotes
    if (cache.quotes.length === 0) {
      const quotesFromLocalStorage = await getDataFromLocalStorage([
        localStorageKeys.quotes,
        localStorageKeys.exposedQuotes,
      ]);

      const unReadQuotes = quotesFromLocalStorage[localStorageKeys.quotes];
      const exposedQuotes =
        quotesFromLocalStorage[localStorageKeys.exposedQuotes];

      // If there are few unread quotes left, combine read quotes with unread quotes before caching
      // Less than 20 quotes are considered few. Can be any value. Use your own judgement to come up with appropriate value.
      if (unReadQuotes.length < 20) {
        // Shuffle unread and exposed quotes and cache
        cache.quotes = shuffleArray([...unReadQuotes, ...exposedQuotes]);
      } else {
        // Enough unread quotes. Cache and continue normally
        cache.quotes = unReadQuotes;
      }
    }

    const { quotes } = cache;
    const randomInt = getRandomInteger(0, quotes.length - 1);

    // Get random quote from the list of cached quotes. There is possibility of repetition
    // FIXME: Retrieve random quote from API after setting up a dedicated quotes API
    const quote = quotes[randomInt];

    updateUI({ ...quote, intro: getIntroText() });
  } catch (error) {
    console.error(error);
  }
});

/**
 * Can't use chrome.action.clicked in background.js
 * because chrome.action.clicked doesn't fire when
 * there is a popup. Adding and removing popup manually
 * is more tedious than this.
 */
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const todaysDateAndQuote = await getDataFromLocalStorage([
      localStorageKeys.todaysDateInMs,
      localStorageKeys.todaysQuote,
    ]);

    // Remove user notififcation even if its off
    // FIXME Refactor to first check if user has seen today's quote
    await removeUserNotification();

    const todaysDateInMs = todaysDateAndQuote[localStorageKeys.todaysDateInMs];
    const todaysQuote = todaysDateAndQuote[localStorageKeys.todaysQuote];

    const isSameDay = checkIfIsTheSameDay(new Date(todaysDateInMs), new Date());

    // Same day
    if (isSameDay) {
      // Update UI
      updateUI({ ...todaysQuote, intro: getIntroText() });

      // Update local storage
      await setDataToLocalStorage({
        [localStorageKeys.hasReadTodaysQuote]: constants.hasReadTodaysQuote,
      });

      return;
    }

    const quotesAndExposedQuotes = await getDataFromLocalStorage([
      localStorageKeys.quotes,
      localStorageKeys.exposedQuotes,
    ]);

    const quotes = quotesAndExposedQuotes[localStorageKeys.quotes];
    const exposedQuotes =
      quotesAndExposedQuotes[localStorageKeys.exposedQuotes];

    // Another day but quotes in local storage are finished
    if (quotes.length === 0) {
      // Shuffle the existing exposed quotes and use it in place of quotes
      const shuffledQuotes = shuffleArray(exposedQuotes);
      const todaysQuote = shuffledQuotes.pop();

      // Cache shuffled quotes for random retrieval
      cache.quotes = shuffledQuotes;

      // Update UI with today's quote
      updateUI({ ...todaysQuote, intro: getIntroText() });

      // Update database
      await setDataToLocalStorage({
        [localStorageKeys.quotes]: shuffledQuotes,
        [localStorageKeys.todaysDateInMs]: Date.now(),
        [localStorageKeys.todaysQuote]: todaysQuote,
        [localStorageKeys.exposedQuotes]: [todaysQuote],
        [localStorageKeys.hasReadTodaysQuote]: constants.hasReadTodaysQuote,
      });

      return;
    }

    // Another day
    const todaysNewQuote = quotes.pop();
    exposedQuotes.push(todaysNewQuote);

    // Todays quote
    updateUI({ ...todaysNewQuote, intro: getIntroText() });

    // Cache quotes for random retrieval
    cache.quotes = quotes;

    // Update database
    await setDataToLocalStorage({
      [localStorageKeys.quotes]: quotes,
      [localStorageKeys.todaysDateInMs]: Date.now(),
      [localStorageKeys.todaysQuote]: todaysNewQuote,
      [localStorageKeys.exposedQuotes]: exposedQuotes,
      [localStorageKeys.hasReadTodaysQuote]: constants.hasReadTodaysQuote,
    });
  } catch (error) {
    console.error(error);
  }
});
