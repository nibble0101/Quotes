const axios = require("axios");
const fs = require("fs");
const path = require("path");

const { getUrl } = require("./get-url");

const filePath = path.join(process.cwd(), "data", "type-fit-quotes.json");
const baseUrl = "https://type.fit";

const filterQuotes = (quotes) => {
  return quotes.filter((quote) => {
    return quote.text && quote.author;
  });
};

const extractQuotes = (quotes) => {
  return quotes.map((quote) => {
    return { quote: quote.text, author: quote.author };
  });
};

const fetchTypeFitQuotes = async () => {
  try {
    const url = getUrl(baseUrl, "api/quotes");
    const response = await axios.get(url);
    if (response.statusText === "OK") {
      const { data } = response;

      const filteredQuotes = filterQuotes(data);
      const extractedQuotes = extractQuotes(filteredQuotes);

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
    }
  } catch (error) {
    console.error(error);
  }
};

fetchTypeFitQuotes();
