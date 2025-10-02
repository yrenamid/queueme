<template>
  <div class="text-white bg-[#283618] p-3 rounded-lg mx-4 mb-8 md:w-[860px]">
    <div class="flex justify-between items-center mb-2">
      <div>
        <p id="poppins" class="font-semibold text-2xl mb-1">Staff & Queue Settings</p>
        <p id="poppins" class="font-light text-sm">Add your initial staff and configure your queue</p>
      </div>
    </div>

    <ion-segment class="bg-white/10 rounded mb-4 w-full md:w-auto">
      <ion-segment-button value="staff" @click="activeTab='staff'" :class="activeTab==='staff' ? 'bg-[#606C38] text-white' : 'text-white'">
        <ion-label>Staff</ion-label>
      </ion-segment-button>
      <ion-segment-button value="queue" @click="activeTab='queue'" :class="activeTab==='queue' ? 'bg-[#606C38] text-white' : 'text-white'">
        <ion-label>Queue</ion-label>
      </ion-segment-button>
    </ion-segment>

    
    <div v-if="activeTab==='staff'" class="grid md:grid-cols-2 gap-4">
      <div class="border border-white/20 rounded-md p-3">
        <h3 id="poppins" class="font-semibold mb-2 flex items-center justify-between">Staff List
          <ion-button size="small" class="bg-[#BC6C25] normal-case" @click="beginAdd" :disabled="editing">Add</ion-button>
        </h3>
        <div v-if="!staffList.length" class="text-xs text-gray-300">No staff added yet.</div>
        <ul v-else class="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
          <li v-for="s in staffList" :key="s.tempId" class="bg-white/5 rounded px-2 py-2 flex items-start justify-between gap-2">
            <div class="leading-tight">
              <p class="font-semibold">{{ s.name }} <span class="text-[10px] uppercase tracking-wide bg-black/30 px-1 rounded">{{ s.role }}</span></p>
              <p class="text-[11px] opacity-80">{{ s.email }}</p>
            </div>
            <div class="flex gap-1">
              <ion-button size="small" class="bg-[#DDA15E] normal-case" @click="editStaff(s)" :disabled="editing">Edit</ion-button>
              <ion-button size="small" color="danger" class="bg-red-700 normal-case" @click="removeStaff(s)" :disabled="editing || s.role==='owner'">Del</ion-button>
            </div>
          </li>
        </ul>
      </div>
      <div class="border border-white/20 rounded-md p-3" v-if="editing">
        <h4 id="poppins" class="font-semibold mb-2">{{ editMode==='add' ? 'Add Staff' : 'Edit Staff' }}</h4>
        <form @submit.prevent="submitStaff" class="space-y-2 text-xs">
          <div class="flex flex-col">
            <label>Name</label>
            <input v-model="staffForm.name" :maxlength="10" @blur="touchedStaff.name = true" required class="rounded text-black px-2 py-1 text-xs" />
            <p class="text-[11px] text-white/70 self-end mt-1">{{ (staffForm.name || '').length }} / 10</p>
            <p v-if="(touchedStaff.name || staffSubmitAttempted) && staffErrors.name" class="text-red-300 mt-1">{{ staffErrors.name }}</p>
          </div>
          <div class="flex flex-col">
            <label>Email</label>
            <input v-model="staffForm.email" @blur="touchedStaff.email = true" type="email" required class="rounded text-black px-2 py-1 text-xs" />
            <p v-if="(touchedStaff.email || staffSubmitAttempted) && staffErrors.email" class="text-red-300 mt-1">{{ staffErrors.email }}</p>
          </div>
            <div class="flex flex-col" v-if="editMode==='add' || editMode==='edit'">
              <label>Password <span v-if="editMode==='add'" class="text-red-400">*</span></label>
              <input v-model="staffForm.password" @blur="touchedStaff.password = true" :required="editMode==='add'" type="password" minlength="6" class="rounded text-black px-2 py-1 text-xs" />
              <p v-if="(touchedStaff.password || staffSubmitAttempted) && staffErrors.password" class="text-red-300 mt-1">{{ staffErrors.password }}</p>
              <p v-if="editMode==='edit'" class="text-[10px] opacity-80">Leave blank to keep current password</p>
            </div>
          <div class="flex flex-col">
            <label>Role</label>
            <select v-model="staffForm.role" class="rounded text-black px-2 py-1 text-xs">
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div class="flex gap-2 pt-1">
            <ion-button
              size="small"
              type="submit"
              fill="clear"
              class="normal-case border border-[#DDA15E] text-[#DDA15E] rounded-sm hover:bg-[#DDA15E] hover:text-white transition-colors"
            >
              {{ editMode==='add' ? 'Add' : 'Update' }}
            </ion-button>
            <ion-button size="small" fill="clear" class="bg-gray-500 normal-case" @click="cancelStaffEdit">Cancel</ion-button>
          </div>
        </form>
      </div>
    </div>

    
    <div v-else class="grid md:grid-cols-1 gap-4">
      <SettingsTab
        v-model:maxQueueLength="queue.maxQueueLength"
        v-model:reserveSlots="queue.reserveSlots"
        v-model:notifyPush="queue.notifyCustomer"
      />
    </div>

    <div class="mt-4 flex flex-col md:flex-row gap-2">
      <ion-button id="poppins" @click="finish" :disabled="!canComplete" fill="clear" class="md:w-auto w-full bg-[#DDA15E] rounded-sm normal-case text-white text-base">Complete Registration</ion-button>
      <ion-button id="poppins" @click="goBack" fill="clear" class="md:w-auto w-full normal-case text-white border border-[#DDA15E] rounded-sm text-base">Back</ion-button>
    </div>
    <p class="text-xs mt-2 text-red-300" v-if="!staffList.length">At least one staff (owner) is required.</p>
  </div>
