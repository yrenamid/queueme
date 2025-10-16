<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="flex items-center mx-3">
          <p id="poppins" class="text-[#FEFAE0] text-lg font-semibold">Forgot Password</p>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
        <div class="w-full max-w-md border border-[#DDA15E] rounded-lg shadow-md bg-[#283618] text-[#FEFAE0] p-4">
          <div class="mb-3">
            <h1 id="poppins" class="text-xl font-bold">Forgot Password</h1>
            <p class="text-sm text-[#FEFAE0]/80">Enter your registered email to receive a password reset link.</p>
          </div>

          <form @submit.prevent="submit" class="space-y-3">
            <div>
              <label class="block text-xs mb-1 text-white/90">Email</label>
              <ion-input
                v-model="email"
                class="queueme-input"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                style="--highlight-color:none;"
              ></ion-input>
            </div>


            <div v-if="errorMsg" class="text-sm border border-red-500/40 bg-red-900/30 text-red-200 rounded px-3 py-2">
              ❌ {{ errorMsg }}
            </div>
            <div v-if="sent" class="text-sm border border-green-600/40 bg-green-900/30 text-green-200 rounded px-3 py-2">
              ✅ If an account exists for that email, you’ll receive a password reset link. Please check your inbox and spam.
            </div>

            <div class="flex flex-col sm:flex-row gap-2 pt-1">
              <ion-button type="submit" :disabled="loading" size="small" fill="solid" class="normal-case"
                style="--background:#DDA15E; --background-activated:#c3894d; --color:#283618; --border-radius:8px; --padding-start:14px; --padding-end:14px;">
                {{ loading ? 'Sending…' : 'Send Reset Link' }}
              </ion-button>
              <ion-button @click="goLogin" size="small" fill="outline" class="normal-case"
                style="--border-color:#DDA15E; --color:#FEFAE0; --border-radius:8px; --padding-start:14px; --padding-end:14px;">
                Back to Login
              </ion-button>
            </div>
          </form>
        </div>
      </div>
    </ion-content>
  </ion-page>
  
</template>

<script>
import { IonPage, IonHeader, IonToolbar, IonContent, IonInput, IonButton } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { forgotPassword } from '@/services/api';

export default {
  name: 'ForgotPassword',
  components: { IonPage, IonHeader, IonToolbar, IonContent, IonInput, IonButton },
  setup(){
    const email = ref('');
  const sent = ref(false);
    const errorMsg = ref('');
    const loading = ref(false);
    const router = useRouter();

    const isValidEmail = (e) => /.+@.+\..+/.test(String(e||'').trim());

    const submit = async () => {
      errorMsg.value = '';
      sent.value = false;
      if (!isValidEmail(email.value)) {
        errorMsg.value = "We couldn’t find an account with that email. Please try again.";
        return;
      }
      loading.value = true;
      try {
  await forgotPassword(email.value.trim());
        sent.value = true;
      } catch (e) {
        errorMsg.value = "We couldn’t find an account with that email. Please try again.";
      } finally {
        loading.value = false;
      }
    };

    const goLogin = () => router.push('/login');

  return { email, sent, errorMsg, loading, submit, goLogin };
  }
}
</script>

<style scoped>
ion-header, ion-toolbar { --background:#283618 !important; box-shadow:none; }
ion-content { --background:#283618 !important; }

.queueme-input {
  --background: #f9f9f1;
  --color: #222222;
  --placeholder-color: #6b7280;
  --border-radius: 8px;
  --padding-start: 10px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  --border-color: #8fa870;
}
.queueme-input:hover { filter: brightness(0.98); }
.queueme-input.ion-focused { box-shadow: 0 0 0 2px rgba(143,168,112,0.4); }
</style>
