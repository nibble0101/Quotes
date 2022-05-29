const axios = require("axios");
const path = require("node:path");
const fs = require("node:fs");

const { getUrl } = require("./get-url.js");

const filePath = path.join(process.cwd(), "data", "quotable-quotes.json");
const baseUrl = "https://api.quotable.io";

const extractQuotes = (quotes) => {
  return quotes.map((quoteObj) => {
    return { quote: quoteObj.content, author: quoteObj.author };
  });
};

const fetchQuotableQuotes = async () => {
  const quotes = [];

  try {
    const url = getUrl(baseUrl, "quotes", {
      tags: "inspirational",
      page: 1,
    });

    const { data } = await axios.get(url);
    const { totalPages, results } = data;
    quotes.push(...results);

    const remainingPages = [];

    for (let page = 2; page <= totalPages; page++) {
      remainingPages.push(page);
    }

    const responses = await Promise.all(
      remainingPages.map((page) => {
        const url = getUrl(baseUrl, "quotes", {
          tags: "inspirational",
          page,
        });
        return axios.get(url);
      })
    );

    responses.forEach((response) => {
      const { results } = response.data;
      quotes.push(...results);
    });

    const extractedQuotes = extractQuotes(quotes);

    if (fs.existsSync(filePath)) {
      fs.writeFile(
        filePath,
        JSON.stringify(extractedQuotes, null, 4),
        (err) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log(`Saved quotes successfully to ${filePath}`);
        }
      );
    }
  } catch (error) {
    console.error(error);
  }
};

fetchQuotableQuotes();
