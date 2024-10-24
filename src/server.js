import dotenv from "dotenv";
dotenv.config();
import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager.js';
import {sendMail} from '../helper/mailer.js';
const wss = new WebSocketServer({ port: 8080 });

const gameManager = new GameManager();
console.log("connected!");
wss.on('connection', function connection(ws) {
  console.log("user socket connected!");

  const msg = `<p> Hello Sir ,\nNew user connected on <a href='https://chessv.netlify.app' >Chessv</a>/</p>`;
  sendMail(process.env.SEND_MAIL_TO, "ChessV user connected", msg);

  gameManager.addUser(ws);

  ws.on('close' , () => {
    console.log("disconnected user socket! ");
    gameManager.removeUser(ws);
  });

});