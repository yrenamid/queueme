import { ref } from 'vue';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, type MenuItemPayload, getServices, createService, updateService, deleteService, type ServicePayload } from '@/services/api';

export type CatalogMode = 'food' | 'service';

interface CatalogItem {
  id?: number;
  name: string;
  description?: string;
  price: number | string;
  category?: string | null;
  duration?: number | string | null;
  is_available?: boolean;
  available?: boolean; // for convenience in components
}


// Handles use Catalog
export function useCatalog(mode: CatalogMode){
  const items = ref<CatalogItem[]>([]);
  const loading = ref(false);
  const error = ref('');

  // Handles mapIn
  function mapIn(raw: any): CatalogItem {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      price: raw.price,
      category: mode === 'food' ? raw.category : null,
      duration: raw.duration,
      is_available: raw.is_available,
  available: raw.is_available
    };
  }


// Handles load
  async function load(){
    loading.value = true; error.value='';
    try {
      const data = mode === 'service' ? await getServices() : await getMenuItems();
      items.value = data.map(mapIn);
    } catch(e: any){ error.value = e.message || 'Failed to load'; }
    finally { loading.value = false; }
  }


  // Handles add
  async function add(payload: Partial<CatalogItem>){
    const toSend = {
      name: payload.name || '',
      description: payload.description,
      price: payload.price ?? 0,
      category: mode === 'food' ? (payload.category || null) : null,
      duration: payload.duration ?? null,
  available: payload.available ?? true
    } as any;
    const created = mode === 'service'
      ? await createService(toSend as ServicePayload)
      : await createMenuItem(toSend as MenuItemPayload);
    items.value.unshift(mapIn(created));
    return created;
  }


  // Handles update
  async function update(id: number, payload: Partial<CatalogItem>){
    const base = {
      name: payload.name,
      description: payload.description,
      price: payload.price,
      duration: payload.duration,
  available: payload.available
    } as any;
    if (mode === 'food') base.category = payload.category;
    const updated = mode === 'service'
      ? await updateService(id, base)
      : await updateMenuItem(id, base);
  const idx = items.value.findIndex((i: CatalogItem) => i.id === id);
    if (idx !== -1) items.value[idx] = mapIn(updated);
    return updated;
  }


  // Handles remove
  async function remove(id: number){
    if (mode === 'service') await deleteService(id); else await deleteMenuItem(id);
  items.value = items.value.filter((i: CatalogItem) => i.id !== id);
  }


// Handles toggle Availability
  async function toggleAvailability(item: CatalogItem){
    if(!item.id) return;
    const saved = mode === 'service'
      ? await updateService(item.id, { is_available: !item.is_available })
      : await updateMenuItem(item.id, { is_available: !item.is_available });
  const idx = items.value.findIndex((i: CatalogItem) => i.id === item.id);
    if (idx !== -1) items.value[idx] = mapIn(saved);
  }

  return { mode, items, loading, error, load, add, update, remove, toggleAvailability };
}
