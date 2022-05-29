import {
  localStorageKeys,
  setDataToLocalStorage,
  checkIfIsTheSameDay,
  getDataFromLocalStorage,
  constants,
  getFullWeekDay,
  removeUserNotification,
} from "../utils/utils.js";

const quoteEl = document.getElementById("quote");
const authorEl = document.getElementById("author");
const introEl = document.getElementById("intro");
const closeBtnEl = document.getElementById("close-btn");

/**
 * Updates UI
 *
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
    const [todaysDateAndQuote] = await Promise.all([
      getDataFromLocalStorage([
        localStorageKeys.todaysDateInMs,
        localStorageKeys.todaysQuote,
      ]),
      removeUserNotification(),
      // Remove user notififcation even if its off. Refactor to first check if user has seen today's quote
    ]);
    
    const todaysDateInMs = todaysDateAndQuote[localStorageKeys.todaysDateInMs];
    const todaysQuote = todaysDateAndQuote[localStorageKeys.todaysQuote];

    const isSameDay = checkIfIsTheSameDay(new Date(todaysDateInMs), new Date());

    if (isSameDay) {
      updateUI({ ...todaysQuote, intro: getIntroText() });

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

    // This runs if it is another day and
    // all quotes are used up. Init database and update UI
    if (quotes.length === 0) {
      // FIXME: Shuffle the existing exposed quotes and use it in database
      // Currently returning it as is
      const newQuotes = exposedQuotes;
      const todaysQuote = newQuotes.pop();

      updateUI({ ...todaysQuote, intro: getIntroText() });

      await setDataToLocalStorage({
        [localStorageKeys.quotes]: newQuotes,
        [localStorageKeys.todaysDateInMs]: Date.now(),
        [localStorageKeys.todaysQuote]: todaysQuote,
        [localStorageKeys.exposedQuotes]: [todaysQuote],
        [localStorageKeys.hasReadTodaysQuote]: constants.hasReadTodaysQuote,
      });
      return;
    }

    // This runs if it is another day
    const todaysNewQuote = quotes.pop();
    exposedQuotes.push(todaysNewQuote);

    updateUI({ ...todaysNewQuote, intro: getIntroText() });

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
