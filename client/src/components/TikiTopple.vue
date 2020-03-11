<template>
  <div id="container">
    <canvas ref="game">
    </canvas>
    <div class="events-log">
      <ul>
        <li v-for="message in messages" :key="message">
          {{message}}
        </li>
      </ul>
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
        messages: []
      }
    },
    created() {
      this.socket = io("http://localhost:3000");
    },
    mounted() {
      this.printMessage("Entrando nella stanza...");
      this.checkCanPlay();
      if (this.canPlay) {
        // chiediamo un colore per questo giocatore al socket
        this.socket.emit("ask-color");
        // e ci salviamo il colore che ci viene restituito
        this.socket.on("emit-color", color => {
          this.color = color;
        });
        this.socket.on("send-msg", msg => {
          this.printMessage(msg);
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
      }
    }
  }
</script>

<style scoped>
  #container{
    display: flex;
  }

  canvas {
    height:500px;
    border: 1pt solid black;
    flex-grow: 1;
    flex-basis: 0;
  }

  .events-log {
    background-color: lightgray;
    height: 500px;
    flex-grow: 1;
    flex-basis: 0;
    overflow-y: scroll;
  }
</style>
