import {
  localStorageKeys,
  messages,
  setDataToLocalStorage,
  checkIfIsTheSameDay,
  getDataFromLocalStorage,
  constants,
  getFullWeekDay,
} from "../utils/utils.js";

const quoteEl = document.getElementById("quote");
const authorEl = document.getElementById("author");
const introEl = document.getElementById("intro");

const updateUI = ({ content, author, intro }) => {
  quoteEl.innerText = content;
  authorEl.innerText = author;
  introEl.innerText = intro;
};

const getIntroText = () => {
  return `Your ${getFullWeekDay()} inspiration`;
};

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

    if (quotes.length === 0) {
      // All quotes are used up. Init database and update UI

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
