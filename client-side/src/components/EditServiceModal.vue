<template>
  <ion-modal class="custom-modal" :is-open="isOpen" :backdrop-dismiss="false">
    <div id="poppins" class="bg-[#283618] p-3 text-[#FEFAE0]">
      <div class="flex justify-between mb-3">
        <div>
          <p class="font-bold text-xl">Edit Service</p>
          <p class="font-light text-sm">Update service details and save.</p>
        </div>
        <font-awesome-icon :icon="['fas','xmark']" class="text-3xl" @click="close" />
      </div>

  <form @submit.prevent="saveChanges">
        <div class="mb-3">
          <ion-label class="text-sm">Service Name</ion-label>
          <ion-input v-model="localItem.name" :maxlength="20" class="bg-[#FEFAE0] border border-[#DDA15E] rounded-sm" placeholder="e.g. Basic Haircut" style="--padding-start:8px; --highlight-color:none" />
          <div class="text-[11px] text-white/70 text-right mt-1">{{ (localItem.name || '').length }} / 20</div>
          <p v-if="errors.name" class="text-red-400 text-xs mt-1">{{ errors.name }}</p>
        </div>

        <div class="mb-3">
          <ion-label class="text-sm">Description</ion-label>
          <ion-textarea v-model="localItem.description" :maxlength="40" class="w-full bg-[#FEFAE0] border border-[#DDA15E] rounded-sm" placeholder="Enter description" style="--padding-start:8px; --highlight-color:none" />
          <div class="text-[11px] text-white/70 text-right mt-1">{{ (localItem.description || '').length }} / 40</div>
        </div>

        <div class="mb-3">
          <ion-label class="text-sm">Price (₱)</ion-label>
          <ion-input v-model="localItem.price" type="number" inputmode="decimal" step="0.01" class="w-full bg-[#FEFAE0] border border-[#DDA15E] rounded-sm" placeholder="e.g. 500.00" style="--padding-start:8px; --highlight-color:none" />
          <p v-if="errors.price" class="text-red-400 text-xs mt-1">{{ errors.price }}</p>
        </div>

        <div class="mb-3">
          <ion-label class="text-sm">Duration (minutes)</ion-label>
          <ion-input v-model="localItem.duration" type="number" class="w-full bg-[#FEFAE0] border border-[#DDA15E] rounded-sm" placeholder="e.g. 30" style="--padding-start:8px; --highlight-color:none" />
        </div>

        <div class="mb-3 flex items-center gap-3">
          <ion-label class="text-sm">Available</ion-label>
          <ion-toggle v-model="localItem.available" class="modern-toggle" color="tertiary" />
        </div>

        

        <ion-button type="submit" :disabled="!isValid" fill="clear" class="bg-[#DDA15E] w-full rounded-sm normal-case text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed">Save Changes</ion-button>
      </form>
    </div>
  </ion-modal>
</template>
<script>
import { IonModal, IonInput, IonLabel, IonButton, IonTextarea, IonToggle } from '@ionic/vue';
import { reactive, watch } from 'vue';
import { useCatalogItemValidation } from '@/composables/useCatalogItemValidation';
export default {
  name: 'EditServiceModal',
  components: { IonModal, IonInput, IonLabel, IonButton, IonTextarea, IonToggle },
  props: { isOpen: Boolean, item: { type: Object, default: () => ({}) } },
  emits: ['close','update-item'],

// Initializes component state and handlers
  setup(props){
  const localItem = reactive({ name:'', description:'', price:'', duration:'', available:true });
  const { errors, isValid } = useCatalogItemValidation(localItem, { requireCategory:false, requireDuration:true, minPrice:0, minDuration:1 });
  watch(() => props.item, (val)=> { Object.assign(localItem, val || {}); if (val && typeof val.available !== 'undefined') localItem.available = !!val.available; else if (val && typeof val.is_available !== 'undefined') localItem.available = !!val.is_available; }, { immediate:true, deep:true });
  return { localItem, errors, isValid };
  },
  methods:{
    close(){ this.$emit('close'); },
  saveChanges(){ if(!this.isValid) return; this.$emit('update-item', { ...this.localItem, price: Number(this.localItem.price), duration: Number(this.localItem.duration), available: !!this.localItem.available }); this.close(); }
  }
};
</script>
<style scoped>
ion-input, ion-textarea { color:#283618; }
.custom-modal ion-toggle.modern-toggle { --width: 46px; --height: 26px; --handle-width: 22px; --handle-height: 22px; --handle-box-shadow: 0 1px 2px rgba(0,0,0,0.25); --track-background: rgba(255,255,255,0.18); --track-background-checked: #DDA15E; --background: rgba(255,255,255,0.18); --background-checked: #DDA15E; --handle-background: #FEFAE0; --handle-background-checked: #FEFAE0; }
.custom-modal ion-toggle.modern-toggle::part(track) { border-radius: 9999px; transition: background-color .2s ease; }
.custom-modal ion-toggle.modern-toggle::part(handle) { border-radius: 9999px; transition: transform .2s ease; }
</style>
