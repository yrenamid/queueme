<template>
  <ion-page>
    <ion-header class="border-b border-[#fefae0]">
      <ion-toolbar>
        <div class="flex items-center mx-3 cursor-pointer" @click="goHome">
          <img class="h-10 w-10 me-2" src="../images/favicon.png" alt="logo" />
          <p class="name">{{ businessName || 'Queue' }}<span v-if="!businessName">Me</span><span v-else></span></p>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="flex flex-col justify-center items-center min-h-screen">
        <div id="inter" class="text-center mb-5">
          <p class="font-bold text-5xl text-[#FEFAE0]">
            Welcome to <span class="text-[#FFFFFF]">Queue</span
            ><span class="text-[#BC6C25]">Me!</span>
          </p>
        </div>
        <div class="flex justify-center items-center text-white">
          <div
            class="w-full md:w-100 border border-[#DDA15E] p-3 rounded-lg mx-4"
          >
            <div class="flex justify-center items-center">
              <font-awesome-icon
                :icon="['fas', 'user']"
                class="text-5xl mb-2"
              />
            </div>
            <p id="inter" class="text-center font-medium text-2xl">LOGIN</p>
            <form @submit.prevent="handleLogin">
              <div class="mt-3">
                <ion-label id="inter">Email</ion-label>
                <ion-input
                  v-model="email"
                  class="input caret-white"
                  type="email"
                  placeholder="Enter email"
                  style="--highlight-color: none; caret-color: #000000e3"
                ></ion-input>
              </div>
              <div class="mt-3">
                <ion-label id="inter">Password</ion-label>
                <ion-input
                  v-model="password"
                  class="input caret-white"
                  type="password"
                  placeholder="Enter password"
                  style="--highlight-color: none; caret-color: #000000e3"
                ></ion-input>
              </div>
              <ion-button
                type="submit"
                id="poppins"
                fill="clear"
                class="rounded-sm mt-5 h-10 normal-case text-white text-lg w-full bg-[#DDA15E]"
                >Continue</ion-button
              >
            </form>
          </div>
        </div>
        <div class="flex justify-center items-center text-white font-">
          <p id="poppins">Don't have an account yet?</p>
          <ion-button
            @click="register"
            id="poppins"
            fill="clear"
            class="normal-case text-white text-md underline"
            >Register here</ion-button
          >
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonLabel,
  IonInput,
  alertController,
  IonButton,
} from "@ionic/vue";
import { useRouter } from "vue-router";
import { login as apiLogin } from "../services/api";

export default {
  name: "LoginView",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonContent,
    IonLabel,
    IonInput,
    IonButton,
  },
  data() {
    return { email: "", password: "", businessName: localStorage.getItem('businessName') || '' };
  },

  setup() {
    const router = useRouter();
    return {
      router,
    };
  },
  methods: {
    goHome() { this.router.push('/home'); },
    async handleLogin() {
      if (!this.email || !this.password) {
        const alert = await alertController.create({ header: 'Missing Credentials', message: 'Please enter both email and password.', buttons: ['OK']});
        await alert.present();
        return;
      }
      try {
  const resp = await apiLogin(this.email, this.password);
  console.debug('[login] response', resp);
        this.businessName = resp.user.businessName;
        if (resp.user.category) {
          localStorage.setItem('businessCategory', resp.user.category);
        }
        if (resp.user?.role) {
          localStorage.setItem('role', String(resp.user.role));
        }
        if (resp.user?.slug) {
          localStorage.setItem('businessSlug', String(resp.user.slug));
        }
        const slug = resp.user?.slug || localStorage.getItem('businessSlug');
        console.debug('[login] slug from response/localStorage =', slug);
        const target = slug ? `/dashboard/${slug}` : '/home';
        console.debug('[login] navigating to', target);
        this.router.push(target);
      } catch (e) {
        const alert = await alertController.create({ header: 'Login Failed', message: e.message || 'Invalid credentials', buttons: ['OK']});
        await alert.present();
      }
    },
    register() { this.router.push('/register'); }
  }
};
</script>

<style scoped>
ion-header,
ion-toolbar {
  --background: #283618 !important;
  box-shadow: none;
}
ion-content {
  --background: #283618 !important;
}

.input {
  --background: #ffffff96;
  --border-radius: 5px;
  --padding-start: 10px;
  --padding-top: 5px;
  --padding-bottom: 5px;
  color: #283618;
}
</style>
