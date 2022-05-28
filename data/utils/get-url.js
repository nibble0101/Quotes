module.exports.getUrl = (baseUrl, path, params) => {
  const url = new URL(path, baseUrl);
  for (const param in params) {
    url.searchParams.set(param, params[param]);
  }
  return encodeURI(url.href);
};
