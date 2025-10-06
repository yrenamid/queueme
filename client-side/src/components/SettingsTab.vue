<template>
  <div id="poppins" class="text-white rounded-lg">
    <div class="min-h-[200px]">
      
      <div class="flex justify-center gap-4 mt-3">
        <div class="w-full">
          <label class="block text-sm font-light">Max Queue Length</label>
          <ion-input
            v-model="maxQueueLengthModel"
            type="number"
            class="border border-[#DDA15E] bg-[#606C38] rounded-sm"
            placeholder="50"
            style="
              --highlight-color: none;
              --padding-start: 8px;
              --padding-end: 8px;
            "
          ></ion-input>
          <p class="text-xs mt-1 font-light mb-2 text-[#FFFFFFB5]">
            Maximum number of customers in queue
          </p>
          <label class="block text-sm font-light mt-3">{{ staffLabel }}</label>
          <ion-input
            v-model="availableStaffModel"
            type="number"
            class="border border-[#DDA15E] bg-[#606C38] rounded-sm"
            placeholder="1"
            style="
              --highlight-color: none;
              --padding-start: 8px;
              --padding-end: 8px;
            "
          ></ion-input>
          <p class="text-xs mt-1 font-light mb-2 text-[#FFFFFFB5]">Number of active staff used to compute EWT</p>
        </div>
        <div class="w-full">
          <label class="block text-sm font-light">Priority Slots</label>
          <ion-input
            v-model="reserveSlotsModel"
            type="number"
            class="border border-[#DDA15E] bg-[#606C38] rounded-sm"
            placeholder="5"
            style="
              --highlight-color: none;
              --padding-start: 8px;
              --padding-end: 8px;
            "
          ></ion-input>
          <p class="text-xs mt-1 font-light mb-2 text-[#FFFFFFB5]">
            Reserved slots for priority customers
          </p>
        </div>
      </div>
      <div class="mt-3">
        <div class="flex justify-between mb-3">
          <div>
            <p>Allow "Delay My Turn"</p>
            <p class="font-light text-xs text-[#FFFFFFB5] mt-1">
              Enable customers to request a one-time delay before they are called
            </p>
          </div>
          <ion-toggle
            v-model="allowDelayModel"
            aria-label="Allow delay toggle"
            color="tertiary"
            :checked="true"
          ></ion-toggle>
        </div>
        <div class="flex justify-between mb-3">
          <div>
            <p>Allow Online Payments</p>
            <p class="font-light text-xs text-[#FFFFFFB5] mt-1">
              Enable checkout via PayMongo when configured
            </p>
          </div>
          <ion-toggle
            v-model="allowOnlinePaymentModel"
            aria-label="Allow online payments toggle"
            color="tertiary"
          ></ion-toggle>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { IonInput, IonToggle } from "@ionic/vue";
import { computed } from "vue";

export default {
  name: "SettingsTab",
  components: {
    IonInput,
    IonToggle,
  },
  props: {
    maxQueueLength: Number,
    reserveSlots: Number,
  // Deprecated legacy; no longer used
  notifyCustomer: Boolean,
    availableKitchenStaff: Number,
    allowDelay: { type: Boolean, default: true },
    allowOnlinePayment: { type: Boolean, default: false },
  },
  emits: [
    "update:maxQueueLength",
    "update:reserveSlots",
  "update:notifyCustomer",
    "update:availableKitchenStaff",
    "update:allowDelay",
    "update:allowOnlinePayment",
  ],
  // setup: proxy v-model bindings for settings fields; legacy notify kept for compatibility
  setup(props, { emit }) {
    const maxQueueLengthModel = computed({ get: () => props.maxQueueLength, set: v => emit('update:maxQueueLength', Number(v)) });
    const reserveSlotsModel = computed({ get: () => props.reserveSlots, set: v => emit('update:reserveSlots', Number(v)) });
    const availableStaffModel = computed({ get: () => props.availableKitchenStaff, set: v => emit('update:availableKitchenStaff', Number(v)) });
    const staffLabel = computed(() => 'Active Staff Today');
    const allowDelayModel = computed({ get: () => props.allowDelay, set: v => emit('update:allowDelay', !!v) });
    const allowOnlinePaymentModel = computed({ get: () => props.allowOnlinePayment, set: v => emit('update:allowOnlinePayment', !!v) });

    return {
      maxQueueLengthModel,
      reserveSlotsModel,
      availableStaffModel,
      staffLabel,
      allowDelayModel,
      allowOnlinePaymentModel,
    };
  },
};
</script>

<style scoped>
#content {
  font-family: "Poppins", sans-serif;
}
</style>
