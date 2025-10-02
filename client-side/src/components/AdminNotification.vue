<template>
  <ion-modal :is-open="isOpen" class="custom-modal" :backdrop-dismiss="false">
  <div class="flex justify-center items-center bg-[#283618]">
    <div class="text-white p-4 rounded-lg">
      <div class="flex justify-between items-center">
        <div>
            <p id="poppins" class="font-semibold text-2xl mb-1">
                Notification Settings
            </p>
        </div>
        <div>
            <font-awesome-icon :icon="['fas', 'xmark']" class="text-3xl" @click="close"/>
        </div>
      </div>
      <p id="poppins" class="font-light text-xs mb-5 text-gray-100">
                Configure how and when customers receive notifications about their queue
                status
            </p>

      <AdminNotif2 v-show="showNotif"
        v-model:smsEnabled="form.notify_sms"
        v-model:emailEnabled="form.notify_email"
        @update:activeTab="activeTab = $event"
      />

      <div class="mt-3" v-if="activeTab === 'sms'">
        <ion-label>Custom SMS Message</ion-label>
        <ion-input
          v-model="form.template_sms"
          :maxlength="MAX_SMS_LEN"
          placeholder="Hello {customer_name}, your order is ready. Please proceed to counter."
          class="border border-[#DDA15E] rounded-sm"
          style="--highlight-color: none; --padding-start: 8px"
        ></ion-input>
        <p class="text-xs text-[#fffafa84] font-light mt-1">
          Placeholders: <span v-pre>{{customer_name}}</span>, <span v-pre>{{queue_number}}</span>
        </p>
        <div class="flex items-center justify-between mt-1">
          <p class="text-xs" :class="smsLen > MAX_SMS_LEN ? 'text-red-300' : 'text-white/70'">{{ smsLen }} / {{ MAX_SMS_LEN }}</p>
          <p v-if="smsLen > MAX_SMS_LEN" class="text-xs text-red-300">SMS template is too long</p>
        </div>
        <div class="mt-2 p-2 rounded bg-white/10 border border-white/20">
          <p class="text-[11px] text-white/70 mb-1">Preview:</p>
          <p class="text-sm">{{ previewSms }}</p>
        </div>
      </div>

      <div class="mt-3" v-if="activeTab === 'email'">
        <ion-label>Custom Email Message</ion-label>
        <ion-input
          v-model="form.template_email"
          :maxlength="MAX_EMAIL_LEN"
          placeholder="Hello {customer_name}, your order is ready. Please proceed to counter."
          class="border border-[#DDA15E] rounded-sm"
          style="--highlight-color: none; --padding-start: 8px"
        ></ion-input>
        <p class="text-xs text-[#fffafa84] font-light mt-1">
          Placeholders: <span v-pre>{{customer_name}}</span>, <span v-pre>{{queue_number}}</span>
        </p>
        <div class="flex items-center justify-between mt-1">
          <p class="text-xs" :class="emailLen > MAX_EMAIL_LEN ? 'text-red-300' : 'text-white/70'">{{ emailLen }} / {{ MAX_EMAIL_LEN }}</p>
          <p v-if="emailLen > MAX_EMAIL_LEN" class="text-xs text-red-300">Email template is too long</p>
        </div>
        <div class="mt-2 p-2 rounded bg-white/10 border border-white/20">
          <p class="text-[11px] text-white/70 mb-1">Preview:</p>
          <p class="text-sm">{{ previewEmail }}</p>
        </div>
      </div>

      <div class="flex justify-end items-center mt-5">
        <div class="flex gap-2">
          <ion-button
            id="poppins"
            :disabled="saving || !dirty"
            @click="save"
            fill="clear"
            class="w-full bg-[#DDA15E] font-medium rounded-sm normal-case"
            style="--color: white;"
            >{{ saving ? 'Saving...' : dirty ? 'Save Changes' : 'Saved' }}</ion-button>
        </div>
      </div>
    </div>
  </div>
  </ion-modal>
