<template>
  <div id="container">
    <div class="upper-part">
      <canvas ref="game" width="800" height="500">
      </canvas>
      <div class="events-log">
        <ul>
          <li v-for="message in messages" :key="message">
            {{message}}
          </li>
        </ul>
      </div>
    </div>
    <div class="cards">
      <button v-for="card in cards" :key="card.name" :disabled="!card.usable" @click="usedCard(card)">{{card.name}}</button>
    </div>
  </div>
</template>

<script>
  import io from "socket.io-client";
  export default {
    name: 'TikiTopple',
    data() {
      return {
        context: {},
        socket: {},
        player: {},
        color: {},
        score: {},
        goal: {},
        canPlay: {},
        messages: [],
        startingX: {},
        startingY: {},
        blockWidth: {},
        blockHeight: {},
        cards: {}
      }
    },
    created() {
      this.socket = io("http://localhost:3000");
      this.initCoords();
    },
    mounted() {
      this.printMessage("Entrando nella stanza...");
      this.checkCanPlay();
      if (this.canPlay) {
        this.context = this.$refs.game.getContext("2d");
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
          this.drawBlocks(blocks)
        });
        this.socket.on("emit-cards", cards => {
          this.cards = cards;
        })
      }
    },
    methods: {
      initCoords: function() {
        this.startingX = 100;
        this.startingY = 225;
        this.width = 50;
        this.height = 50;
      },
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
        this.startingY-=this.height;
        ["1", "2", "3"].map(number => {
          this.drawBlock(this.startingX, this.startingY, this.width, this.height, "#DDDDDD", number);
          this.startingX+=this.width;
        });
        this.initCoords();
      },
      drawBlocks: function (blocks) {
        blocks.map(b => {
          this.drawBlock(this.startingX, this.startingY, this.width, this.height, b.color, b.name);
          this.startingX+=this.width;
        });
        this.initCoords();
      },
      drawBlock: function (x, y, width, height, color, text) {
        // bordo
        this.context.strokeRect(x, y, width, height);
        this.context.strokeStyle = "#000";

        // blocchetto
        this.context.fillStyle = color;
        this.context.fillRect(x, y, width, height);

        // testo
        this.context.font = '18px serif';
        this.context.fillStyle = "#000";
        let textWidth = this.context.measureText(text).width;
        this.context.fillText(text, x + width/2 - textWidth/2, y + height/2 + textWidth/3);
      },
      usedCard: function (card) {
        card.usable = false;
        // this.moveBlocks(card.action, );
        this.socket.emit("card-used", card);
      },
      // moveBlocks(cardAction, block1, block2 = null) {
      //
      // }
    }
  }
</script>

<style scoped>
  .upper-part{
    display: flex;
  }

  canvas {
    border: 1pt solid black;
  }

  .events-log {
    background-color: lightgray;
    height: 500px;
    width: 500px;
    overflow-y: scroll;
  }
</style>
