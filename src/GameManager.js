import { WebSocket } from "ws";
import { INIT_GAME, MESSAGE, MOVE, SPECTARE , INIT_SPECTING, GAMES_COUNT, OPPONENT_DISCONNECT, STREAM_OVER, CHANNEL_EXIST, GAME_NOT_FOUND} from "./Messages.js";
import { Game } from "./Game.js";

export class GameManager {
    #games; 
    #pendingUser;
    #channelPending;
    #currChannelsSet
    #users;

    constructor() {
        this.#games = []; 
        this.#pendingUser = null;
        this.#channelPending = [];
        this.#currChannelsSet = new Set([]);
        this.#users = [];
    }

    addUser(socket) {
        this.#users.push(socket);
        this.#addHandler(socket);
        setTimeout( () => {
            this.sendGameCount();
        } , [2000]);
    }

    removeUser(socket) {
        this.#users = this.#users.filter(user => user !== socket);
        if(this.#pendingUser === socket){
            this.#pendingUser = null;
            return;
        }
        const currGame = this.#games.filter(game => game.player1 === socket || game.player2 === socket )[0];
        if(currGame){
            
            this.#currChannelsSet.delete(currGame.channelNumber);

            const message = JSON.stringify({
                type : OPPONENT_DISCONNECT
            });
            if(currGame.player1 == socket){
                currGame.player2.send(message);
            } else {
                currGame.player1.send(message);
            }
            if(currGame.spectares && !currGame.board.isGameOver()){
                const winner = "User Disconnected" ;
                currGame.spectares.map( (spectare) => {
                    spectare.send(JSON.stringify({
                        type : STREAM_OVER,
                        payload : {
                            winner : winner
                        }
                    }))
                })
            }
        }

        this.#games = this.#games.filter(game => game.player1 !== socket && game.player2 !== socket );
        this.sendGameCount();
    }

    sendGameCount(){
        this.#users.map( ( user) => {
            user.send(JSON.stringify({
                type : GAMES_COUNT,
                games_count : this.#games.length,
                users_count : this.#users.length
            }))
        })
    }

    #addHandler(socket) {
        socket.on('message', (data) => {
            const message = JSON.parse(data.toString());

            if(message.type === INIT_GAME && message.channel > 0){

                if(this.#currChannelsSet.has(message.channel)){
                    socket.send(JSON.stringify({
                        type : CHANNEL_EXIST,
                    }));
                    return;
                }

                const waitingUser = this.#channelPending.filter((channel) => channel.channelNumber === message.channel)[0];

                if(waitingUser){
                    const game = new Game(waitingUser.userSocket , socket, message.channel);
                    this.#games.push(game);
                    this.sendGameCount();
                    this.#channelPending = this.#channelPending.filter((channel) => channel.channelNumber !== message.channel);
                    this.#currChannelsSet.add(message.channel);
                } else {
                    this.#channelPending.push({userSocket : socket , channelNumber : message.channel});
                }
            } else if (message.type === INIT_GAME) {
                if (this.#pendingUser ) {
                    const game = new Game(this.#pendingUser, socket, null);
                    this.#games.push(game);
                    this.sendGameCount();
                    this.#pendingUser = null;
                } else {
                    this.#pendingUser = socket;
                }
            }

            if(message.type === INIT_SPECTING){
                if(this.#games.length > 0){
                    if(message.channelNumber > 0){
                        const spectingGame = this.#games.filter( (game ) => game.channelNumber == message.channelNumber)[0];
                        if(spectingGame){
                            spectingGame.addSpectare(socket);
                        } else {
                            socket.send(JSON.stringify({
                                type : GAME_NOT_FOUND,
                            }))
                        }
                    } else {
                        const spectingGame = this.#games[
                            this.#games.length > message.index ? message.index : 0
                        ];
                        spectingGame.addSpectare(socket);
                    }
                } else {
                    console.log("game not found");
                }
            }

            if (message.type === MOVE) {
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