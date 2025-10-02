<template>
  <div
    id="poppins"
    class="border border-gray-200 my-5 mx-3 p-3 rounded-lg text-[#283618] shadow-lg"
  >
    <p class="font-bold text-2xl">Menu Management</p>
    <p class="font-light text-sm text-gray-400 my-2">
      Manage the menu items displayed to customers
    </p>

    
    <div class="flex flex-col md:flex-row gap-4 md:items-end justify-between mt-5">
      <div class="flex flex-col md:flex-row gap-4 w-full">
        <div v-if="isFood" class="flex items-center gap-2">
          <ion-label class="text-sm">Category</ion-label>
          <div id="poppins" class="px-2 border border-gray-200 text-sm rounded-sm">
            <ion-select v-model="allCategories" placeholder="All" interface="popover" style="--padding: auto; --indicator-color: transparent; --border-color: transparent; --highlight-color: transparent;">
              <ion-select-option value="">All Categories</ion-select-option>
              <ion-select-option v-for="(cat, index) in categories" :key="index" :value="cat">{{ cat }}</ion-select-option>
            </ion-select>
          </div>
        </div>
        <div class="flex-1">
          <ion-input v-model="searchTerm" placeholder="Search name or description" class="border border-gray-300 rounded-sm" style="--padding-start:8px"></ion-input>
        </div>
      </div>
      <div class="flex justify-end">
        <ion-button @click="handleShowAddItem">+Add {{ isFood ? 'Item' : 'Service' }}</ion-button>
      </div>
    </div>

    
    <div v-if="loading" class="mt-6 space-y-2">
      <div v-for="n in 5" :key="n" class="animate-pulse flex gap-4">
        <div class="h-5 bg-gray-200 rounded w-1/4"></div>
        <div class="h-5 bg-gray-200 rounded w-1/6"></div>
        <div class="h-5 bg-gray-200 rounded w-1/2"></div>
        <div class="h-5 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
    <div v-else-if="error" class="text-sm text-red-600 mt-4">{{ error }}</div>

    
    <table
      class="w-full my-4 border border-gray-200 rounded-lg shadow-sm"
      style="border-collapse: separate; border-spacing: 0"
    >
      <thead>
        <tr class="bg-gray-100">
          <th class="!p-3 tracking-wide font-semibold text-sm text-left">
            Name
          </th>
          <th class="!p-3 tracking-wide font-semibold text-sm text-center">
              Price (₱)
          </th>
          <th class="!p-3 tracking-wide font-semibold text-sm text-center">
            Description
          </th>
          <th v-if="isFood" class="!p-3 tracking-wide font-semibold text-sm text-center">Category</th>
          <th class="!p-3 tracking-wide font-semibold text-sm text-center">
            Duration
          </th>
          <th class="!p-3 tracking-wide font-semibold text-sm text-center">
            
          </th>
          <th class="!p-3 tracking-wide font-semibold text-sm text-center">
            Available
          </th>
          <th class="!p-3 tracking-wide font-semibold text-sm text-center">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
  <tr v-for="(item, index) in paginatedItems" :key="item.id || index">
          <td class="!p-3 text-sm font-light tracking-wide text-left">
            {{ item.name }}
          </td>
          <td class="!p-3 text-sm font-light tracking-wide text-center">
              {{ formatPeso(item.price) }}
          </td>
          <td class="!p-3 text-sm font-light tracking-wide text-center">
            {{ item.description }}
          </td>
          <td v-if="isFood" class="!p-3 text-sm font-light tracking-wide text-center">{{ item.category }}</td>
          <td class="!p-3 text-sm font-light tracking-wide text-center">
            <span v-if="item.duration">{{ item.duration }} mins</span>
          </td>
          <td class="!p-3 text-sm font-light tracking-wide text-center">
            
          </td>
          <td class="!p-3 text-sm font-light tracking-wide text-center">
            <div class="flex items-center justify-center gap-2">
              <ion-toggle :checked="item.is_available" @ionChange="toggleAvailability(item)"></ion-toggle>
              <p>{{ item.is_available ? "Yes" : "No" }}</p>
            </div>
          </td>
          <td class="!p-3 text-sm font-light tracking-wide text-center">
            <div class="flex gap-4 justify-center">
              <font-awesome-icon
                @click="editBtn(item)"
                :icon="['fas', 'pen-to-square']"
                class="text-green-500 cursor-pointer hover:opacity-75"
              />
              <font-awesome-icon
                @click="deleteBtn(item)"
                :icon="['fas', 'trash-can']"
                class="text-red-500 cursor-pointer hover:opacity-75"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    
    <AddItemModal
      v-if="showAddItem && isFood"
      :is-open="showAddItem"
      @add-item="addItem"
      @close="showAddItem = false"
    />
    <AddService
      v-if="showAddItem && !isFood"
      :is-open="showAddItem"
      @add-item="addItem"
      @close="showAddItem = false"
    />
    <EditItemModal
      v-if="showEditModal"
      :isOpen="showEditModal"
      :item="selectedItem"
      @update-item="updateItem"
      @close="showEditModal = false"
    />
    
    <div v-if="!loading && totalPages > 1" class="flex items-center justify-end gap-3 mt-4 text-sm">
      <button @click="prevPage" :disabled="page===1" class="px-2 py-1 border rounded disabled:opacity-40">Prev</button>
      <span>Page {{ page }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="page===totalPages" class="px-2 py-1 border rounded disabled:opacity-40">Next</button>
      <select v-model.number="pageSize" class="border rounded px-2 py-1">
        <option :value="5">5</option>
        <option :value="10">10</option>
        <option :value="20">20</option>
      </select>
    </div>

    <ion-toast
      :is-open="toast.open"
      :message="toast.message"
      :color="toast.color"
      :duration="toast.duration"
      @didDismiss="closeToast"
    />
  </div>
</template>

<script>
import {
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonButton,
  IonInput,
} from "@ionic/vue";
import AddItemModal from "../components/AddItemModal.vue";
import AddService from "../components/AddService.vue";
import { computed, ref, watch } from "vue";
import EditItemModal from "../components/EditItemModal.vue";

import { useCatalog } from '@/composables/useCatalog';
import { formatPeso } from '@/utils/currency'
import { IonToast } from '@ionic/vue';

export default {
  name: "AppMenuManager",
  components: {
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonButton,
    IonInput,
  AddItemModal,
  AddService,
    EditItemModal,
    IonToast
  },
  // setup: catalog CRUD, category/filtering, pagination, and toasts
  setup() {
  const showAddItem = ref(false);
  const allCategories = ref("");
  const showEditModal = ref(false);
  const selectedItem = ref(null);
  const toast = ref({ open:false, message:'', color:'success', duration:2000 });
  const searchTerm = ref('');
  const page = ref(1);
  const pageSize = ref(10);

  // Handles businessCategory
  const businessCategory = (localStorage.getItem('businessCategory') || '').toLowerCase();
  const isFood = businessCategory === 'food';

  const catalog = useCatalog(isFood ? 'food' : 'service');
  const { items: menuItems, load: loadMenu, add: addCatalogItem, update: updateCatalogItem, remove: removeCatalogItem, toggleAvailability } = catalog;
  const loading = catalog.loading;
  const error = catalog.error;

    const categories = computed(() => {
      const cats = menuItems.value.map(i => i.category).filter(Boolean);
      return [...new Set(cats)];
    });

    const filteredItems = computed(() => {
      let arr = menuItems.value;
      if (isFood && allCategories.value) arr = arr.filter(i => i.category === allCategories.value);
      if (searchTerm.value.trim()){
        const q = searchTerm.value.toLowerCase();
        arr = arr.filter(i => (i.name||'').toLowerCase().includes(q) || (i.description||'').toLowerCase().includes(q));
      }
      return arr;
    });
    const totalPages = computed(()=> Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value)));
    watch([filteredItems, pageSize], ()=> {
      if(page.value > totalPages.value) page.value = totalPages.value;
      if(page.value < 1) page.value = 1;
    });
    const paginatedItems = computed(()=> {
      const start = (page.value - 1) * pageSize.value;
      return filteredItems.value.slice(start, start + pageSize.value);
    });

  // pagination next
    function nextPage(){ if(page.value < totalPages.value) page.value++; }

  // pagination prev
    function prevPage(){ if(page.value > 1) page.value--; }


    // initial load
    async function loadInitial(){
      try { await loadMenu(); } catch(e){ showToast(error.value || 'Failed to load menu','danger'); }
    }


    // add item/service with category guard for services
    async function addItem(newItem){
      try { await addCatalogItem({ ...newItem, category: isFood ? newItem.category : null }); showToast('Item added','success'); }
      catch(e){ console.error(e); showToast('Add failed','danger'); }
    }


  // open add modal
    function handleShowAddItem(){ showAddItem.value = true; }

  // open edit modal with selected item
    function editBtn(item){ selectedItem.value = { ...item }; showEditModal.value = true; }


    // persist updates for selected item
    async function updateItem(updated){
      if(!selectedItem.value?.id) return;
      try { await updateCatalogItem(selectedItem.value.id, updated); showToast('Item updated','success'); }
      catch(e){ console.error(e); showToast('Update failed','danger'); }
    }


    // delete item/service
    async function deleteBtn(item){
      if(!item?.id) return; if(!confirm('Delete this item?')) return;
      try { await removeCatalogItem(item.id); showToast('Item deleted','medium'); }
      catch(e){ console.error(e); showToast('Delete failed','danger'); }
    }


    // toggle availability with feedback
    async function toggleAvailabilityWrapper(item){
      try { await toggleAvailability(item); showToast(item.is_available ? 'Marked unavailable' : 'Marked available','tertiary'); }
      catch(e){ console.error(e); showToast('Toggle failed','danger'); }
    }



  // toast helpers
  function showToast(message, color='success'){ toast.value = { open:true, message, color, duration:2000 }; }

  // close toast
  function closeToast(){ toast.value.open = false; }

  loadInitial();

    return { showAddItem, handleShowAddItem, menuItems, allCategories, categories, filteredItems, paginatedItems, totalPages, page, pageSize, nextPage, prevPage, searchTerm, showEditModal, selectedItem, editBtn, updateItem, deleteBtn, addItem, toggleAvailability: toggleAvailabilityWrapper, loading, error, toast, closeToast, isFood, formatPeso };
  },
};
</script>


