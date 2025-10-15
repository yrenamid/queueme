<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="flex items-center mx-3">
          <p id="poppins" class="text-[#FEFAE0] text-lg font-semibold">Reset Password</p>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
        <div class="w-full max-w-md border border-[#DDA15E] rounded-lg shadow-md bg-[#283618] text-[#FEFAE0] p-4">
          <div class="mb-3">
            <h1 id="poppins" class="text-xl font-bold">Reset Password</h1>
            <p class="text-sm text-[#FEFAE0]/80">Enter your new password below. The link expires in 1 hour.</p>
          </div>

          <form @submit.prevent="submit" class="space-y-3">
            <div>
              <label class="block text-xs mb-1 text-white/90">New Password</label>
              <ion-input v-model="pwd" class="queueme-input" :type="showNew ? 'text' : 'password'" autocomplete="new-password" placeholder="••••••••"></ion-input>
              <button type="button" class="text-xs underline text-[#FEFAE0] mt-1" @click="showNew=!showNew">{{ showNew ? 'Hide' : 'Show' }}</button>
              <div class="mt-1"><PasswordStrength :password="pwd" /></div>
            </div>
            <div>
              <label class="block text-xs mb-1 text-white/90">Confirm Password</label>
              <ion-input v-model="confirm" class="queueme-input" :type="showConfirm ? 'text' : 'password'" autocomplete="new-password" placeholder="••••••••"></ion-input>
              <button type="button" class="text-xs underline text-[#FEFAE0] mt-1" @click="showConfirm=!showConfirm">{{ showConfirm ? 'Hide' : 'Show' }}</button>
            </div>

            <div v-if="errorMsg" class="text-sm border border-red-500/40 bg-red-900/30 text-red-200 rounded px-3 py-2">❌ {{ errorMsg }}</div>
            <div v-if="done" class="text-sm border border-green-600/40 bg-green-900/30 text-green-200 rounded px-3 py-2">✅ Password reset successful. You can now log in.</div>

            <div class="flex flex-col sm:flex-row gap-2 pt-1">
              <ion-button type="submit" :disabled="loading" size="small" fill="solid" class="normal-case" style="--background:#DDA15E; --background-activated:#c3894d; --color:#283618; --border-radius:8px; --padding-start:14px; --padding-end:14px;">{{ loading ? 'Resetting…' : 'Reset Password' }}</ion-button>
              <ion-button @click="goLogin" size="small" fill="outline" class="normal-case" style="--border-color:#DDA15E; --color:#FEFAE0; --border-radius:8px; --padding-start:14px; --padding-end:14px;">Back to Login</ion-button>
            </div>
          </form>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script>
import { IonPage, IonHeader, IonToolbar, IonContent, IonInput, IonButton } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import PasswordStrength from '@/components/PasswordStrength.vue';
import { resetPassword } from '@/services/api';
export default {
  name: 'ResetPassword',
  components: { IonPage, IonHeader, IonToolbar, IonContent, IonInput, IonButton, PasswordStrength },
  setup(){
    const pwd = ref('');
    const confirm = ref('');
    const token = ref('');
    const done = ref(false);
    const errorMsg = ref('');
    const loading = ref(false);
    const showNew = ref(false);
    const showConfirm = ref(false);
    onMounted(() => {
      const q = new URLSearchParams(location.search);
      token.value = q.get('token') || '';
    });
    const submit = async () => {
      errorMsg.value = '';
      if (!token.value) { errorMsg.value = 'Invalid or missing token.'; return; }
      if (!pwd.value || !confirm.value) { errorMsg.value = 'Please enter and confirm your new password.'; return; }
      if (pwd.value !== confirm.value) { errorMsg.value = 'Passwords do not match.'; return; }
      if (String(pwd.value).length < 8) { errorMsg.value = 'Password must be at least 8 characters.'; return; }
      loading.value = true;
      try { await resetPassword(token.value, pwd.value); done.value = true; } catch (e) { errorMsg.value = e.message || 'Failed to reset password'; } finally { loading.value = false; }
    };
    const goLogin = () => { location.href = '/login'; };
    return { pwd, confirm, token, done, errorMsg, loading, showNew, showConfirm, submit, goLogin };
  }
}
</script>
<style scoped>
ion-header, ion-toolbar { --background:#283618 !important; }
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