</template>

<script>
import { IonButton, IonSegment, IonSegmentButton, IonLabel } from "@ionic/vue";
import SettingsTab from "../components/SettingsTab.vue";

export default {
  name: "QueueSettings",
  components: { IonButton, IonSegment, IonSegmentButton, IonLabel, SettingsTab },
  props: {},
  // data+methods: manage initial staff entries and basic queue settings; emits registration payload
  data() {
    return {
      activeTab: 'staff',
      staffList: [],
      editing: true,
      editMode: 'add',
      staffForm: { tempId: null, name: '', email: '', password: '', role: 'owner' },
  queue: { maxQueueLength: 50, reserveSlots: 0, notifyCustomer: true },
      touchedStaff: { name: false, email: false, password: false },
      staffSubmitAttempted: false,
    };
  },
  emits: ['go-back','submit-registration'],
  methods: {
    beginAdd() {
      this.editing = true; this.editMode = 'add';
  this.staffForm = { tempId: Date.now(), name: '', email: '', password: '', role: 'staff' };
    },
    editStaff(s) {
      this.editing = true; this.editMode = 'edit';
      this.staffForm = { ...s, password: '' };
    },
    removeStaff(s) {
      this.staffList = this.staffList.filter(x => x.tempId !== s.tempId);
    },
    submitStaff() {
      this.staffSubmitAttempted = true;
      if (!this.staffForm.name || !this.staffForm.email || (this.editMode==='add' && !this.staffForm.password)) return;
      if (this.editMode === 'add') {
        this.staffList.push({ ...this.staffForm });
      } else {
        const idx = this.staffList.findIndex(s => s.tempId === this.staffForm.tempId);
        if (idx !== -1) this.staffList[idx] = { ...this.staffForm };
      }
      this.editing = false; this.editMode='add';
      this.touchedStaff = { name: false, email: false, password: false };
      this.staffSubmitAttempted = false;
    },
    cancelStaffEdit() { this.editing = false; },
    finish() {
      if (!this.canComplete) return;
      const mappedStaff = this.staffList.map(s => ({ name: s.name, email: s.email, password: s.password, role: s.role }));
      this.$emit('submit-registration', {
        staffList: mappedStaff,
        maxQueueLength: this.queue.maxQueueLength,
        reserveSlots: this.queue.reserveSlots,
        notifyCustomer: this.queue.notifyCustomer
      });
    },
    goBack() { this.$emit('go-back'); }
  },
  computed: {
    staffErrors() {
      const e = { name: '', email: '', password: '' };
      if (!this.staffForm.name) e.name = 'Name is required';
      else if (String(this.staffForm.name).trim().length > 10) e.name = 'Name must be at most 10 characters';
      const email = String(this.staffForm.email || '');
      if (!email) e.email = 'Email is required';
      else if (/\s/.test(email)) e.email = 'Email cannot contain spaces';
      if (this.editMode === 'add' && !this.staffForm.password) e.password = 'Password is required';
      return e;
    },
    canComplete() {
      return this.queue.maxQueueLength > 0; // owner auto-created from first step
    }
  }
};
</script>

<style>
.tabcontent { display: none; }
.custom-modal::part(content) { max-width: 450px; width: 100%; max-height: 80vh; height: auto; margin: auto; border-radius: 12px; overflow-y: auto; box-sizing: border-box; }
.name span { color: #bc6c25; }
</style>
