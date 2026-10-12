const http = require("http");
const net = require("net");
const { URL } = require("url");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_SUFFIXES = [
  ".xbox.com",
  ".xboxlive.com",
  ".microsoft.com",
  ".live.com",
  ".windows.net",
  ".msauth.net",
  ".msftauth.net",
  ".microsoftonline.com"
];

function allowedHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  return (
    host === "xbox.com" ||
    host === "xboxlive.com" ||
    ALLOWED_SUFFIXES.some((suffix) => host.endsWith(suffix))
  );
}

app.get("/", (req, res) => {
  res.send(`
    <html>
      <body style="font-family:Arial;text-align:center;margin-top:80px">
        <h1>CMF Xbox Proxy</h1>
        <p>HTTP CONNECT proxy is running.</p>
      </body>
    </html>
  `);
});

const server = http.createServer(app);

server.on("connect", (req, clientSocket, head) => {
  const [host, portText] = req.url.split(":");
  const port = Number(portText) || 443;

  if (!host || !allowedHost(host) || ![443, 80].includes(port)) {
    clientSocket.write(
      "HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n"
    );
    clientSocket.destroy();
    return;
  }

  const upstream = net.connect(port, host, () => {
    clientSocket.write(
      "HTTP/1.1 200 Connection Established\r\n\r\n"
    );

    if (head && head.length) {
      upstream.write(head);
    }

    clientSocket.pipe(upstream);
    upstream.pipe(clientSocket);
  });

  upstream.setTimeout(30000);

  upstream.on("timeout", () => upstream.destroy());
  upstream.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => upstream.destroy());
  clientSocket.on("close", () => upstream.destroy());
});

app.get("/browse", async (req, res) => {
  const url = req.query.url;

  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).send("Enter a valid URL.");
  }

  try {
    const parsed = new URL(url);

    if (!allowedHost(parsed.hostname)) {
      return res.status(403).send("That destination is not allowed.");
    }

    const response = await fetch(url);
    res.send(await response.text());
  } catch {
    res.status(500).send("Unable to load that page.");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CMF Xbox proxy listening on port ${PORT}`);
});
