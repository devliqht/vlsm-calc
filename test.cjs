// test.cjs
const http = require("http");
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<h1>Hello from test server</h1>");
});
server.listen(51920, () => console.log("Server on 51920"));
