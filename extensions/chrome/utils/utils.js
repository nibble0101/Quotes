import {
  fullWeekDays,
  shortWeekDays,
  constants,
  localStorageKeys,
} from "./constants.js";

/**
 * Fetch resource from URI
 * @param {String} uri
 * @returns
 */
export const fetchData = async (uri) => {
  const response = await fetch(uri);
  const data = await response.json();
  return data;
};

/**
 * Get data from localStorage. If keys don't exist it returns {}
 * It doesn't throw an error if a requested key doesn't exist. The
 * non existent key will not be part of the returned object 
 * @param {String[]} storagKeys Array of local storage keys. 
 * @returns
 */
export const getDataFromLocalStorage = async (storagKeys) => {
  const data = await chrome.storage.local.get(storagKeys);
  return data;
};

/**
 * Sets data to localStorage. 
 * @param {Object} data Data you want to set to local storage in the form { key: value }
 * @returns
 */
export const setDataToLocalStorage = async (data) => {
  await chrome.storage.local.set(data);
  return true;
};

/**
 * Checks for existence of data in localStorage
 * @param {String} storagKey 
 * @returns
 */
export const checkDataExistenceInLocalStorage = async (storagKey) => {
  const data = await getDataFromLocalStorage([storagKey]);
  return data?.[storagKey] ? true : false;
};

/**
 * Fisher–Yates shuffle algorithm https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 * Source https://bost.ocks.org/mike/shuffle/
 * @param {Array} array
 * @returns {Array}
 */
export const shuffleArray = (array) => {
  let m = array.length,
    t,
    i;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
};

/**
 * Check if it is the same day
 * @param {Date} dateToCheck
 * @param {Date} todaysDate
 * @returns {Boolean}
 */
export const checkIfIsTheSameDay = (dateToCheck, todaysDate = new Date()) => {
  return (
    dateToCheck.getDate() === todaysDate.getDate() &&
    dateToCheck.getMonth() === todaysDate.getMonth() &&
    dateToCheck.getFullYear() === todaysDate.getFullYear()
  );
};

/**
 * Sets user notification
 * @returns
 */
export const setUserNotification = async () => {
  await Promise.all([
    chrome.action.setBadgeText({ text: getShortWeekDay() }),
    chrome.action.setBadgeBackgroundColor({ color: "green" }),
  ]);

  return true;
};

/**
 * Removes user notification
 * @returns
 */
export const removeUserNotification = async () => {
  await Promise.all([
    chrome.action.setBadgeText({ text: "" }),
    chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 0] }),
  ]);

  return true;
};

/**
 * Returns full day of the week
 * @returns {String}
 */
export const getFullWeekDay = () => {
  return fullWeekDays[new Date().getDay()];
};

/**
 * Get short day of the week
 * @returns {String}
 */
export const getShortWeekDay = () => {
  return shortWeekDays[new Date().getDay()];
};

/**
 * Set extension title
 * @returns
 */
export const setTitle = async () => {
  const title = `Your ${getFullWeekDay()} inspirational quote.`;
  await chrome.action.setTitle({ title });
};

/**
 * Checks if today is a new day and update database if so
 * @returns
 */
export const checkIfNewDayAndUpdateDatabaseIfSo = async () => {
  const {
    [localStorageKeys.todaysDateInMs]: todaysDateInMs,
    [localStorageKeys.hasReadTodaysQuote]: hasReadTodaysQuote,
  } = await getDataFromLocalStorage([
    localStorageKeys.todaysDateInMs,
    localStorageKeys.hasReadTodaysQuote,
  ]);

  const isSameDay = checkIfIsTheSameDay(new Date(todaysDateInMs), new Date());

  // Same day.
  if (isSameDay) {
    // Closing the browser removes the notification
    // Set it if user has not read quote
    if (hasReadTodaysQuote === constants.hasNotReadTodaysQuote) {
      await setUserNotification();
    }

    return;
  }

  // Another day.
  const {
    [localStorageKeys.quotes]: quotes,
    [localStorageKeys.exposedQuotes]: exposedQuotes,
  } = await getDataFromLocalStorage([
    localStorageKeys.quotes,
    localStorageKeys.exposedQuotes,
  ]);

  // Another day but quotes in local storage are finished
  if (quotes.length === 0) {
    // Shuffle the existing exposed quotes and use it in place of quotes
    const shuffledQuotes = shuffleArray(exposedQuotes);
    const todaysQuote = shuffledQuotes.pop();

    await setDataToLocalStorage({
      [localStorageKeys.quotes]: shuffledQuotes,
      [localStorageKeys.todaysDateInMs]: Date.now(),
      [localStorageKeys.todaysQuote]: todaysQuote,
      [localStorageKeys.exposedQuotes]: [todaysQuote],
      [localStorageKeys.hasReadTodaysQuote]: constants.hasNotReadTodaysQuote,
    });
    await setUserNotification();

    return;
  }

  // Another day
  const todaysNewQuote = quotes.pop();
  exposedQuotes.push(todaysNewQuote);

  await setDataToLocalStorage({
    [localStorageKeys.quotes]: quotes,
    [localStorageKeys.todaysDateInMs]: Date.now(),
    [localStorageKeys.todaysQuote]: todaysNewQuote,
    [localStorageKeys.exposedQuotes]: exposedQuotes,
    [localStorageKeys.hasReadTodaysQuote]: constants.hasNotReadTodaysQuote,
  });
  await setUserNotification();
};
