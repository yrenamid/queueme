<template>
    <div
      id="poppins"
      class="border border-gray-200 my-5 mx-3 p-3 rounded-lg text-[#283618] shadow-lg"
    >
      <p class="font-bold text-2xl">Service Management</p>
      <p class="font-light text-sm text-gray-400 my-2">
        Manage the services displayed to customers
      </p>
  
      
      <div class="flex flex-col md:flex-row gap-4 md:items-end justify-between mt-5">
        <div class="flex-1">
          <ion-input v-model="searchTerm" placeholder="Search name or description" clear-input class="border border-gray-300 rounded-sm" style="--padding-start:8px"></ion-input>
        </div>
        <div class="flex justify-end">
          <ion-button @click="handleShowAddService">+Add Service</ion-button>
        </div>
      </div>
  
      
      <table
        class="w-full my-4 border border-gray-200 rounded-lg shadow-sm"
        style="border-collapse: separate; border-spacing: 0;"
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
          <tr v-for="(item, index) in paginatedServices" :key="item.id || index">
            <td class="!p-3 text-sm font-light tracking-wide text-left">
              {{ item.name }}
            </td>
            <td class="!p-3 text-sm font-light tracking-wide text-center">
                {{ formatPeso(item.price) }}
            </td>
            <td class="!p-3 text-sm font-light tracking-wide text-center">
              {{ item.description }}
            </td>
            <td class="!p-3 text-sm font-light tracking-wide text-center">
              {{ item.duration }} mins
            </td>
            <td class="!p-3 text-sm font-light tracking-wide text-center">
              
            </td>
            <td class="!p-3 text-sm font-light tracking-wide text-center">
              <div class="flex items-center justify-center gap-2">
                <ion-toggle :checked="item.available" @ionChange="toggleAvailability(item)" />
                <p>{{ item.available ? 'Yes' : 'No' }}</p>
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

      <div v-if="loading" class="mt-6 space-y-2">
        <div v-for="n in 5" :key="n" class="animate-pulse flex gap-4">
          <div class="h-5 bg-gray-200 rounded w-1/4"></div>
          <div class="h-5 bg-gray-200 rounded w-1/6"></div>
          <div class="h-5 bg-gray-200 rounded w-1/2"></div>
          <div class="h-5 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
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
      <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>
  
      
      <AddService
        v-if="showAddService"
        :is-open="showAddService"
        @add-item="addService"
        @close="showAddService = false"
      />
      <EditServiceModal
        v-if="showEditModal"
        :isOpen="showEditModal"
        :item="selectedItem"
        @update-item="updateItem"
        @close="showEditModal = false"
      />
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
  import { IonToggle, IonButton, IonToast, IonInput } from '@ionic/vue'
  import AddService from './AddService.vue'
  import EditServiceModal from './EditServiceModal.vue'
  import { ref, computed, watch } from 'vue'
  import { useCatalog } from '@/composables/useCatalog'
  import { formatPeso } from '@/utils/currency'
  
  export default {
    name: 'ServiceListManager',
  components: { IonToggle, IonButton, AddService, EditServiceModal, IonToast, IonInput },

  props: {},
  // setup: service catalog CRUD, filtering, pagination, and toasts
    setup () {
  const showAddService = ref(false)
  const showEditModal = ref(false)
  const selectedItem = ref(null)
  const toast = ref({ open:false, message:'', color:'success', duration:2000 })
  const searchTerm = ref('')
  const page = ref(1)
  const pageSize = ref(10)

  const catalog = useCatalog('service')
  const { items: internalServices, load, add, update, remove, toggleAvailability, loading, error } = catalog


  // show a brief toast message
      function showToast(message, color='success'){ toast.value = { open:true, message, color, duration:2000 } }

  // close toast
      function closeToast(){ toast.value.open = false }

  // initial load of services
      async function loadServices(){
        try { await load() } catch(e){ showToast(error.value || 'Failed to load services','danger') }
      }


      // add new service
      async function addService(newItem){
        try { await add(newItem); showToast('Service added','success') }
        catch(e){ console.error(e); showToast('Add failed','danger') }
      }
  
      // open add service modal
      const handleShowAddService = () => {
        showAddService.value = true
      }
  
      // open edit modal with selected item
      const editBtn = (item) =>{ selectedItem.value = { ...item }; showEditModal.value = true }
  

      // persist updates for selected service
      const updateItem = async (updated) => {
        if(!selectedItem.value?.id) return
        try { await update(selectedItem.value.id, updated); showToast('Service updated','success') }
        catch(e){ console.error(e); showToast('Update failed','danger') }
      }
  

      // delete a service
      const deleteBtn = async (indexOrItem) => {
        const item = typeof indexOrItem === 'number' ? internalServices.value[indexOrItem] : indexOrItem
        if(!item?.id) return
        if(!confirm('Delete this service?')) return
        try { await remove(item.id); showToast('Service deleted','medium') }
        catch(e){ console.error(e); showToast('Delete failed','danger') }
      }


  // toggle availability with feedback
      async function toggleAvailabilityWrapper(item){
        try { await toggleAvailability(item); showToast(item.available ? 'Marked unavailable':'Marked available','tertiary') }
        catch(e){ console.error(e); showToast('Toggle failed','danger') }
      }

      const filteredServices = computed(()=> {
        let arr = internalServices.value;
        if(searchTerm.value.trim()){
          const q = searchTerm.value.toLowerCase();
          arr = arr.filter(i => (i.name||'').toLowerCase().includes(q) || (i.description||'').toLowerCase().includes(q));
        }
        return arr;
      });
      const totalPages = computed(()=> Math.max(1, Math.ceil(filteredServices.value.length / pageSize.value)));
      watch([filteredServices, pageSize], ()=> { if(page.value > totalPages.value) page.value = totalPages.value; if(page.value < 1) page.value = 1; });
      const paginatedServices = computed(()=> {
        const start = (page.value - 1) * pageSize.value;
        return filteredServices.value.slice(start, start + pageSize.value);
      });

      watch(searchTerm, () => { page.value = 1; });

// Handles next Page
      function nextPage(){ if(page.value < totalPages.value) page.value++; }

// Handles prev Page
      function prevPage(){ if(page.value > 1) page.value--; }

      loadServices()

  
      return { showEditModal, showAddService, addService, handleShowAddService, editBtn, deleteBtn, updateItem, services: internalServices, paginatedServices, filteredServices, totalPages, page, pageSize, nextPage, prevPage, searchTerm, selectedItem, loading, error, toast, closeToast, toggleAvailability: toggleAvailabilityWrapper, formatPeso }
    }
  }
  </script>
  