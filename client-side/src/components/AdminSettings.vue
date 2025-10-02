<template>
  <ion-modal :is-open="isOpen" class="custom-modal" :backdrop-dismiss="false">
    <div class="flex justify-center items-center bg-[#283618] relative">
      
      <div v-if="initialLoading" class="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
        <div class="text-white text-lg" id="poppins">Loading...</div>
      </div>
      <div class="text-white p-3 rounded-lg w-full max-w-4xl" :class="{ 'opacity-40 pointer-events-none': initialLoading }">
        <div class="flex justify-between items-center">
          <div>
            <p id="poppins" class="font-semibold text-2xl mb-1">
              Staff & Queue Settings
            </p>
          </div>
          <div>
            <font-awesome-icon
              :icon="['fas', 'xmark']"
              class="text-3xl cursor-pointer"
              @click="close"
            />
          </div>
        </div>
        <p id="poppins" class="font-light text-sm mb-5">
          Manage your staff members and queue configuration
        </p>

        <ion-segment class="bg-white/10 rounded mb-4 w-full md:w-auto">
          <ion-segment-button v-if="isOwner" value="staff" @click="activeSettingsTab='staff'" :class="activeSettingsTab==='staff' ? 'bg-[#606C38] text-white' : 'text-white'">
            <ion-label>Staff</ion-label>
          </ion-segment-button>
          <ion-segment-button value="queue" @click="activeSettingsTab='queue'" :class="activeSettingsTab==='queue' ? 'bg-[#606C38] text-white' : 'text-white'">
            <ion-label>Queue</ion-label>
          </ion-segment-button>
        </ion-segment>

        <div v-if="activeSettingsTab==='queue'" class="grid md:grid-cols-1 gap-4">
          <SettingsTab
            v-model:maxQueueLength="form.maxQueueLength"
            v-model:reserveSlots="form.reserveSlots"
            v-model:notifyPush="form.notifyCustomer"
            v-model:availableKitchenStaff="form.availableKitchenStaff"
            v-model:allowDelay="form.allowDelay"
          />
          <div class="rounded-md border border-white/20 bg-white/5 p-3 text-xs text-white/90">
            <div class="flex items-start gap-2">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-orange-200 text-orange-800 font-bold text-[10px]">i</span>
              <div>
                <p class="font-semibold mb-1">Delayed status</p>
                <ul class="list-disc ml-5 space-y-1">
                  <li>Customers can choose “Delay My Turn” only while Waiting (before being called).</li>
                  <li>When selected, their Estimated Wait Time increases by the chosen minutes and their status becomes <span class="px-1 rounded bg-orange-200 text-orange-800">Delayed</span>.</li>
                  <li>Only the requesting customer’s EWT is changed. Other customers are not affected.</li>
                  <li>Once a customer is Called, Paid/Processing, or Served, the delay option is unavailable.</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="mt-2 flex gap-2">
            <ion-button id="poppins" @click="saveSettings" fill="clear" :disabled="saving || !dirty" class="bg-[#DDA15E] rounded-sm normal-case text-white px-4">
              {{ saving ? 'Saving...' : dirty ? 'Save Changes' : 'Saved' }}
            </ion-button>
            <ion-button v-if="dirty" fill="clear" class="bg-gray-500 normal-case" @click="resetChanges">Reset</ion-button>
          </div>
        </div>

  <div v-else-if="isOwner" class="border border-white/20 rounded-md p-3 relative">
            <h3 id="poppins" class="font-semibold mb-2 flex items-center justify-between">Staff Members
              <ion-button
                size="small"
                fill="clear"
                class="normal-case border border-[#DDA15E] text-[#DDA15E] rounded-sm hover:bg-[#DDA15E] hover:text-white transition-colors"
                @click="beginAdd"
              >Add</ion-button>
            </h3>
            
            <div v-if="staffLoading" class="text-sm text-gray-300">Loading staff...</div>
            <div v-else>
              <div class="mb-2">
                <input v-model="staffSearch" placeholder="Search staff by name or email" class="w-full rounded px-2 py-1 text-xs text-black" />
              </div>
              <div v-if="!filteredStaff.length" class="text-sm text-gray-300">No staff found.</div>
              <ul v-else class="space-y-2 max-h-72 overflow-y-auto pr-1">
              <li v-for="s in filteredStaff" :key="s.id" class="bg-white/5 rounded px-2 py-2 flex items-start justify-between gap-2">
                <div class="text-xs leading-tight">
                  <p class="font-semibold">{{ s.name }} <span class="text-[10px] uppercase tracking-wide bg-black/30 px-1 rounded">{{ s.role }}</span></p>
                  <p class="text-[11px] opacity-80">{{ s.email }}</p>
                </div>
                <div class="flex gap-1">
                  <ion-button size="small" class="bg-[#DDA15E] normal-case" @click="editStaff(s)" :disabled="s.role==='owner' && editing">Edit</ion-button>
                  <ion-button size="small" color="danger" class="bg-red-700 normal-case" @click="removeStaff(s)" :disabled="s.role==='owner'">Del</ion-button>
                </div>
              </li>
              </ul>
            </div>

            
            <div v-if="editing" class="mt-4 border-t border-white/10 pt-3">
              <h4 id="poppins" class="font-semibold mb-2">{{ editMode==='add' ? 'Add Staff' : 'Edit Staff' }}</h4>
              <form @submit.prevent="submitStaff" class="space-y-2 text-xs">
                <div class="flex flex-col">
                  <label>Name</label>
                  <input v-model="staffForm.name" :maxlength="10" required class="rounded text-black px-2 py-1 text-xs" />
                  <p class="text-[11px] text-white/70 self-end mt-1">{{ (staffForm.name || '').length }} / 10</p>
                  <p v-if="staffValidationErrors.name" class="text-red-300 text-xs mt-1">{{ staffValidationErrors.name }}</p>
                </div>
                <div class="flex flex-col">
                  <label>Email</label>
                  <input v-model="staffForm.email" type="email" required class="rounded text-black px-2 py-1 text-xs" />
                  <p v-if="staffValidationErrors.email" class="text-red-300 text-xs mt-1">{{ staffValidationErrors.email }}</p>
                </div>
                <div class="flex flex-col" v-if="editMode==='add'">
                  <label>Password</label>
                  <input v-model="staffForm.password" type="password" :required="editMode==='add'" class="rounded text-black px-2 py-1 text-xs" />
                  <p v-if="staffValidationErrors.password" class="text-red-300 text-xs mt-1">{{ staffValidationErrors.password }}</p>
                </div>
                <div class="flex flex-col" v-if="editMode==='edit' && staffForm.password">
                  <label>New Password (optional)</label>
                  <input v-model="staffForm.password" type="password" class="rounded text-black px-2 py-1 text-xs" />
                  <p v-if="staffValidationErrors.password" class="text-red-300 text-xs mt-1">{{ staffValidationErrors.password }}</p>
                </div>
                <div class="flex flex-col" v-if="editMode==='add'">
                  <label>Phone (optional)</label>
                  <input v-model="staffForm.phone" type="tel" class="rounded text-black px-2 py-1 text-xs" placeholder="e.g. 09171234567" />
                  <p v-if="staffValidationErrors.phone" class="text-red-300 text-xs mt-1">{{ staffValidationErrors.phone }}</p>
                </div>
                <div class="flex flex-col">
                  <label>Role</label>
                  <select
                    v-model="staffForm.role"
                    class="role-select w-full px-2 py-1 text-xs rounded border border-white/20 bg-white/10 text-white focus:bg-white focus:text-[#283618] focus:border-[#DDA15E] transition-colors"
                  >
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
                <div class="flex gap-2 pt-1">
                  <ion-button
                    size="small"
                    type="submit"
                    fill="clear"
                    class="normal-case border border-[#DDA15E] text-[#DDA15E] rounded-sm hover:bg-[#DDA15E] hover:text-white transition-colors disabled:opacity-60"
                    :disabled="staffSubmitting || !staffCanSubmit"
                  >
                    {{ staffSubmitting ? 'Please wait' : (editMode==='add' ? 'Add' : 'Update') }}
                  </ion-button>
                  <ion-button size="small" fill="clear" class="bg-gray-500 normal-case" @click="cancelStaffEdit" :disabled="staffSubmitting">Cancel</ion-button>
                </div>
                <p v-if="staffMessage" class="text-[11px]" :class="staffError ? 'text-red-300' : 'text-green-300'">{{ staffMessage }}</p>
              </form>
            </div>
          </div>
        </div>
    </div>
  </ion-modal>
