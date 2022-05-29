const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "data", "type-fit-quotes.json");
const daysInYear = 365;

const removeDuplicates = (quotes) => {
  return quotes.filter((filterQuote, idx) => {
    const index = quotes.findIndex((findIndexQuote) => {
      return (
        filterQuote.author === findIndexQuote.author &&
        filterQuote.quote === findIndexQuote.quote
      );
    });
    return index === idx;
  });
};

// From https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array
function getRandom(arr, n) {
  let result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
    let x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

fs.readFile(filePath, { encoding: "utf-8" }, (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  const uniqueQuotes = removeDuplicates(JSON.parse(data));
  const randomQuotes = getRandom(uniqueQuotes, daysInYear * 2);

  const filePath = path.join(process.cwd(), "data", "quotes.json");

  fs.writeFile(filePath, JSON.stringify(randomQuotes, null, 4), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Saved ${randomQuotes.length} quotes to ${filePath}`);
  });
});
