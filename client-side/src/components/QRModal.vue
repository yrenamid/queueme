<template>
  <ion-modal class="custom-modal" :is-open="isOpen" :backdrop-dismiss="false">
    <div id="poppins" class="p-3 bg-[#283618] rounded-lg">
      <p class="font-bold text-2xl text-white">Your QRCode</p>
      <p class="mb-4 text-gray-300 text-xs">
        Display this QR code for customers to scan and join the queue
      </p>
      <div class="flex justify-center items-center">
        <img
          v-if="qrImage"
          :src="qrImage"
          alt="Business QR"
          class="img-qr w-64 h-64"
        />
        <QrCodeVue3
          v-else
          :value="qrUrl"
          :width="250"
          :height="250"
          imgclass="img-qr"
        />
      </div>
      <p class="text-center my-2 font-semibold text-white">Scan to join the queue</p>
      <p class="text-center text-gray-300 text-xs mb-4">
        Customers will be directed to your page after scanning
      </p>
      <div class="flex justify-end gap-3">
        <ion-button
          fill="clear"
          @click="close"
          class="border border-[#DDA15E] text-white normal-case rounded-lg font-bold"
        >
          Close
        </ion-button>
        <ion-button
          v-if="canRegenerate"
          @click="onRegenerate"
          fill="clear"
          :disabled="loading"
          class="bg-[#3B7C3A] text-white normal-case rounded-lg font-bold"
        >
          {{ loading ? 'Regenerating…' : 'Regenerate QR' }}
        </ion-button>
        <ion-button
          @click="downloadQRCode"
          fill="clear"
          class="bg-[#DDA15E] text-white normal-case rounded-lg font-bold"
        >
          Download QR
        </ion-button>
      </div>
    </div>
  </ion-modal>
</template>

<script>

// Modal that displays the business QR code with regeneration (owner/manager) and download.
import { IonModal, IonButton } from "@ionic/vue";
import { ref, computed, nextTick } from 'vue';
import QrCodeVue3 from 'qrcode-vue3';
import { regenerateQR } from '@/services/api';

export default {
  name: "QrModal",
  components: {
    IonModal,
    IonButton,
    QrCodeVue3
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    }
  },
  emits: ["close"],

  setup(props, { emit }) {
  const qrImage = ref(localStorage.getItem('qrImage') || '');
  const qrUrl = ref(localStorage.getItem('qrUrl') || '');
  const role = ref((localStorage.getItem('role') || '').toLowerCase());
  const canRegenerate = computed(() => ['owner','manager'].includes(role.value));
    const loading = ref(false);


    const downloadQRCode = async () =>{
      await nextTick()

      const img = document.querySelector('.img-qr')
      if(!img || !img.src){
        console.log('QR image not found.')
        return
      }

      try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        const donwnloadLink = document.createElement('a');
        donwnloadLink.href = URL.createObjectURL(blob);
        donwnloadLink.download = 'qrcode.png';
        donwnloadLink.click();
      } catch (error) {
        console.log(error)
      }
    }


    const onRegenerate = async () => {
      try {
        loading.value = true;
  const qr = await regenerateQR();
        try { localStorage.setItem('qrImage', qr.image); } catch (e) { console.debug('localStorage set qrImage failed', e); }
        try { localStorage.setItem('qrUrl', qr.url); } catch (e) { console.debug('localStorage set qrUrl failed', e); }
        qrImage.value = qr.image;
        qrUrl.value = qr.url;
      } catch (e) {
        console.error('[QRModal] regenerate failed', e);
        alert(String(e?.message || e || 'Failed to regenerate QR'));
      } finally {
        loading.value = false;
      }
    }


    const close = () => {
      emit("close");
    };

    return {
      qrUrl,
      qrImage,
      canRegenerate,
      loading,
      close,
      downloadQRCode,
      onRegenerate
    };
  }

};
</script>

<style>
</style>
