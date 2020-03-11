// npm start --> fa partire il server
// npm run serve --> client

// istanze per connessione socket
const express = require("Express")();
const http = require("http").Server(express);
const socketio = require("socket.io")(http);

// costanti dell'app
const steps = 33; // numero di tasselli nel gioco
const maxPlayersNumber = 4000; // numero di giocatori
const playerColors = ["red", "blue", "yellow", "green"]; // colori standard dei giocatori
let blocks = [ // blocchetti che si muoveranno
    { name: "😎",    color: "yellow",    position: 0 }, // HUHU
    { name: "😒",    color: "lightblue", position: 1 }, // WIKIKI
    { name: "🐱‍🚀",  color: "orange",    position: 2 }, // AKAMAI
    { name: "🤔",    color: "green",     position: 3 }, // NUI
    { name: "😍",    color: "pink",      position: 4 }, // KAPU
    { name: "🤬",   color: "red",       position: 5 }, // NANI
    { name: "🧐",   color: "purple",    position: 6 }, // LOKANI
    { name: "🤐",    color: "brown",     position: 7 }, // EEPO
    { name: "😤",    color: "grey",      position: 8 }, // HOOKIPA
];
let cards = [
    // nome del blocco, tasselli che bisogna selezionare lato utente che gioca la carta, azione che compirà
    { name: "TIKI-WIKI",    blocksNumber: 2, action: "invert",      usable: true, moveSteps: 0},
    { name: "TIKI-PUH",     blocksNumber: 1, action: "move",        usable: true, moveSteps: -2},
    { name: "TIKI-UP 1",    blocksNumber: 1, action: "move",        usable: true, moveSteps: 1},
    { name: "TIKI-UP 2",    blocksNumber: 1, action: "move",        usable: true, moveSteps: 2},
    { name: "TIKI-UP 3",    blocksNumber: 1, action: "move",        usable: true, moveSteps: 3},
    { name: "TIKI-TOAST",   blocksNumber: 1, action: "delete",      usable: true, moveSteps: 0},
    { name: "TIKI-TOPPLE",  blocksNumber: 1, action: "to-bottom",   usable: true, moveSteps: 0},
];

let activePlayersClients = []; // array dei socket giocatori attivi
let playingGame = false;

// ci mettiamo in ascolto sulla porta 3000
http.listen(port = 3000, () => {
    console.log("listening on port " + port);
});

// quando un utente si connetterà atterrerà in questo evento
socketio.on("connection", socket => {

    // evento di connessione stabilita, comunichiamo all'utente se può giocare o meno
    socket.emit("connection-enstablished", canPlay());

    // se questo utente può giocare andiamo avanti, altrimenti è inutile continuare
    if (canPlay()){
        // quando un giocatore si connetterà dovremmo estrarre un colore a caso e assegnarglielo da quelli rimanenti
        socket.on("ask-color", () => {
            // estraiamo un colore a caso per l'utente appena collegato
            let color = generateValidRandomColor();
            socket.color = color;
            activePlayersClients.push(socket);
            socket.emit("emit-color", socket.color);
            socket.emit('send-msg', 'Sei il ' + socket.color);
            // il broadcast emette eventi per tutti tranne lui
            socket.broadcast.emit('send-msg', 'Si è connesso il giocatore ' + socket.color);
        });

        socket.emit('emit-blocks', blocks);

        socket.emit('emit-cards', cards);

        socket.on("moved-blocks", (card, blocksToMove) => {
            let block;
            if (blocksToMove.length <= 1) {
                block = blocksToMove[0];
            }
            let result = false;
            switch (card.action) {
                case "move":
                    result = moveBlocks(block, card.moveSteps);
                    break;
                case "delete":
                    result = true;
                    block = deleteBlock();
                    break;

                default:
                    break;
            }
            if (!result) {
                socket.emit('send-msg', 'Non puoi giocare ' + card.name + " sul blocchetto " + block.color);
                socket.emit('enable-card', card);
                return;
            }
            socketio.emit('emit-blocks', blocks);
            socket.broadcast.emit("send-msg", "Giocatore " + socket.color + " ha usato " + card.name + " sul blocchetto " + block.color);
            socket.emit('send-msg', 'Hai giocato ' + card.name + " sul blocchetto " + block.color);
            if (blocks.length <= 3) {
                socket.emit('send-msg', 'Mano terminata, sono rimasti solo 3 blocchetti');
            }
        })
    }

    socket.on("disconnect", () => {
        socketio.emit("send-msg",  "Giocatore " + socket.color + " disconnesso");
        let i = activePlayersClients.indexOf(socket);
        activePlayersClients.splice(i, 1);
    });
});

function moveBlocks(block, steps) {
    let index = blocks.findIndex(b => b.color === block.color);
    // controlliamo che l'indice sia abbastanza grande da spostarsi degli steps, se no non si può muovere il blocco
    if (index < steps) return false;

    // altrimenti possiamo muovere i blocchi
    let indexStartMoving = index-steps;
    blocks[index].position = block.position-steps;
    console.log("posizione di partenza : " + indexStartMoving);
    blocks.map(b => {
        if (b.position >= indexStartMoving && b.color !== block.color) {
            if (b.position <= block.position) {
                b.position+=1;
            }
        }
    });
    blocks.sort(position);
    console.log(blocks);
    return true;
}

function deleteBlock(){
    let block = blocks[blocks.length-1];
    blocks.splice(blocks.length-1, 1);
    return block;
}

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
    } while (existsActivePlayerWithColor(color));
    return color;
}

/**
 * controlliamo se nell'oggetto dei giocatori attivi è già stato assegnato questo colore
 * @param color
 * @returns {boolean}
 */
function existsActivePlayerWithColor(color){
    let ret = false;
    activePlayersClients.map(p =>{
        if(p.color === color) {
            ret = true;
        }
    });
    return ret;
}

/**
 * Compare position
 *
 * @param a
 * @param b
 * @returns {number}
 */
function position(a, b) {
    // Use toUpperCase() to ignore character casing
    const bandA = a.position;
    const bandB = b.position;

    let comparison = 0;
    if (bandA > bandB) {
        comparison = 1;
    } else if (bandA < bandB) {
        comparison = -1;
    }
    return comparison;
}