const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
    <html>
      <body style="font-family:Arial;text-align:center;margin-top:80px">
        <h1>CMF Proxy</h1>
        <form action="/browse">
          <input name="url" placeholder="https://example.com"
                 style="width:300px;padding:10px">
          <button style="padding:10px">Go</button>
        </form>
      </body>
    </html>
  `);
});

app.get("/browse", async (req, res) => {
  const url = req.query.url;

  if (!url || !/^https?:\\/\\//i.test(url)) {
    return res.status(400).send("Enter a valid URL.");
  }

  try {
    const response = await fetch(url);
    const page = await response.text();
    res.send(page);
  } catch {
    res.status(500).send("Unable to load that page.");
  }
});

app.listen(PORT, () => {
  console.log(`CMF Proxy running on port ${PORT}`);
});
