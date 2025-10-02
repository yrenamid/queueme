<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="flex items-center mx-3">
          <img class="h-10 w-10 me-2" src="../images/favicon.png" alt="logo" />
          <p class="name">Queue<span>Me</span></p>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div id="poppins" class="flex justify-center items-center min-h-screen">
        <div>
          <div class="mb-5">
            <p class="text-center text-[#283618] font-bold text-4xl mb-2">
              Register your Business
            </p>
            <p
              id="head"
              class="text-center font-light text-[#283618] font-light text-base"
            >
              Create an account to start using QueueMe
            </p>
          </div>

          <BusinessForm
            v-show="showBusinessForm"
            v-if="step === 1"
            :business-name="businessName"
            :business-email="businessEmail"
            :business-password="businessPassword"
            @update:business-name="(val) => (businessName = val)"
            @update:business-email="(val) => (businessEmail = val)"
            @update:business-password="(val) => (businessPassword = val)"
            @continue="step = 2"
          />

          <BusinessType
            v-if="step === 2"
            :business-name="businessName"
            :business-type="businessType"
            :address="address"
            :phone="phone"
            @update:business-type="(val) => (businessType = val)"
            @update:address="(val) => (address = val)"
            @update:phone="(val) => (phone = val)"
            @continue="step = 3"
            @go-back="step = 1"
          />

          <QueueSettings
            v-if="step === 3"
            @go-back="step = 2"
            @submit-registration="submitRegistration"
          />

          <div
            id="poppins"
            class="flex justify-center items-center text-[#283618] m-3"
          >
            <p>Already have an account?</p>
            <ion-button
              @click="login"
              id="poppins"
              fill="clear"
              class="normal-case text-[#283618] text-md underline font-normal"
            >
              Login here
            </ion-button>
          </div>
        </div>
      </div>

  <ion-modal :is-open="showSuccess" @didDismiss="showSuccess=false" class="custom-modal" :backdrop-dismiss="false">
        <div class="p-5 text-center bg-[#283618] text-white">
          <h2 class="text-2xl font-bold mb-2">Registration Successful</h2>
          <p class="text-sm mb-4">Customers can scan this QR code to join your queue.</p>
          <img v-if="qrImage" :src="qrImage" alt="Business QR" class="mx-auto mb-4 w-60 h-60" />
          <ion-button class="bg-[#DDA15E] w-full" @click="goToLogin">Go to Login</ion-button>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonContent, IonHeader, IonToolbar, IonButton } from '@ionic/vue';
import BusinessForm from '../components/BusinessForm.vue';
import BusinessType from '../components/BusinessType.vue';
import QueueSettings from '../components/QueueSettings.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { registerBusiness } from '../services/api';
import { useToast } from '@/composables/useToast';
export default {
  name: 'RegisterBusiness',
  components: { IonPage, IonContent, IonHeader, IonToolbar, IonButton, BusinessForm, BusinessType, QueueSettings },

// Initializes component state and handlers
  setup() {
    const router = useRouter();
    const { toast } = useToast();
    const showBusinessForm = ref(true);
    const step = ref(1);
    const businessName = ref('');
    const businessEmail = ref('');
  const businessPassword = ref('');
    const businessType = ref('');
    const address = ref('');
    const phone = ref('');
    const showSuccess = ref(false);
    const qrImage = ref('');
    // Handles login
    const login = () => router.push('/login');

    // Handles submitRegistration
    const submitRegistration = async (payloadFromChild) => {
      try {
        const staffArr = payloadFromChild.staffList && payloadFromChild.staffList.length
          ? payloadFromChild.staffList
          : [ { name: businessName.value, email: businessEmail.value, password: businessPassword.value, role: 'owner' } ];
        const payload = {
          name: businessName.value,
          email: businessEmail.value,
          phone: phone.value,
          password: businessPassword.value,
          category: businessType.value === 'food' ? 'food' : 'service',
          staff: staffArr,
          owner_name: null,
          max_queue_length: Number(payloadFromChild.maxQueueLength ?? payloadFromChild.maxQueueLength) || 50,
          reserve_slots: Number(payloadFromChild.reserveSlots ?? payloadFromChild.reserveSlots) || 0,
          // Single toggle controls push enablement; backend will mirror to notify_via_push
          notify_customer: !!payloadFromChild.notifyCustomer,
        };
        const data = await registerBusiness(payload);
        qrImage.value = data.qr_code_img;
        localStorage.setItem('qrImage', data.qr_code_img);
        localStorage.setItem('businessName', businessName.value);
        showSuccess.value = true;
      } catch (e) { 
        console.error(e); 
        let msg = e.message || 'Registration failed';
        if (e.status === 409) {
          if (msg.includes('email')) msg = 'Email already registered';
          else if (msg.includes('phone')) msg = 'Phone already registered';
          else if (msg.includes('business name')) msg = 'Business name already taken';
          else msg = 'Information already registered in the system';
        } else if (e.status === 400 && msg.includes('phone')) {
          msg = 'Invalid phone number format';
        }
        toast(msg, 'error');
      }
    };

// Handles go To Login
    const goToLogin = () => { showSuccess.value = false; router.replace('/login'); };
    return { showBusinessForm, step, businessName, businessEmail, businessPassword, businessType, address, phone, login, submitRegistration, showSuccess, qrImage, goToLogin };
  }
};
</script>

<style scoped>
ion-header,
ion-toolbar {
  --background: #283618 !important;
  box-shadow: none !important;
}
ion-content {
  --background: #fefae0 !important;
}
a,
a:visited,
a:hover,
a:active {
  color: white;
  text-decoration: underline;
  font-family: "Inter", sans-serif;
}
</style>
