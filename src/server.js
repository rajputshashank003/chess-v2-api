import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager.js';

const wss = new WebSocketServer({ port: 8080 });

const gameManager = new GameManager();
console.log("connected!");
wss.on('connection', function connection(ws) {
  console.log("user socket connected!");
  gameManager.addUser(ws);

  ws.on('close' , () => {
    console.log("disconnected user socket! ");
    gameManager.removeUser(ws);
  });

});