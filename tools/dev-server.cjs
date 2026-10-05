const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDirectory = path.resolve(__dirname, "..");
const requestedPort = Number(process.env.PORT || process.argv[2] || 5173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".webp": "image/webp"
};

const server = http.createServer((request, response) => {
  let cleanPath;
  try {
    const requestUrl = new URL(request.url, "http://localhost");
    cleanPath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "") || "index.html";
  } catch {
    response.writeHead(400); response.end("Bad request"); return;
  }
  const filePath = path.resolve(rootDirectory, cleanPath);

  if (filePath !== rootDirectory && !filePath.startsWith(rootDirectory + path.sep)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, fileContents) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(fileContents);
  });
});

server.listen(requestedPort, "127.0.0.1", () => {
  console.log(`EstateLedger is running at http://127.0.0.1:${requestedPort}/`);
});
