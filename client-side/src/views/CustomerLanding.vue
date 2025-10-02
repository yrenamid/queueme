<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="text-center text-[#283618]">
        <p class="text-lg font-semibold">Loading business…</p>
        <p v-if="error" class="text-red-600 mt-2">{{ error }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const router = useRouter()
const error = ref('')

onMounted(async () => {
  const slug = String(route.params.slug || '')
  if (!slug) { error.value = 'Invalid link'; return }
  try {
    const { data } = await api.get(`/public/businesses/${slug}`)
    if (!data?.success || !data?.data) throw new Error('Not found')
    const { business_id, category } = data.data
  try { localStorage.setItem('lastBusinessSlug', slug) } catch(err) { console.debug('[customer-landing] could not persist lastBusinessSlug', err); }
    if (String(category) === 'service') {
      router.replace({ name: 'CustomerServiceBased', params: { business_id } })
    } else {
      router.replace({ name: 'CustomerFoodBased', params: { business_id } })
    }
  } catch (e: any) {
    error.value = e?.message || 'Unable to load business'
  }
})
</script>

<style scoped>
</style>
