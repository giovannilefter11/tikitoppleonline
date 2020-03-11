// npm start --> fa partire il server
// npm run serve --> client

// istanze per connessione socket
const express = require("Express")();
const http = require("http").Server(express);
const socketio = require("socket.io")(http);

// costanti dell'app
const steps = 33; // numero di tasselli nel gioco
const maxPlayersNumber = 4; // numero di giocatori
const playerColors = ["red", "blue", "yellow", "green"]; // colori standard dei giocatori
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

let activePlayersClients = []; // array coi giocatori attivi
let gameStarted = false;

// ci mettiamo in ascolto sulla porta 3000
http.listen(port = 3000, () => {
    console.log("listening on port " + port);
});

// quando un utente si connetterà atterrerà in questo evento
socketio.on("connection", socket => {
    console.log("connessione effettuata");

    // evento di connessione stabilita, comunichiamo all'utente se può giocare o meno
    socket.emit("connection-enstablished", canPlay());

    console.log(canPlay() ? "può giocare" : "non può giocare");

    // se questo utente può giocare andiamo avanti, altrimenti è inutile continuare
    if (canPlay()){
        // quando un giocatore si connetterà dovremmo estrarre un colore a caso e assegnarglielo da quelli rimanenti
        socket.on("ask-color", () => {
            // estraiamo un colore a caso per l'utente appena collegato
            let color = generateValidRandomColor();
            activePlayersClients.push({socket: socket, color: color});
            socket.emit("emit-color", color);
            console.log("giocatori attivi: " + activePlayersClients.length);
            socket.emit('send-msg', 'Sei il ' + color);
            socket.broadcast.emit('send-msg', 'Si è connesso il giocatore ' + color);
        });
    }

    // socket.on("disconnect", () => {
    //     console.log("un giocatore è uscito");
    //     let i = activePlayersClients.indexOf(socket);
    //     activePlayersClients.splice(i, 1);
    //     console.log("giocatori rimasti: " + activePlayersClients.length);
    // });
});

/**
 * controlliamo che la stanza non sia già piena
 * @returns {boolean}
 */
function canPlay() {
    return activePlayersClients.length < maxPlayersNumber;
}

/**
 * troviamo random un colore che non sia già stato preso dagli utenti attivi
 * @returns {string}
 */
function generateValidRandomColor() {
    let color;
    // se tra gli utenti attivi c'è già il colore estratto dobbiamo estrarne un altro
    do {
        color = playerColors[Math.floor(Math.random() * playerColors.length)];
    } while (existsActivePlayersWithColor(color));
    return color;
}

/**
 * controlliamo se nell'oggetto dei giocatori attivi è già stato assegnato questo colore
 * @param color
 * @returns {boolean}
 */
function existsActivePlayersWithColor(color){
    let ret = false;
    activePlayersClients.map(p =>{
        if(p.color === color) {
            ret = true;
        }
    });
    return ret;
}