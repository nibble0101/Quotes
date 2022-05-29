import {
  setDataToLocalStorage,
  checkIfIsTheSameDay,
  getDataFromLocalStorage,
  getFullWeekDay,
  removeUserNotification,
  shuffleArray,
} from "../utils/utils.js";

import { constants, localStorageKeys } from "../utils/constants.js";

const quoteEl = document.getElementById("quote");
const authorEl = document.getElementById("author");
const introEl = document.getElementById("intro");
const closeBtnEl = document.getElementById("close-btn");

/**
 * Updates UI
 */
const updateUI = ({ quote, author, intro }) => {
  quoteEl.innerText = quote;
  authorEl.innerText = author;
  introEl.innerText = intro;
};

/**
 * Gets introduction text with day of the week
 * @returns {String}
 */
const getIntroText = () => {
  return `Your ${getFullWeekDay()} inspiration`;
};

/**
 * Close pop window
 */
closeBtnEl.addEventListener("click", () => {
  window.close();
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
