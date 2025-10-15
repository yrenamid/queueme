<template>
  <ion-modal :is-open="isOpen" class="custom-modal" :backdrop-dismiss="false">
    <div class="bg-[#283618] text-[#FEFAE0] p-4">
      <div class="flex justify-between items-center mb-3">
        <p id="poppins" class="font-semibold text-lg">Change Password</p>
        <font-awesome-icon :icon="['fas','xmark']" class="text-2xl cursor-pointer" @click="$emit('close')" />
      </div>
      <form @submit.prevent="save" class="grid gap-3">
        <div class="flex flex-col">
          <label class="text-xs mb-1 text-white/90">Current Password</label>
          <div class="relative">
            <input :type="showCurrent ? 'text' : 'password'" v-model="current" autocomplete="current-password" class="w-full rounded text-[#222222] px-2 py-2 text-sm bg-[#f9f9f1] placeholder:text-[#6b7280] pr-10" placeholder="••••••••" />
            <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-[#283618] text-xs underline" @click="showCurrent = !showCurrent">{{ showCurrent ? 'Hide' : 'Show' }}</button>
          </div>
        </div>
        <div class="flex flex-col">
          <label class="text-xs mb-1 text-white/90">New Password</label>
          <div class="relative">
            <input :type="showNew ? 'text' : 'password'" v-model="password" autocomplete="new-password" class="w-full rounded text-[#222222] px-2 py-2 text-sm bg-[#f9f9f1] placeholder:text-[#6b7280] pr-10" placeholder="••••••••" />
            <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-[#283618] text-xs underline" @click="showNew = !showNew">{{ showNew ? 'Hide' : 'Show' }}</button>
          </div>
          <div class="mt-1"><PasswordStrength :password="password" /></div>
        </div>
        <div class="flex flex-col">
          <label class="text-xs mb-1 text-white/90">Confirm Password</label>
          <div class="relative">
            <input :type="showConfirm ? 'text' : 'password'" v-model="confirm" autocomplete="new-password" class="w-full rounded text-[#222222] px-2 py-2 text-sm bg-[#f9f9f1] placeholder:text-[#6b7280] pr-10" placeholder="••••••••" />
            <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-[#283618] text-xs underline" @click="showConfirm = !showConfirm">{{ showConfirm ? 'Hide' : 'Show' }}</button>
          </div>
        </div>
        <div class="flex gap-2 pt-1">
          <ion-button type="submit" size="small" fill="solid" class="normal-case" :disabled="saving" style="--background:#DDA15E; --background-activated:#c3894d; --color:#283618; --border-radius:6px; --padding-start:12px; --padding-end:12px;">{{ saving ? 'Saving…' : 'Save' }}</ion-button>
          <ion-button size="small" fill="outline" class="normal-case" style="--border-color:#DDA15E; --color:#FEFAE0; --border-radius:6px; --padding-start:12px; --padding-end:12px;" @click="$emit('close')">Cancel</ion-button>
        </div>
      </form>
    </div>
  </ion-modal>
</template>

<script>
import { IonModal, IonButton } from '@ionic/vue';
import PasswordStrength from '@/components/PasswordStrength.vue';
import { ref } from 'vue';
import { changePassword } from '@/services/api';
import { useToast } from '@/composables/useToast';

export default {
  name: 'BusinessChangePassword',
  components: { IonModal, IonButton, PasswordStrength },
  props: { isOpen: { type: Boolean, default: false } },
  setup(props, { emit }) {
    const { toast } = useToast();
    const current = ref('');
    const password = ref('');
    const confirm = ref('');
    const showCurrent = ref(false);
    const showNew = ref(false);
    const showConfirm = ref(false);
    const saving = ref(false);

    const save = async () => {
      if (!current.value) { msg.value = 'Please enter your current password'; err.value = true; return; }
      if (!password.value) { msg.value = 'Please enter a new password'; err.value = true; return; }
      if (password.value !== confirm.value) { msg.value = 'Passwords do not match'; err.value = true; return; }
      try {
        saving.value = true;
        await changePassword(current.value, password.value);
        try { toast('Password updated'); } catch (e) { /* no-op */ }
        current.value = password.value = confirm.value = '';
        emit('close');
      } catch (e) {
        try { toast(e.message || 'Failed to change password', 'error'); } catch (_) { /* no-op */ }
      } finally {
        saving.value = false;
      }
    };
    return { current, password, confirm, showCurrent, showNew, showConfirm, saving, save };
  }
}
</script>

<style scoped>
.custom-modal::part(content){ max-width: 560px; width: 100%; margin:auto; border-radius: 12px; }
input { color:#222 !important; background:#f9f9f1 !important; }
</style>
