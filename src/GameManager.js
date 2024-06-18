import { WebSocket } from "ws";
import { INIT_GAME, MESSAGE, MOVE } from "./Messages.js";
import { Game } from "./Game.js";

export class GameManager {
    #games; 
    #pendingUser;
    #users;

    constructor() {
        this.#games = []; 
        this.#pendingUser = null;
        this.#users = [];
    }

    addUser(socket) {
        this.#users.push(socket);
        this.#addHandler(socket);
    }

    removeUser(socket) {
        this.#users = this.#users.filter(user => user !== socket);
    }

    #addHandler(socket) {
        socket.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === INIT_GAME) {
                if (this.#pendingUser ) {
                    const game = new Game(this.#pendingUser, socket);
                    this.#games.push(game);
                    this.#pendingUser = null;
                } else {
                    this.#pendingUser = socket;
                }
            }

            if (message.type === MOVE) {
                console.log("message backend " , message.payload.move);
                const game = this.#games.find(game => game.player1 === socket || game.player2 === socket);
                if (game) {
                    game.makeMove(socket, message.payload.move);
                } else {
                    console.log('Game not found for move:', message.payload.move);
                }
            }

            if(message.type === MESSAGE){
                const game1 = this.#games.find(game => game.player1 === socket );
                const game2 = this.#games.find(game => game.player2 === socket );
                if (game1) {
                    game1.sendMessage( message.message, game1.player1);
                } else if (game2) {
                    game2.sendMessage( message.message, game2.player2);
                } else {
                    console.log('Game not found for move:');
                }
            }
        });
    }
}