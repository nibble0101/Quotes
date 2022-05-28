/**
 * LocalStorage keys
 */

export const localStorageKeys = {
  quotes: "QUOTES",
  todaysQuote: "TODAYS_QUOTE",
  exposedQuotes: "EXPOSED_QUOTES",
  todaysDateInMs: "TODAYS_DATE_IN_MS",
  hasReadTodaysQuote: "HAS_READ_TODAYS_QUOTE",
};

/**
 * Message strings
 */

export const messages = {
  setNotification: "SET_NOTIFICATION",
  removeNotification: "REMOVE_NOTIFICATION",
  operationSuccessful: "OPERATION_SUCCESSFUL",
  unknownMessage: "UNKNOWN_MESSAGE",
};

/**
 * Constants
 */

export const constants = {
  hasReadTodaysQuote: "YES",
  hasNotReadTodaysQuote: "NO",
};

/**
 * Full days of the week
 */

const fullWeekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Short days of the week
 */

const shortWeekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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
 * Get data from localStorage
 * @param {String[]} storagKeys
 * @returns
 */
export const getDataFromLocalStorage = async (storagKeys) => {
  const data = await chrome.storage.local.get(storagKeys);
  return data;
};

/**
 * Sets data to localStorage
 * @param {String} storagKey
 * @param {any} data
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
 * Shuffle elements of array
 * @param {Array} array
 * @returns
 */
export const shuffleArray = (array) => {
  // TODO
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
 * @returns {Promise}
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
 * @returns {Promise}
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
 * @returns {String}
 */
export const setTitle = async () => {
  const title = `Your ${getFullWeekDay()} inspirational quote.`;
  await chrome.action.setTitle({ title });
};

/**
 * Checks if today is a new day and update database if so
 * @returns {Promise}
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

  // It is the same day. Doesn't matter whether user has seen quote or not. Do nothing
  if (isSameDay) {
    // Closing the browser removes the notification
    // Set it if user has not read quote
    if (hasReadTodaysQuote === constants.hasNotReadTodaysQuote) {
      await setUserNotification();
    }
    return;
  }

  // It is another day.
  const {
    [localStorageKeys.quotes]: quotes,
    [localStorageKeys.exposedQuotes]: exposedQuotes,
  } = await getDataFromLocalStorage([
    localStorageKeys.quotes,
    localStorageKeys.exposedQuotes,
  ]);

  // Another day but quotes in local storage are finished
  if (quotes.length === 0) {
    // FIXME: Shuffle the existing exposed quotes and use it as new batch of quotes
    // Currently returning it as is
    const newQuotes = exposedQuotes;
    const todaysQuote = newQuotes.pop();

    await setDataToLocalStorage({
      [localStorageKeys.quotes]: newQuotes,
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
