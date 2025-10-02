<template>
  <div id="poppins" class="text-white rounded-lg">
    <ion-segment class="bg-[#ffffff69] rounded-lg p-1">
      <ion-segment-button
        @click="activeTab = 'sms'"
        :class="[
          'normal-case focus:outline-none active:outline-none',
          activeTab === 'sms'
            ? 'bg-[#606c38] text-white rounded-lg'
            : 'text-[#ffffff78]',
        ]"
        style="
          --highlight-color: transparent;
          --indicator-color: transparent;
          text-decoration: none;
          --border-color: transparent;
        "
      >
        <ion-label id="poppins" class="text-sm font-medium"
          >SMS Notifications</ion-label
        >
      </ion-segment-button>

      <ion-segment-button
        @click="activeTab = 'email'"
        :class="[
          'normal-case focus:outline-none active:outline-none',
          activeTab === 'email'
            ? 'bg-[#606c38] text-white rounded-lg'
            : 'text-[#ffffff78]',
        ]"
        style="
          --highlight-color: transparent;
          --indicator-color: transparent;
          text-decoration: none;
          --border-color: transparent;
        "
      >
        <ion-label id="poppins" class="text-sm font-medium"
          >Email Notifications</ion-label
        >
      </ion-segment-button>
    </ion-segment>

    <div v-if="activeTab === 'sms'">
      <div class="flex items-center justify-between my-3">
        <div>
          <p>Enable SMS Notifications</p>
          <p class="text-xs text-[#fffafa84] font-light">
            Send text messages to customers
          </p>
        </div>
        <div>
          <ion-toggle
            aria-label="tertiary toggle"
            color="tertiary"
            :checked="modelSms"
            @ionChange="onSmsToggle($event)"
          ></ion-toggle>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'email'">
      <div class="flex items-center justify-between my-3">
        <div>
          <p>Enable Email Notifications</p>
          <p class="text-xs text-[#fffafa84] font-light">
            Send emails to customers
          </p>
        </div>
        <div>
          <ion-toggle
            aria-label="tertiary toggle"
            color="tertiary"
            :checked="modelEmail"
            @ionChange="onEmailToggle($event)"
          ></ion-toggle>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Toggle UI for enabling/disabling SMS and Email notifications; emits v-model events and active tab.
import {
  IonSegment,
  IonSegmentButton,
  IonToggle,
  IonLabel,
} from "@ionic/vue";
import { ref, computed, watch } from "vue";

export default {
  name: "AdminNotif2",
  components: {
    IonSegment,
    IonSegmentButton,
  IonToggle,
  IonLabel,
  },
  props: {
    smsEnabled: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: false },
  },
  emits: ['update:smsEnabled', 'update:emailEnabled', 'update:activeTab'],

// Initializes component state and handlers
  setup(props, { emit }) {
  const activeTab = ref("sms");
  // Inform parent about the current tab initially and on change
  watch(activeTab, (val) => emit('update:activeTab', val), { immediate: true });


    const modelSms = computed({
      get: () => !!props.smsEnabled,
      set: (val) => emit('update:smsEnabled', !!val),
    });
    const modelEmail = computed({
      get: () => !!props.emailEnabled,
      set: (val) => emit('update:emailEnabled', !!val),
    });


// Handles on Sms Toggle
    function onSmsToggle(ev) {
      const checked = ev && ev.detail ? !!ev.detail.checked : false;
      emit('update:smsEnabled', checked);
    }

// Handles on Email Toggle
    function onEmailToggle(ev) {
      const checked = ev && ev.detail ? !!ev.detail.checked : false;
      emit('update:emailEnabled', checked);
    }

    return {
      activeTab,
      modelSms,
      modelEmail,
      onSmsToggle,
      onEmailToggle,
    };
  },
};
</script>

<style scoped>
#div {
  color: #fffafa84;
}
</style>
