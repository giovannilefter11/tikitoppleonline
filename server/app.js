// npm start
// npm run serve

const express = require("Express")();
const http = require("http").Server(express);
const socketio = require("socket.io")(http);

const steps = 33; // numero di tasselli nel gioco
const maxPlayersNumber = 4; // numero di giocatori
const playerColors = ["red", "blue", "yellow", "green"]; // colori standard dei giocatori
let activePlayersColors = []; // array coi colori dei giocatori già in gioco
const blocks = [ // blocchetti che si muoveranno
    { name: "HUHU", color: "yellow" },
    { name: "WIKIKI", color: "lightblue" },
    { name: "AKAMAI", color: "orange" },
    { name: "NUI", color: "green" },
    { name: "KAPU", color: "pink" },
    { name: "NANI", color: "red" },
    { name: "LOKANI", color: "purple" },
    { name: "EEPO", color: "brown" },
    { name: "HOOKIPA", color: "grey" },
];
let activePlayersClients = [];

http.listen(port = 3000, () => {
    console.log("listen on port " + port);
});

socketio.on("connection", socket => {
    console.log("connessione effettuata");

    function isViewMode() {
        return activePlayersClients.length >= maxPlayersNumber;
    }

    socket.emit("connection-enstablished", isViewMode());

    // quando un giocatore si connetterà dovremmo estrarre un colore a caso e assegnarglielo da quelli rimanenti
    socket.on("ask-color", () => {
        console.log("è stato chiesto un colore");
        let color = playerColors[Math.floor(Math.random() * playerColors.length)];
        if (!activePlayersColors.includes(color) && !isViewMode()){
            activePlayersClients.push({socket: socket, color: color});
            activePlayersColors.push(color);
            socket.emit("emit-color", color);
            console.log("emesso colore " + color);
            activePlayersClients.length;
            console.log("giocatori attivi: "+activePlayersClients.length);
        }
    })

    socket.on("disconnect", () => {
        console.log("un giocatore è uscito");
        let i = activePlayersClients.indexOf(socket);
        activePlayersClients.splice(i, 1);
        console.log("giocatori rimasti: " + activePlayersClients.length);
    });
});