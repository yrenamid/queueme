<template>
  <ion-card
    id="poppins"
    v-if="!showSettingsTab"
    class="text-white bg-[#283618] p-4 rounded-lg w-100"
  >
    <p class="font-semibold text-xl">Business Type</p>
    <p class="font-light text-md text-[#FFFFFFB5]">
      Select your business type to customize your experience
    </p>
    <div class="mt-5 max-w-md w-full">
      <form @submit.prevent="handleFormSubmit">
        <ion-radio-group :value="businessType" @ionChange="businessTypeChange">
          <ion-radio
            value="food"
            class="text-white mb-2 text-base"
            label-placement="end"
            style="--label-padding-start: 0"
            >Food-based Business (Restaurant, Cafe, etc.)</ion-radio
          >
          <ion-radio
            value="service"
            class="text-white text-base"
            label-placement="end"
            style="--label-padding-start: 0"
            >Service-based Business (Salon, Clinic, etc.)</ion-radio
          >
        </ion-radio-group>
        <p v-if="submitAttempted && !businessType" class="text-red-200 text-xs mt-1">Please select a business type</p>

        <div class="my-2">
          <ion-label
            for="address"
            position="stacked"
            class="!text-white w-full max-w-md"
            >Address:</ion-label
          >
          <ion-input
            :value="address"
            @ionInput="onBusinessAddressChange"
            @ionBlur="touched.address = true"
            type="text"
            id="address"
            class="input"
            placeholder="Enter address"
            style="--highlight-color: none"
          ></ion-input>
          <p v-if="(touched.address || submitAttempted) && validationErrors.address" class="text-red-200 text-xs mt-1">{{ validationErrors.address }}</p>
        </div>

        <div class="my-2">
          <ion-label
            for="phone"
            position="stacked"
            class="!text-white !font-3xl"
            >Phone Number:</ion-label
          >
          <ion-input
            :value="phone"
            @ionInput="onBusinessPhoneChange"
            @ionBlur="touched.phone = true"
            type="number"
            id="phone"
            class="input remove-spinner"
            placeholder="Enter phone number"
            style="--highlight-color: none"
          ></ion-input>
          <p v-if="(touched.phone || submitAttempted) && validationErrors.phone" class="text-red-200 text-xs mt-1">{{ validationErrors.phone }}</p>
        </div>

        <ion-button
          type="submit"
          id="poppins"
          fill="clear"
          :disabled="!canSubmit"
          class="btn bg-[#DDA15E] mt-2 w-full rounded-sm normal-case p-1 text-base font-base disabled:opacity-60"
          >Continue</ion-button
        >

        <ion-button
          @click="goBack"
          fill="clear"
          class="normal-case text-white w-full border border-[#DDA15E] mt-2 rounded-sm p-1 text-base font-base"
          >Back</ion-button
        >
      </form>
    </div>
  </ion-card>
</template>

<script>
// Registration step: lets the user pick business type and enter address/phone; validates and emits continue.
import { IonCard, IonRadioGroup, IonRadio, IonLabel, IonInput, IonButton } from "@ionic/vue";
import { ref } from "vue";

export default {
  name: "BusinessType",
  components: { IonCard, IonRadioGroup, IonRadio, IonLabel, IonInput, IonButton },
  props: {
    businessName: String,
    businessType: String,
    address: String,
    phone: String,
  },
  emits: [
    "continue",
    "go-back",
    "update:business-type",
    "update:address",
    "update:phone",
  ],
// Initializes component state and handlers
  setup() {
    const showSettingsTab = ref(false);
    const submitAttempted = ref(false);
    const touched = ref({ address: false, phone: false });
    return { showSettingsTab, submitAttempted, touched };
  },
  methods: {
    businessTypeChange(e) {
      this.$emit("update:business-type", (e.detail.value || '').toString().trim());
    },
    onBusinessAddressChange(e) {
      this.$emit("update:address", (e.detail.value || '').toString());
    },
    onBusinessPhoneChange(e) {
      this.$emit("update:phone", (e.detail.value || '').toString());
    },
    async handleFormSubmit() {
      this.submitAttempted = true;
      if (!this.canSubmit) return;
      this.$emit("continue");
    },
    goBack() {
      this.$emit("go-back");
    },
  },
  computed: {
    validationErrors() {
      const errs = { address: "", phone: "" };
      if (!this.address || !String(this.address).trim()) errs.address = "Address is required";
      const digits = String(this.phone || "").replace(/\D/g, "");
      if (!digits) errs.phone = "Phone is required";
      else if (!(digits.length === 11 && digits.startsWith("09"))) errs.phone = "Enter a valid PH phone (11 digits starting with 09)";
      return errs;
    },
    canSubmit() {
      return !!this.businessType && Object.values(this.validationErrors).every((v) => !v);
    },
  },
};
</script>

<style scoped>
ion-item {
  --background: transparent;
  --ion-item-background: transparent;
  --inner-border-width: 0;
  --highlight-color-focused: transparent;
}

ion-radio {
  --color: #dda15e;
  --border-color: #dda15e;
  --color-checked: #dda15e;
}

.input {
  --background: #ffffff96;
  --border-radius: 5px;
  --padding-start: 10px;
  --padding-top: 5px;
  --padding-bottom: 5px;
  color: #283618;
}
ion-button.btn {
  background-color: #dda15e;
  color: #ffffff;
}
</style>
