const axios = require("axios");
const path = require("node:path");

const filePath = path.join(__dirname, "data", "quotes.json");
const baseUrl = "https://api.quotable.io";

const url = new URL("quotes", baseUrl);
url.searchParams.set("tags", "inspirational");

const fetchQuotes = async () => {
  const { data } = await axios.get(url.href);
  console.log(data)

};

fetchQuotes();
