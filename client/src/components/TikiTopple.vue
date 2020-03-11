<template>
  <div id="container">
    <div class="upper-part">
      <div class="game-table">
        <div v-for="block in blocks" :key="block.name" class="block" @click="selectedBlock(block)" :class="selectable ? 'selectable' : ''" :style="{'background-color': block.color}">
          <div>{{block.name}}</div>
        </div>
      </div>
      <div class="events-log">
        <ul>
          <li v-for="message in messages" :key="message">
            {{message}}
          </li>
        </ul>
      </div>
    </div>
    <div class="cards">
      <button v-for="card in cards" :key="card.name" :disabled="!card.usable" @click="clickedOnCard(card)">{{card.name}}</button>
      <div class="instructions" v-if="showInstructions">{{instructionText}}</div>
    </div>
  </div>
</template>

<script>
  import io from "socket.io-client";
  export default {
    name: 'TikiTopple',
    data() {
      return {
        socket: {},
        player: {},
        color: {},
        score: {},
        goal: {},
        canPlay: {},
        messages: [],
        blocks: {},
        cards: {},
        showInstructions: {},
        instructionText: {},
        numberBlockToMove: {},
        selectedBlocks: [],
        selectable: false,
        selectedCard: {},
      }
    },
    created() {
      this.socket = io("http://localhost:3000");
      this.showInstructions = false;
    },
    mounted() {
      this.printMessage("Entrando nella stanza...");
      this.checkCanPlay();
      if (this.canPlay) {
        this.drawPodium();
        // chiediamo un colore per questo giocatore al socket
        this.socket.emit("ask-color");
        // e ci salviamo il colore che ci viene restituito
        this.socket.on("emit-color", color => {
          this.color = color;
        });
        this.socket.on("send-msg", msg => {
          this.printMessage(msg);
        });
        this.socket.on("emit-blocks", blocks => {
          this.blocks = blocks;
        });
        this.socket.on("emit-cards", cards => {
          this.cards = cards;
        });
        this.socket.on("enable-card", card => {
          this.cards.map(c => {
            if (c.name === card.name) c.usable = true;
          });
        });
      }
    },
    methods: {
      checkCanPlay: function () {
        this.socket.on("connection-enstablished", canPlay => {
          if (!canPlay) {
            this.printMessage("Non puoi giocare");
          }
          this.canPlay = canPlay;
        });
      },
      printMessage: function (msg) {
        this.messages.push(msg);
      },
      drawPodium: function() {
        // ["1", "2", "3"].map(number => {
        //
        // });
      },
      clickedOnCard: function(card) {
        this.numberBlockToMove = card.blocksNumber;
        this.showInstructions = true;
        this.selectable = true;
        this.selectedCard = card;
        if (this.selectedCard.action === 'delete'){
          // se ha scelto il tiki-toast deve cancellare l'ultimo blocchetto, senza poterlo scegliere
          this.selectable = false;
          this.usedCard();
        }
      },
      selectedBlock: function(block) {
        if (!this.selectable) return;
        this.selectedBlocks.push(block);
        console.log("blocchi totali da muovere: " + this.numberBlockToMove);
        console.log("blocchi mossi: " + this.selectedBlocks.length);
        if (this.numberBlockToMove > this.selectedBlocks.length){
          // dobbiamo scegliere ancora un blocchetto
          this.instructionText = "Selezionare il " + this.selectedBlocks.length+1 + " blocco ";
        } else {
          // inviamo le scelte fatte al server e resettiamo le variabili
          this.selectable = false;
          this.showInstructions = false;
          this.numberBlockToMove = 0;
          this.usedCard();
        }
      },
      usedCard: function () {
        this.selectedCard.usable = false;
        this.moveBlocks();
      },
      moveBlocks() {
        this.socket.emit("moved-blocks", this.selectedCard, this.selectedBlocks);
        this.selectedBlocks = [];
      }
    }
  }
</script>

<style scoped>
  .upper-part{
    display: flex;
  }

  .game-table {
    border: 1pt solid black;
    flex-grow: 1;
    flex-basis: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .block {
    border: 1pt solid black;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .selectable {
    cursor: pointer;
  }

  .events-log {
    background-color: lightgray;
    height: 500px;
    width: 500px;
    overflow-y: scroll;
    flex-grow: 1;
    flex-basis: 0;
  }
</style>
