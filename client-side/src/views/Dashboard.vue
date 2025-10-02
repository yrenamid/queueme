<template>
  <!-- Single root so IonRouterOutlet can attach registerIonPage to the underlying ion-page -->
  <component :is="currentView" />
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FoodBasedAdmin from './FoodBasedAdmin.vue';
import ServiceBasedAdmin from './ServiceBasedAdmin.vue';
import { fetchPublicBusinessById } from '@/services/api';

export default {
	name: 'DashboardView',
	setup() {
		const route = useRoute();
		const router = useRouter();

		const slugParam = computed(() => String(route.params.slug || ''));
		const category = ref(localStorage.getItem('businessCategory') || '');

		// Ensure slug in URL is stored for later navigations
		const ensureSlug = () => {
			const existing = localStorage.getItem('businessSlug') || '';
			if (!existing && slugParam.value) {
				localStorage.setItem('businessSlug', slugParam.value);
			}
		};

		const resolveCategory = async () => {
			if (category.value) return;
			const idStr = localStorage.getItem('businessId');
			const id = idStr ? Number(idStr) : NaN;
			if (!isNaN(id)) {
				try {
					const info = await fetchPublicBusinessById(id);
					if (info?.category) {
						category.value = info.category;
						localStorage.setItem('businessCategory', info.category);
						if (info.slug && !localStorage.getItem('businessSlug')) {
							localStorage.setItem('businessSlug', info.slug);
							// keep URL slug authoritative; optionally normalize if mismatch
							if (slugParam.value && info.slug !== slugParam.value) {
								router.replace(`/dashboard/${info.slug}`);
							}
						}
					}
				} catch (e) {
					// If we fail to resolve, keep page usable (user is still authenticated)
					console.warn('[dashboard] failed to resolve category by businessId', e);
				}
			}
		};

		onMounted(async () => {
			ensureSlug();
			await resolveCategory();
		});

		const currentView = computed(() => {
			const cat = (category.value || '').toLowerCase();
			if (cat === 'service') return ServiceBasedAdmin;
			if (cat === 'food') return FoodBasedAdmin;
			// Default fallback: show Food dashboard if unknown
			return FoodBasedAdmin;
		});

		return { currentView };
	},
};
</script>

<style scoped>
/* No wrapper styling; nested views control layout */
</style>
