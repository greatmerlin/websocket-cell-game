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

    // what if we receive a message to create a game? -------------------- CREATE
    if (result.method === "create") {
      const clientId = result.clientId;
      const gameId = createGuid();
      // here we create the game object
      games[gameId] = {
        id: gameId,
        balls: 20,
        clients: []
      };

      const payLoad = {
        "method": "create",
        "game": games[gameId],
      };

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad));
    }

    // what if we receive a message to join? -------------------- JOIN
    if (result.method === "join") {

      const clientId = result.clientId;
      const gameId = result.gameId;  
      // how do I get the game object
      const game = games[gameId];
      // now I need the connection and assign a color for this client 
      // I need to know how many clients have joined, so at the payload from create -> empty array clients []
      if(game.clients.length >= 3) {
          // sorry, max players reched
          return;
      }
      // substring solution, when 0 red, when 1 green, when 2 blue
      const color = {"0": "Red", "1": "Green", "2": "Blue"}[game.clients.length];
      // update the game state now
      game.clients.push({
            "clientId": clientId,
            "color": color
      });

      const payLoad = {
        "method": "join",
        "game": game
      };

      // now loop through the clients and give them a color
      game.clients.forEach((client) => {
            clients[client.clientId].connection.send(JSON.stringify(payLoad))
      });
    }

    // what if we receive a message to play? -------------------- PLAY
    if (result.method === "play") {}


  });
  // generate a new clientID
  const clientId = createGuid();
  // mapping between the connection and the clientID
  clients[clientId] = {
    connection: connection,
  };

  // the payLoad of the connect
  const payLoad = {
    "method": "connect",
    "clientId": clientId,
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
