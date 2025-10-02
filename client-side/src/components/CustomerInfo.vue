<template>
  <div class="flex justify-center items-center md:mt-30 mt-5">
    <div id="poppins" class="max-w-sm md:max-w-md lg:max-w-lg mx-2">
      <div class="text-[#FEFAE0] mb-3">
        <p class="text-4xl font-bold text-center">{{ businessName }}</p>
        <p class="text-center">Join our queue!</p>
      </div>
      <div
        class="bg-[#fefae0] rounded-lg p-2 w-full text-[#283618] shadow-xl/30"
      >
        <div v-if="serverError" class="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2 mb-2">
          {{ serverError }}
        </div>
        <div class="mb-3">
          <p class="font-bold text-xl">Customer Information</p>
          <p class="font-light text-xs">Please provide your contact details</p>
        </div>
        <div class="mb-3">
          <ion-label class="text-sm">Name:</ion-label>
          <ion-input
            v-model="customerName"
            class="input"
            placeholder="Enter your name"
            type="text"
            :maxlength="10"
            @ionBlur="touched.name = true"
          ></ion-input>
          <div class="text-[11px] text-[#283618]/70 text-right mt-1">{{ (customerName || '').length }} / 10</div>
          <p v-if="(touched.name || submitAttempted) && validationErrors.name" class="text-red-600 text-xs mt-1">{{ validationErrors.name }}</p>
        </div>
        <div class="mb-3">
          <ion-label class="text-sm">Phone Number:</ion-label>
          <ion-input
            v-model="customerNumberLocal"
            class="input"
            placeholder="Enter your phone number"
            type="number"
            @ionBlur="touched.phone = true"
          ></ion-input>
          <p v-if="(touched.phone || submitAttempted) && validationErrors.phone" class="text-red-600 text-xs mt-1">{{ validationErrors.phone }}</p>
        </div>
        <div class="mb-3">
          <ion-label class="text-sm">Email:</ion-label>
          <ion-input
            v-model="customerEmailLocal"
            class="input"
            placeholder="Enter your email"
            type="email"
            @ionBlur="touched.email = true"
          ></ion-input>
          <p v-if="(touched.email || submitAttempted) && validationErrors.email" class="text-red-600 text-xs mt-1">{{ validationErrors.email }}</p>
        </div>
        <ion-checkbox
          v-model="conditions"
          class="mb-3 text-sm"
          label-placement="end"
        >
          I agree to the
          <button
            type="button"
            class="underline text-blue-700 hover:text-blue-800 focus:outline-none"
            aria-label="Open terms and conditions"
            @click.stop.prevent="openTerms"
          >
            terms and conditions
          </button>
        </ion-checkbox>
        <terms-and-conditions-modal :is-open="showTerms" @close="showTerms=false" />
        <div class="w-full">
          <ion-button
            id="poppins"
            @click="submitBtn"
            fill="clear"
            :disabled="!canSubmit"
            class="normal-case rounded-sm bg-[#283618] text-white w-full font-bold disabled:opacity-60"
            >Submit</ion-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { IonLabel, IonInput, IonCheckbox, IonButton } from "@ionic/vue";
import TermsAndConditionsModal from "./TermsAndConditionsModal.vue";

export default {
  name: "CustomerInfo",
  components: { IonLabel, IonInput, IonCheckbox, IonButton, TermsAndConditionsModal },
  props: {
    customerEmail: String,
    customerNumber: String,
    businessName: { type: String, default: '' },
    serverError: { type: String, default: '' },
  },
  emits: ["continue"],
  data() {
    return {
      customerName: "",
      customerEmailLocal: this.customerEmail || "",
      customerNumberLocal: this.customerNumber || "",
      conditions: false,
      showTerms: false,
      touched: { name: false, phone: false, email: false },
      submitAttempted: false,
    };
  },
  methods: {
    openTerms() {
      this.showTerms = true;
    },
    async submitBtn() {
      this.submitAttempted = true;
      try {
        if (!this.canSubmit) {
          return;
        }
        this.$emit("continue", {
          customerName: this.customerName,
          customerNumber: this.customerNumberLocal,
          customerEmail: this.customerEmailLocal,
        });
      } catch (error) {
        console.log("Error:", error);
      }
    },
  },
  computed: {
    validationErrors(){
      const errs = { name: '', phone: '', email: '' };
      if (!this.customerName || !String(this.customerName).trim()) errs.name = 'Name is required';
      else if (String(this.customerName).trim().length > 10) errs.name = 'Name must be at most 10 characters';
      const digits = String(this.customerNumberLocal || '').replace(/\D/g, '');
      if (!digits) errs.phone = 'Phone is required';
      else if (!(digits.length === 11 && digits.startsWith('09'))) errs.phone = 'Enter a valid PH phone (11 digits starting with 09)';
      const email = String(this.customerEmailLocal || '');
      if (!email) errs.email = 'Email is required';
      else if (/\s/.test(email)) errs.email = 'Email cannot contain spaces';
      return errs;
    },
    canSubmit(){
      return this.conditions && Object.values(this.validationErrors).every(v => !v);
    }
  }
};
</script>

<style scoped>
ion-input {
  --padding-start: 8px;
}
.input {
  --background: #cfd7b2;
  --border-radius: 5px;
  --padding-start: 10px;
  --padding-top: 5px;
  --padding-bottom: 5px;
  --highlight-color: none;
  color: #283618;
}
</style>
