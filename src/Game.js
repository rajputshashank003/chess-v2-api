import { WebSocket } from "ws";
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "./Messages.js";

export class Game {
    player1;
    player2;
    board;
    #moveCount;
    #startTime;

    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = new Chess();
        this.#moveCount = 0;
        this.#startTime = new Date();
        this.player1.send(JSON.stringify({
            type: INIT_GAME,
            payload : {
                color: "white",
            },
        }));
        this.player2.send(JSON.stringify({
            type: INIT_GAME,
            payload : {
                color : "black",
            },
        }));
    }

    makeMove(socket, move) {
        if (this.#moveCount % 2 === 0 && socket !== this.player1) {
            return;
        }

        if (this.#moveCount % 2 === 1 && socket !== this.player2) {
            return;
        }

        try {
            this.board.move(move);
        } catch (e) {
            console.error("error " , e);
            return;
        }

        if (this.board.isGameOver()) {
            const winner = this.board.turn() === 'w' ? "black" : "white";
            const message = JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: winner
                }
            });
            this.player1.emit(message);
            this.player2.emit(message);
            return;
        }
        console.log(this.#moveCount);
        if(this.#moveCount %2 === 0) {
            this.player2.send(JSON.stringify({
                type: MOVE,
                payload : move,
            }));
        } else {
            this.player1.send(JSON.stringify({
                type:MOVE,
                payload : move,
            }))
        }
        this.#moveCount++;
    }
}