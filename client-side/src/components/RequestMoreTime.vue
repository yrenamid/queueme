<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleClose" class="custom-modal" :backdrop-dismiss="false">
    <div class="flex justify-center items-center">
      <div
        class="max-w-sm w-full mx-auto relative overflow-hidden transform p-6 mx-2"
      >
        <template v-if="!isSubmitted">
          <div class="relative mb-6">
            <ion-button
              fill="clear"
              @click="handleClose"
              class="absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <font-awesome-icon
                :icon="['fas', 'xmark']"
                class="text-sm md:text-lg text-[#283618]"
              />
            </ion-button>

            <div class="text-center">
              <div
                class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#283618] to-[#BC6C25] rounded-2xl flex items-center justify-center transform rotate-3"
              >
                <font-awesome-icon
                  :icon="['fas', 'clock']"
                  class="text-2xl text-white"
                />
              </div>
              <h2 class="text-2xl font-light text-gray-900 mb-2">
                Delay My Turn
              </h2>
              <p class="text-sm text-gray-500">Queue #{{ customer.queueNo }}</p>
            </div>
          </div>

          <div class="grid grid-cols-5 gap-3 mb-6">
            <ion-button
              v-for="option in timeOptions"
              :key="option.value"
              fill="clear"
              @click="setSelectedTime(option.value)"
              :class="[
                'aspect-square rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden normal-case',
                selectedTime === option.value
                  ? option.color + ' border-white scale-110 shadow-lg'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:scale-105',
              ]"
            >
              <span
                :class="[
                  'text-xl font-bold',
                  selectedTime === option.value ? '' : 'text-gray-700',
                ]"
              >
                {{ option.label }}
              </span>
              <span
                :class="[
                  'text-xs',
                  selectedTime === option.value
                    ? 'opacity-80'
                    : 'text-gray-500',
                ]"
              >
                {{ option.unit }}
              </span>
            </ion-button>
          </div>

          <div
            v-if="selectedTime"
            class="text-center mb-6 p-4 bg-gray-50 rounded-2xl"
          >
            <p class="text-sm text-gray-600">
              You chose a delay of
              <span class="font-semibold text-gray-900"
                >{{ selectedTime }} minutes</span
              >
              
            </p>
          </div>

          <ion-button
            expand="block"
            :disabled="!selectedTime"
            fill="clear"
            @click="handleSubmit"
            :class="[
              'w-full py-4 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 normal-case text-xl',
              selectedTime
                ? 'bg-[#283618] text-white hover:bg-opacity-90 shadow-lg hover:shadow-xl'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            ]"
          >
            <span>Send Request</span>
            <font-awesome-icon
              :icon="['fas', 'arrow-right']"
              class="text-2xl text-white ms-4 animate-bounce"
            />
          </ion-button>
        </template>

        <template v-else>
          <div class="p-12 text-center">
            <div class="relative mb-6">
              <div
                class="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto"
              >
                <font-awesome-icon
                  :icon="['fas', 'circle-check']"
                  class="text-4xl text-white"
                />
              </div>
              <div
                class="absolute inset-0 w-20 h-20 mx-auto border-4 border-emerald-200 rounded-full animate-ping"
              />
            </div>

            <h3 class="text-2xl font-light text-gray-900 mb-3">All set!</h3>
            <p class="text-gray-600 mb-2">
              We've added
              <span class="font-semibold text-[#283618]"
                >{{ selectedTime }} minutes</span
              >
            </p>
            <p class="text-sm text-gray-500">to your estimated wait time</p>
          </div>
        </template>
      </div>
    </div>
  </ion-modal>
</template>

<script setup>
// Customer-facing modal that lets a user request to delay their turn by preset minute options and emits submit/close.
import { ref } from "vue";
import { IonModal, IonButton } from "@ionic/vue";

defineProps({
  isOpen: Boolean,
  customer: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close","submit"]);

const selectedTime = ref(null);
const isSubmitted = ref(false);

const timeOptions = [
  { value: 2, label: '2', unit: 'min', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 4, label: '4', unit: 'min', color: 'bg-blue-100 text-blue-700 border-2 border-blue-200' },
  { value: 6, label: '6', unit: 'min', color: 'bg-amber-100 text-amber-700 border-2 border-amber-200' },
  { value: 8, label: '8', unit: 'min', color: 'bg-purple-100 text-purple-700 border-2 border-purple-200' },
  { value: 10, label: '10', unit: 'min', color: 'bg-rose-100 text-rose-700 border-2 border-rose-200' },
];


// Handles set Selected Time
const setSelectedTime = (value) => {
  selectedTime.value = value;
};


// Handles handle Submit
const handleSubmit = () => {
  if (selectedTime.value) {
    isSubmitted.value = true;
    emit('submit', { minutes: selectedTime.value });
    setTimeout(() => {
      isSubmitted.value = false;
      selectedTime.value = null;
      emit("close");
    }, 1200);
  }
};


// Handles handle Close
const handleClose = () => {
  selectedTime.value = null;
  isSubmitted.value = false;
  emit("close");
};
</script>

<style scoped>
.custom-modal {
  --height: auto;
  --width: auto;
  --max-width: 400px;
  --border-radius: 1.5rem;
}
</style>
