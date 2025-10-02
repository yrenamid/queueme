<template>
  <ion-card
    id="poppins"
    class="text-start max-w-md w-full bg-[#283618] p-4 rounded-lg"
  >
    <p class="text-white font-semibold mb-1 text-xl">Business Information</p>
    <p class="text-[#FFFFFFB5] text-sm font-light mb-4">
      Enter business details to get started
    </p>

  <form @submit.prevent="handleFormSubmit">
      <div class="text-white my-2 leading-[1.5]">
        <ion-label for="businessName">Business Name</ion-label>
        <ion-input
          :value="businessName"
          @ionInput="onBusinessNameChange"
          @ionBlur="touched.name = true"
          class="input"
          id="businessName"
          type="text"
          placeholder="Enter business name"
          style="--highlight-color: none"
        />
  <p v-if="(touched.name || submitAttempted) && validationErrors.name" class="text-red-200 text-xs mt-1">{{ validationErrors.name }}</p>
      </div>


      <div class="text-white my-2 leading-[1.5]">
        <ion-label for="businessEmail">Email</ion-label>
        <ion-input
          :value="businessEmail"
          @ionInput="onBusinessEmailChange"
          @ionBlur="touched.email = true"
          class="input"
          id="businessEmail"
          type="email"
          placeholder="Enter email"
          style="--highlight-color: none"
        />
  <p v-if="(touched.email || submitAttempted) && validationErrors.email" class="text-red-200 text-xs mt-1">{{ validationErrors.email }}</p>
      </div>

      <div class="text-white my-2 leading-[1.5]">
        <ion-label for="businessPassword">Password</ion-label>
        <ion-input
          :value="businessPassword"
          @ionInput="onBusinessPasswordChange"
          @ionBlur="touched.password = true"
          class="input"
          id="businessPassword"
          type="password"
          placeholder="Enter password"
          style="--highlight-color: none"
        >
          <ion-input-password-toggle slot="end"></ion-input-password-toggle>
        </ion-input>
  <p v-if="(touched.password || submitAttempted) && validationErrors.password" class="text-red-200 text-xs mt-1">{{ validationErrors.password }}</p>
      </div>

      <ion-button
        type="submit"
        fill="clear"
        :disabled="!canSubmit"
        class="btn bg-[#DDA15E] mt-2 w-full rounded-sm normal-case font-semibold h-10 text-base disabled:opacity-60"
        id="poppins"
      >
        Continue
      </ion-button>
    </form>
  </ion-card>
  
</template>

<script>
// Registration step: collects business name, email, and password with basic validation and emits continue.
import {
  IonCard,
  IonButton,
  IonLabel,
  IonInput,
  
} from "@ionic/vue";

export default {
  name: "BusinessForm",
  components: { IonCard, IonButton, IonLabel, IonInput },
  props: {
    businessName: String,
    businessEmail: String,
    businessPassword: String,
    
  },
  emits: [
    "continue",
    "update:business-name",
    "update:business-email",
    "update:business-password",
    
  ],
  data() {
    return {
      touched: { name: false, email: false, password: false },
      submitAttempted: false,
    };
  },

  methods: {
    onBusinessNameChange(e) {
      this.$emit("update:business-name", (e.detail.value || '').toString());
    },
    onBusinessEmailChange(e) {
      this.$emit("update:business-email", (e.detail.value || '').toString());
    },
    onBusinessPasswordChange(e) {
      this.$emit("update:business-password", (e.detail.value || '').toString());
    },
    async handleFormSubmit() {
      this.submitAttempted = true;
      if (!this.canSubmit) {
        return;
      }
      this.$emit("continue");
    },
  },
  computed: {
    validationErrors(){
      const errs = { name: '', email: '', password: '' };
      if (!this.businessName || !String(this.businessName).trim()) errs.name = 'Business name is required';
      const email = String(this.businessEmail || '');
      if (!email) errs.email = 'Email is required';
      else if (/\s/.test(email)) errs.email = 'Email cannot contain spaces';
      const pw = String(this.businessPassword || '');
      if (!pw) errs.password = 'Password is required';
      else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pw)) errs.password = 'Password must be 8+ chars with letters and numbers';
      return errs;
    },
    canSubmit(){
      return Object.values(this.validationErrors).every(v => !v);
    }
  }
};
</script>

<style scoped>
ion-input {
  --border-color: white;
  --padding-start: 8px;
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
