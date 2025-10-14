<template>
  <ion-modal :is-open="isOpen" class="custom-modal" :backdrop-dismiss="false">
    <div class="bg-[#283618] text-[#FEFAE0] p-4">
      <div class="flex justify-between items-center mb-3">
        <p id="poppins" class="font-semibold text-lg">Settings</p>
        <font-awesome-icon :icon="['fas','xmark']" class="text-2xl cursor-pointer" @click="$emit('close')" />
      </div>

      <div class="border border-white/20 rounded-md p-3 bg-white/5">
        <h3 class="font-semibold mb-2">Change Password</h3>
        <form @submit.prevent="save" class="grid md:grid-cols-2 gap-3">
          <div class="flex flex-col md:col-span-2">
            <label class="text-xs mb-1 text-white/90">Current Password</label>
            <div class="relative">
              <input :type="showCurrent ? 'text' : 'password'" v-model="current" class="w-full rounded text-[#222222] px-2 py-2 text-sm bg-[#f9f9f1] placeholder:text-[#6b7280] pr-10" placeholder="••••••••" />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-[#283618] text-xs underline" @click="showCurrent = !showCurrent">{{ showCurrent ? 'Hide' : 'Show' }}</button>
            </div>
          </div>
          <div class="flex flex-col">
            <label class="text-xs mb-1 text-white/90">New Password</label>
            <div class="relative">
              <input :type="showNew ? 'text' : 'password'" v-model="password" class="w-full rounded text-[#222222] px-2 py-2 text-sm bg-[#f9f9f1] placeholder:text-[#6b7280] pr-10" placeholder="••••••••" />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-[#283618] text-xs underline" @click="showNew = !showNew">{{ showNew ? 'Hide' : 'Show' }}</button>
            </div>
          </div>
          <div class="flex flex-col">
            <label class="text-xs mb-1 text-white/90">Confirm Password</label>
            <div class="relative">
              <input :type="showConfirm ? 'text' : 'password'" v-model="confirm" class="w-full rounded text-[#222222] px-2 py-2 text-sm bg-[#f9f9f1] placeholder:text-[#6b7280] pr-10" placeholder="••••••••" />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-[#283618] text-xs underline" @click="showConfirm = !showConfirm">{{ showConfirm ? 'Hide' : 'Show' }}</button>
            </div>
          </div>
          <div class="md:col-span-2 flex gap-2 pt-1">
            <ion-button size="small" fill="solid" class="normal-case" style="--background:#DDA15E; --background-activated:#c3894d; --color:#283618; --border-radius:6px; --padding-start:12px; --padding-end:12px;" @click="save">Save</ion-button>
          </div>
        </form>
      </div>

      <div class="mt-3 border border-white/20 rounded-md p-3 bg-white/5">
        <h3 class="font-semibold mb-2">Logout</h3>
        <ion-button size="small" fill="solid" class="normal-case" style="--background:#606c38; --background-activated:#4d562d; --color:#FEFAE0; --border-radius:6px; --padding-start:12px; --padding-end:12px;" @click="doLogout">Logout</ion-button>
      </div>
    </div>
  </ion-modal>
</template>

<script>
import { IonModal, IonButton } from '@ionic/vue';
import { ref } from 'vue';
import { updateAdminProfile } from '@/services/api';
import { useToast } from '@/composables/useToast';

export default {
  name: 'SuperAdminSettings',
  components: { IonModal, IonButton },
  props: { isOpen: { type: Boolean, default: false } },
  setup(props, { emit }){
    const { toast } = useToast();
  const current = ref('');
  const password = ref('');
  const confirm = ref('');
  const showCurrent = ref(false);
  const showNew = ref(false);
  const showConfirm = ref(false);
    const save = async () => {
      if ((password.value || confirm.value) && password.value !== confirm.value) {
        toast('Passwords do not match', 'error');
        return;
      }
      if (password.value && String(password.value).length < 8) {
        toast('Password must be at least 8 characters', 'error');
        return;
      }
      try {
        if (!current.value && password.value) {
          toast('Please enter your current password', 'error');
          return;
        }
        if (password.value) await updateAdminProfile({ current_password: current.value, password: password.value });
        toast('Updated');
        current.value = ''; password.value = ''; confirm.value = '';
        emit('close');
      } catch (e) {
        toast(e.message || 'Failed to update', 'error');
      }
    };
    const doLogout = () => emit('logout');
  return { current, password, confirm, showCurrent, showNew, showConfirm, save, doLogout };
  }
}
</script>

<style scoped>
.custom-modal::part(content){ max-width: 560px; width: 100%; margin:auto; border-radius: 12px; }
input { color:#222 !important; background:#f9f9f1 !important; }
</style>