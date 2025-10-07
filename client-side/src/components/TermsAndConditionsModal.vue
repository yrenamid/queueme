<template>
  <ion-modal class="custom-modal" :is-open="isOpen" :backdrop-dismiss="false" @didDismiss="handleClose">
    <div class="p-4">
      <div class="flex items-start justify-between mb-2">
        <h2 id="terms-title" class="text-xl font-bold">Terms &amp; Conditions</h2>
        <ion-button aria-label="Close terms and conditions" fill="clear" size="small" @click="handleClose">✕</ion-button>
      </div>
      <div class="max-h-[65vh] overflow-y-auto pr-1 space-y-3 text-sm leading-relaxed">
        <p>
          By joining this queue, you agree to the following terms. Please read them carefully.
        </p>
        <ol class="list-decimal ml-5 space-y-2">
          <li>
            Acceptance: Your use of this service constitutes acceptance of these Terms &amp; Conditions and our Privacy Policy.
          </li>
          <li>
            Contact & Notifications: You consent to be contacted via the phone number and/or email you provide for updates about your queue status, including SMS and/or email notifications.
          </li>
          <li>
            Data Use: We collect basic contact details to manage the queue and improve service. Data is handled in accordance with applicable privacy laws and is not sold to third parties.
          </li>
          <li>
            Queue Conduct: Please arrive when called. If you miss your turn or arrive late, your position may be moved or canceled per business policy.
          </li>
          <li>
            Estimates: Any quoted wait time is an estimate and may change due to operational conditions.
          </li>
          <li>
            Cancellations: You may cancel at any time. The business may cancel or refuse service for reasonable cause.
          </li>
          <li>
            Changes: Terms may be updated from time to time. Continued use implies acceptance of the latest version.
          </li>
        </ol>
        <p>
          If you do not agree, please do not proceed with joining the queue.
        </p>
      </div>
      <div class="mt-4 flex justify-end">
        <ion-button @click="handleClose" class="normal-case">Close</ion-button>
      </div>
    </div>
  </ion-modal>
</template>

<script>
//modal displaying QueueMe terms
import { IonModal, IonButton } from "@ionic/vue";

export default {
  name: "TermsAndConditionsModal",
  components: { IonModal, IonButton },
  props: {
    isOpen: { type: Boolean, default: false },
  },
  emits: ["close"],
  methods: {
    handleClose() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>

</style>