</template>

<script>
// Modal for configuring customer SMS/Email notifications and templates; persists settings via API.
import { IonButton, IonInput, IonLabel } from "@ionic/vue";
import AdminNotif2 from "./AdminNotif2.vue";
import { ref, computed, onMounted, watch } from "vue";
import { getNotificationSettings, updateNotificationSettings } from '@/services/api';
import { useToast } from '@/composables/useToast';

export default {
  name: "AdminNotification",
  components: { IonButton, IonInput, IonLabel, AdminNotif2 },
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },

// Initializes component state and handlers
  setup(props) {
  const showNotif = ref(true);

  const MAX_SMS_LEN = 160;
  const MAX_EMAIL_LEN = 160;
    const saving = ref(false);
    const form = ref({
      notify_sms: false,
      notify_email: false,
      
      template_sms: '',
      template_email: '',
      
    });
    const original = ref('');
    const { toast } = useToast();

    const dirty = computed(() => !!original.value && original.value !== JSON.stringify(form.value));


    const smsLen = computed(() => (form.value.template_sms || '').length);
    const emailLen = computed(() => (form.value.template_email || '').length);


    const sampleData = { customer_name: 'Juan D.', queue_number: 42 };

// Handles render Template
    function renderTemplate(t) {
      const txt = String(t || '');
      return txt
        .replace(/\{\{\s*customer_name\s*\}\}/gi, sampleData.customer_name)
        .replace(/\{\{\s*queue_number\s*\}\}/gi, String(sampleData.queue_number));
    }
    const previewSms = computed(() => renderTemplate(form.value.template_sms));
    const previewEmail = computed(() => renderTemplate(form.value.template_email));


// Handles snapshot
    const snapshot = () => { original.value = JSON.stringify(form.value); };


// Handles load
    const load = async () => {
      try {
        const data = await getNotificationSettings();
        if (data) {
          form.value.notify_sms = !!(data.notify_via_sms ?? data.notify_sms ?? false);
          form.value.notify_email = !!(data.notify_via_email ?? data.notify_email ?? false);

          
          form.value.template_sms = String(data.notify_template_sms ?? data.template_sms ?? '');
          form.value.template_email = String(data.notify_template_email ?? data.template_email ?? '');
          
        }
        snapshot();
      } catch (e) {
        console.error('[load notification settings]', e);
        toast(e.message || 'Failed to load notification settings', 'error');
      }
    };


// Handles save
    const save = async () => {
      try {

        if (smsLen.value > MAX_SMS_LEN) {
          toast(`SMS template exceeds ${MAX_SMS_LEN} characters`, 'error');
          return;
        }
        if (emailLen.value > MAX_EMAIL_LEN) {
          toast(`Email template exceeds ${MAX_EMAIL_LEN} characters`, 'error');
          return;
        }
        saving.value = true;
        await updateNotificationSettings({
          notify_via_sms: form.value.notify_sms ? 1 : 0,
          notify_via_email: form.value.notify_email ? 1 : 0,
          
          notify_template_sms: form.value.template_sms,
          notify_template_email: form.value.template_email,
          
        });
        toast('Notification settings saved');
        snapshot();
      } catch (e) {
        console.error('[save notification settings]', e);
        toast(e.message || 'Failed to save notification settings', 'error');
      } finally {
        saving.value = false;
      }
    };

    watch(() => props.isOpen, (open) => { if (open) load(); });
    onMounted(() => { if (props.isOpen) load(); });

  const activeTab = ref('sms');
  return { showNotif, form, saving, dirty, save, MAX_SMS_LEN, MAX_EMAIL_LEN, smsLen, emailLen, previewSms, previewEmail, activeTab };
  },
  methods:{
    close(){
      this.$emit('close')
    }
  }
};
</script>

<style></style>
