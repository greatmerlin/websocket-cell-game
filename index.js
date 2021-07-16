const http = require("http");

const app = require("express")();
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/index.html");
});

app.listen(9091, () => {
  console.log("listening to 9091...");
});

const httpServer = http.createServer();

httpServer.listen(9090, () => {
  console.log("listening to Port 9090...");
});

const clients = {};
const games = {};

const websocketServer = require("websocket").server;
const wsServer = new websocketServer({
  httpServer: httpServer,
});
wsServer.on("request", (request) => {
  //sm1 trying to connect
  const connection = request.accept(null, request.origin);
  connection.on("open", () => {
    console.log("connection opens");
  });
  connection.on("close", () => {
    console.log("connection closes");
  });
  connection.on("message", (message) => {
    // when a message is received, what do I do
    const result = JSON.parse(message.utf8Data);
    console.log("Result here ----> ", result);

    if (result.method === "create") {
      const clientId = result.clientId;
      const gameId = createGuid();
      games[gameId] = {
        id: gameId,
        balls: 20,
      };

      const payLoad = {
        method: "create",
        game: games[gameId],
      };

      const con = clients[clientId].connection;
      console.log("Send Back ---> ", JSON.stringify(payLoad));
      con.send(JSON.stringify(payLoad));
    }
  });
  // generate a new clientID
  const clientId = createGuid();
  // mapping between the connection and the clientID
  clients[clientId] = {
    connection: connection,
  };

  // the payLoad of the connect
  const payLoad = {
    method: "connect",
    clientId: clientId,
  };
  connection.send(JSON.stringify(payLoad));
});

function createGuid() {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
  return (
    S4() +
    S4() +
    "-" +
    S4() +
    "-4" +
    S4().substr(0, 3) +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  ).toLowerCase();
}
