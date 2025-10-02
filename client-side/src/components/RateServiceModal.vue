<template>
  <ion-modal class="custom-modal" :is-open="isOpen" :backdrop-dismiss="false">
    <div id="poppins" class="py-5 px-3 text-[#283618] mx-3 md:mx-none bg-[#FEFAE0] rounded-lg">
      <div class="flex justify-end">
        <font-awesome-icon
          :icon="['fas', 'xmark']"
          @click="closeModal"
          class="text-xl cursor-pointer"
        />
      </div>
      <div class="flex flex-col items-center gap-4">
        <p class="text-2xl text-[#283618] text-2xl font-bold">
          Rate Your Experience
        </p>
        <p class="text-sm font-normal">
          We highly value your feedback! Kind take a moment to rate your
          experience and provide us with your valuable feedback.
        </p>

        
        <div class="flex gap-2 text-3xl">
          <font-awesome-icon
            v-for="star in 5"
            :key="star"
            :icon="[rating >= star ? 'fas' : 'far', 'star']"
            class="cursor-pointer text-[#DDA15E]"
            @click="setRating(star)"
          />
        </div>

        
        <ion-textarea
          v-model="feedback"
          placeholder="Leave a comment..."
          class="w-full border border-[#DDA15E] rounded-lg p-2 mt-3"
          style="--highlight-color: none"
          :maxlength="40"
        ></ion-textarea>
        <div class="w-full text-right text-xs text-[#283618] mt-1">
          {{ (feedback || '').length }}/40
        </div>

        
        <ion-button
          expand="block"
          class="mt-4 bg-[#283618] text-white font-bold rounded-lg"
          :disabled="isSubmitting"
          @click="submitRating"
        >
          {{ isSubmitting ? 'Submitting…' : 'Submit' }}
        </ion-button>
      </div>
    </div>
  </ion-modal>
</template>

<script>
// Modal to collect a 1–5 star rating and optional comment; resolves business/queue IDs and posts feedback.
import { IonButton, IonModal, IonTextarea } from "@ionic/vue";
import { ref, computed } from "vue";
import { useRoute } from 'vue-router';
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { submitFeedback, fetchPublicMyStatus } from '@/services/api';
import { useToast } from '@/composables/useToast';

export default {
  name: "RateServiceModal",
  components: {
    IonButton,
    IonModal,
    IonTextarea,
    FontAwesomeIcon,
  },
  props: {
    isOpen: Boolean,
    customer: {
      type: Object,
      required: true,
    },

    businessId: { type: [Number, String], default: null },
    queueId: { type: [Number, String], default: null },
    queueNumber: { type: [Number, String], default: null },
  },
  emits: ["close"],

// Initializes component state and handlers
  setup(props, { emit }) {
    const route = useRoute();
    const rating = ref(0);
    const feedback = ref("");
    const isSubmitting = ref(false);
    const { toast } = useToast();

    const queueId = computed(() => {
      const fromProp = props.queueId != null ? Number(props.queueId) : null;
      if (fromProp && !Number.isNaN(fromProp)) return fromProp;
      const fromCustomer = Number(props.customer?.id || props.customer?.queue_id);
      return (!Number.isNaN(fromCustomer) && fromCustomer > 0) ? fromCustomer : null;
    });
    const businessId = computed(() => {
      const fromProp = props.businessId != null ? Number(props.businessId) : null;
      if (fromProp && !Number.isNaN(fromProp)) return fromProp;
      const fromCustomer = Number(props.customer?.business_id || props.customer?.businessId || props.customer?.business);
      if (!Number.isNaN(fromCustomer) && fromCustomer > 0) return fromCustomer;
  const fromRoute = Number(route && route.params && route.params.business_id ? route.params.business_id : null);
      return (!Number.isNaN(fromRoute) && fromRoute > 0) ? fromRoute : null;
    });


// Handles close Modal
    const closeModal = () => {
      emit("close");
    };

// Handles set Rating
    const setRating = (value) => {
      rating.value = value;
    };

    // Handles submitRating
    const submitRating = async () => {
      try {
        if (isSubmitting.value) return;
        const biz = Number(businessId.value);
        let qid = queueId.value != null ? Number(queueId.value) : null;

        if ((!qid || Number.isNaN(qid)) && biz && (props.customer?.queueNo != null || props.customer?.queue_number != null)) {
          try {
            const queue_number = Number(props.customer?.queueNo ?? props.customer?.queue_number);
            if (!Number.isNaN(queue_number)) {
              const mine = await fetchPublicMyStatus({ business_id: biz, queue_number });
              if (mine?.id) qid = Number(mine.id);
            }
          } catch (err) { console.debug('[rate-modal] optional element missing', err); }
        }
        if (!biz || !qid) { toast('Missing context to submit feedback', 'error'); return; }
        const r = Number(rating.value);
        if (!Number.isInteger(r) || r < 1 || r > 5) {
          toast('Please select a rating from 1 to 5', 'error');
          return;
        }
        isSubmitting.value = true;
        const payload = { business_id: biz, queue_id: qid, rating: r, comment: feedback.value?.trim() || null };
        await submitFeedback(payload);
        try {

          window.dispatchEvent(new CustomEvent('feedback:submitted', { detail: { business_id: biz } }));
  } catch(err) { console.debug('[rate-modal] failed in submit flow', err); }
        toast('Thanks for your feedback!');
        rating.value = 0; feedback.value = '';
        closeModal();
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to submit feedback';
        toast(msg, 'error');
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      rating,
      feedback,
      closeModal,
      setRating,
      submitRating,
      isSubmitting,
    };
  },
};
</script>
<style scoped>
.custom-modal::part(content) {
  max-width: 450px;
  width: 900%;
  max-height: 80vh;
  height: auto;
  margin: auto;
  overflow-y: auto;
  box-sizing: border-box;
  background: #FEFAE0; /* Cream background per request */
}
</style>