</template>

<script>
import { ref, watch, onMounted, computed } from 'vue';
import { IonModal, IonButton, IonSegment, IonSegmentButton, IonLabel } from '@ionic/vue';
import SettingsTab from './SettingsTab.vue';
import { getSettings, updateSettings, getStaffList, createStaff, updateStaff as apiUpdateStaff, deleteStaff as apiDeleteStaff } from '@/services/api';
import { useToast } from '@/composables/useToast';

export default {
  name: 'AdminSettings',
  components: { IonModal, IonButton, IonSegment, IonSegmentButton, IonLabel, SettingsTab },
  props: { isOpen: { type: Boolean, default: false } },
  // setup: load/update queue settings and manage staff list with validation and toasts
  setup(props, { emit }) {
    const role = ref(typeof window !== 'undefined' ? (localStorage.getItem('role') || '') : '');
    const isOwner = computed(() => role.value === 'owner');
    const activeSettingsTab = ref(isOwner.value ? 'staff' : 'queue');
    const initialLoading = ref(false);
    const staffLoading = ref(false);
    const saving = ref(false);
    const saveMessage = ref('');
    const saveError = ref(false);

    const form = ref({
      maxQueueLength: 50,
      reserveSlots: 0,
      notifyCustomer: true,
      availableKitchenStaff: 1,
      allowDelay: true,
    });

    const originalSnapshot = ref(null);
    const existingStaff = ref([]);
    const staffSearch = ref('');
    const filteredStaff = computed(() => {
      const q = (staffSearch.value || '').toLowerCase();
      if (!q) return existingStaff.value;
      return existingStaff.value.filter(
        (s) => String(s.name || '').toLowerCase().includes(q) || String(s.email || '').toLowerCase().includes(q)
      );
    });

    const editing = ref(false);
    const editMode = ref('add'); // 'add' | 'edit'
    const staffForm = ref({ id: null, name: '', email: '', password: '', phone: '', role: 'cashier' });
    const staffSubmitting = ref(false);
    const staffMessage = ref('');
    const staffError = ref(false);

    const { toast } = useToast();

    const staffValidationErrors = computed(() => {
      const errs = { name: '', email: '', password: '', phone: '' };
      if (!staffForm.value.name || !String(staffForm.value.name).trim()) errs.name = 'Name is required';
      else if (/\s/.test(String(staffForm.value.name).trim())) errs.name = 'Name cannot contain internal spaces';
      else if (String(staffForm.value.name).trim().length > 10) errs.name = 'Name must be at most 10 characters';
      const email = String(staffForm.value.email || '');
      if (!email) errs.email = 'Email is required';
      else if (/\s/.test(email)) errs.email = 'Email cannot contain spaces';
      const pw = String(staffForm.value.password || '');
      if (editMode.value === 'add') {
        if (!pw) errs.password = 'Password is required';
        else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pw)) errs.password = 'Password must be 8+ chars with letters and numbers';
      } else if (pw && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pw)) {
        errs.password = 'Password must be 8+ chars with letters and numbers';
      }
      const phoneDigits = String(staffForm.value.phone || '').replace(/\D/g, '');
      if (phoneDigits && !(phoneDigits.length === 11 && phoneDigits.startsWith('09'))) {
        errs.phone = 'Enter a valid PH phone (11 digits starting with 09)';
      }
      return errs;
    });

    const staffCanSubmit = computed(() => {
      return Object.values(staffValidationErrors.value).every((v) => !v);
    });

  const staffChanged = () => false; // placeholder: extend if staff diffing is added

    const dirty = computed(() => {
      if (!originalSnapshot.value) return false;
      const current = JSON.stringify({
        maxQueueLength: form.value.maxQueueLength,
        reserveSlots: form.value.reserveSlots,
        notifyCustomer: form.value.notifyCustomer,
        availableKitchenStaff: form.value.availableKitchenStaff,
        allowDelay: form.value.allowDelay,
      });
      return current !== originalSnapshot.value.settings || staffChanged();
    });

    const snapshot = () => {
      originalSnapshot.value = {
        settings: JSON.stringify({
          maxQueueLength: form.value.maxQueueLength,
          reserveSlots: form.value.reserveSlots,
          notifyCustomer: form.value.notifyCustomer,
          availableKitchenStaff: form.value.availableKitchenStaff,
          allowDelay: form.value.allowDelay,
        }),
      };
    };

    const load = async () => {
      initialLoading.value = true;
      saveMessage.value = '';
      try {
        const data = await getSettings();
        if (data) {
          form.value.maxQueueLength = data.max_queue_length ?? 50;
          form.value.reserveSlots = data.reserve_slots ?? 0;
          form.value.notifyCustomer = data.notify_customer ?? true;
          form.value.availableKitchenStaff = data.available_kitchen_staff != null ? Number(data.available_kitchen_staff) : 1;
          form.value.allowDelay = data.allow_delay == null ? true : !!Number(data.allow_delay);
        }
        await loadStaff();
        snapshot();
      } catch (e) {
        console.error('[load settings]', e);
      } finally {
        initialLoading.value = false;
      }
    };

    const loadStaff = async () => {
      staffLoading.value = true;
      try {
        if (isOwner.value) {
          const staff = await getStaffList();
          existingStaff.value = staff;
        } else {
          existingStaff.value = [];
        }
      } catch (e) {
        console.error('[load staff]', e);
      } finally {
        staffLoading.value = false;
      }
    };

    const saveSettings = async () => {
      saveMessage.value = '';
      saveError.value = false;
      try {
        saving.value = true;
        await updateSettings({
          max_queue_length: form.value.maxQueueLength,
          reserve_slots: form.value.reserveSlots,
          notify_customer: form.value.notifyCustomer,
          available_kitchen_staff: form.value.availableKitchenStaff,
          allow_delay: form.value.allowDelay ? 1 : 0,
        });
        toast('Settings saved');
        snapshot();
      } catch (e) {
        console.error('[save settings]', e);
        toast(e.message || 'Failed to save settings', 'error');
        saveError.value = true;
      } finally {
        saving.value = false;
      }
    };

    const resetChanges = () => {
      if (!originalSnapshot.value) return;
      const saved = JSON.parse(originalSnapshot.value.settings);
      form.value.maxQueueLength = saved.maxQueueLength;
      form.value.reserveSlots = saved.reserveSlots;
      form.value.notifyCustomer = saved.notifyCustomer;
      form.value.availableKitchenStaff = saved.availableKitchenStaff;
      form.value.allowDelay = saved.allowDelay;
    };

    const beginAdd = () => {
      if (!isOwner.value) return;
      editing.value = true;
      editMode.value = 'add';
      staffMessage.value = '';
      staffError.value = false;
      staffForm.value = { id: null, name: '', email: '', password: '', phone: '', role: 'cashier' };
    };

    const originalEdit = ref({ name: '', email: '', phone: '', role: '' });

    const editStaff = (s) => {
      if (!isOwner.value) return;
      editing.value = true;
      editMode.value = 'edit';
      staffMessage.value = '';
      staffError.value = false;
      staffForm.value = { id: s.id, name: s.name, email: s.email, password: '', phone: s.phone || '', role: s.role };
      originalEdit.value = { name: s.name, email: s.email, phone: s.phone || '', role: s.role };
    };

    const cancelStaffEdit = () => {
      editing.value = false;
    };

    const staffDirty = computed(
      () =>
        editing.value &&
        editMode.value === 'edit' &&
        (staffForm.value.name !== originalEdit.value.name ||
          staffForm.value.email !== originalEdit.value.email ||
          staffForm.value.role !== originalEdit.value.role ||
          !!staffForm.value.password)
    );

    const submitStaff = async () => {
      if (!isOwner.value) return;
      if (!staffCanSubmit.value) return;
      staffSubmitting.value = true;
      staffMessage.value = '';
      staffError.value = false;
      try {
        if (editMode.value === 'add') {
          const payload = {
            name: staffForm.value.name,
            email: staffForm.value.email,
            password: staffForm.value.password,
            role: staffForm.value.role,
          };
          if (staffForm.value.phone) payload.phone = staffForm.value.phone;
          await createStaff(payload);
          toast('Staff created');
        } else {
          const payload = { name: staffForm.value.name, email: staffForm.value.email, role: staffForm.value.role };
          if (staffForm.value.password) payload.password = staffForm.value.password;
          if (staffForm.value.phone !== undefined) payload.phone = staffForm.value.phone;
          await apiUpdateStaff(staffForm.value.id, payload);
          toast('Staff updated');
        }
        await loadStaff();
        editing.value = false;
      } catch (e) {
        const respMsg =
          e && e.response && e.response.data && (e.response.data.message || e.response.data.error)
            ? String(e.response.data.message || e.response.data.error)
            : '';
        const status = e && e.response && e.response.status ? e.response.status : e.status;
        let msg = respMsg || e.message || 'Staff save failed';
        const lower = String(msg).toLowerCase();
        if (status === 409 && (lower.includes('already registered') || lower.includes('already exists'))) {
          msg = 'Email or phone already registered in the system';
        } else if ((status === 400 || status === 422) && lower.includes('phone')) {
          msg = 'Invalid phone number format';
        }
        toast(String(msg).replace(/^Server\s+\d+:\s*/i, ''), 'error');
        staffError.value = true;
        console.error('[staff submit]', e);
      } finally {
        staffSubmitting.value = false;
      }
    };

    const removeStaff = async (s) => {
      if (!isOwner.value) return;
      if (s.role === 'owner') return; // safety
      if (!confirm(`Delete staff ${s.name}?`)) return;
      try {
        await apiDeleteStaff(s.id);
        await loadStaff();
        toast('Staff deleted');
      } catch (e) {
        console.error('[delete staff]', e);
        toast('Delete failed', 'error');
      }
    };

    const close = () => {
      if (editing.value && staffDirty.value) {
        if (!confirm('Discard staff changes?')) return;
      }
      emit('close');
    };

    watch(
      () => props.isOpen,
      (open) => {
        if (open) load();
      }
    );
    onMounted(() => {
      if (props.isOpen) load();
    });

    return {
      isOwner,
      activeSettingsTab,
      form,
      existingStaff,
      staffSearch,
      filteredStaff,
      initialLoading,
      staffLoading,
      saving,
      saveSettings,
      saveMessage,
      saveError,
      dirty,
      resetChanges,
      beginAdd,
      editStaff,
      removeStaff,
      editing,
      editMode,
      staffForm,
      submitStaff,
      cancelStaffEdit,
      staffSubmitting,
      staffMessage,
      staffError,
      staffDirty,
      staffValidationErrors,
      staffCanSubmit,
      close,
    };
  },
};
</script>

<style scoped>
/* Role dropdown theme: collapsed uses dark panel with white text; focus/expanded flips to light with dark text */
.role-select {
  appearance: none;
  background-color: rgba(255, 255, 255, 0.08); /* bg-white/10 */
  color: #fff;
}
.role-select:focus {
  background-color: #fff;
  color: #283618; /* dark text matching theme background */
  outline: none;
}
.role-select option {
  color: #283618; /* ensure readable on light dropdown panel */
  background: #fff; /* light option background for contrast */
}
.role-select option:checked {
  background: #DDA15E; /* orange highlight */
  color: #1f2937; /* dark gray text on orange for readability */
}
.role-select option:hover {
  background: #F1D1A2; /* lighter orange on hover */
  color: #1f2937;
}

.modal-content-wrapper {
  max-height: 100%;
  overflow-y: auto;
  padding: 1rem;
  box-sizing: border-box;
}
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
</style>
