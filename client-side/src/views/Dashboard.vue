<template>
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
							if (slugParam.value && info.slug !== slugParam.value) {
								router.replace(`/dashboard/${info.slug}`);
							}
						}
					}
				} catch (e) {
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
			return FoodBasedAdmin;
		});

		return { currentView };
	},
};
</script>

<style scoped>
</style>
