<template>
  <div id="poppins" class="flex justify-center items-center md:mt-30 mt-15">
    <div class="bg-[#FEFAE0] px-5 py-3 rounded-xl text-center shadow-xl/30 mx-2">
      <div class="text-4xl font-bold py-2 px-3">
        <p class="text-[#283618]">Welcome to</p>
        <p class="text-[#BC6C25]">{{ businessName }}</p>
      </div>

      <div class="text-[#FEFAE0] py-3 mb-5 mt-3 bg-[#606C38] rounded-sm py-10 px-3">
        <p class="text-sm font-light mb-4">You’ve scanned the QR code</p>
        <p class="text-lg font-semibold">Start joining the queue below</p>
        <p class="text-sm font-light mt-2" v-if="inQueue !== undefined">
          In Queue: <span class="font-semibold">{{ inQueue }}</span>
        </p>
      </div>

      <ion-button
        @click="joinBtn"
        :disabled="isFull"
        fill="clear"
        class="bg-[#283618] hover:opacity-95 normal-case font-bold text-white rounded-xl w-full text-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {{ isFull ? 'Queue is Full' : 'Join the Queue' }}
      </ion-button>
      
      <p v-if="isFull" class="text-red-700 text-sm mt-2">Queue is full, please try again later</p>
      <p class="text-[#606C38] text-xs my-3">
        Powered by <span class="font-semibold">QueueMe</span>
      </p>
    </div>
  </div>
  
</template>
<script>
import { IonButton } from "@ionic/vue";

export default {
  name: "CustomerFrontPage",
  components: { IonButton },
  props: {
    businessName: { type: String, default: '' },
    inQueue: { type: Number, default: undefined },
    isFull: { type: Boolean, default: false }
  },
  emits: ["continue", "update-customer"],
  // setup: emit continue when Join is clicked (push removed)
  setup(props, { emit }) {
    // Join button simply advances the flow
    const joinBtn = () => {
      emit("continue");
    };


    


    return { joinBtn };
  },
};
</script>
<style scoped>
ion-content {
  --background: #283618;
}
</style>
