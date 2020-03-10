<template>
  <div>
    <canvas
      ref="game"
      width="500"
      height="500"
      style="border: 1pt solid black"
    >

    </canvas>
  </div>
</template>

<script>
  import io from "socket.io-client";
  export default {
    name: 'TikiTopple',
    data() {
      return {
        socket: {},
        context: {},
        player: {},
        isViewMode: false
      }
    },
    created() {
      this.socket = io("http://localhost:3000");
    },
    mounted() {
      this.socket.on("connection-enstablished", isViewMode => {
        this.isViewMode = isViewMode;
      });

      console.log(this.isViewMode);
      if (!this.isViewMode) {
        console.log("chiediamo un colore");
        this.socket.emit("ask-color");
        this.socket.on("emit-color", data => {
          console.log("colore di appartenenza " + data);
        });
      }
    }
  }
</script>

<style scoped>
</style>
