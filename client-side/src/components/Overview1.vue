<template>
  <div id="poppins" class="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5 mb-5 text-[#283618]">
    <div class="border rounded-lg p-3 bg-[#FEFAE0] border-[#4B5D0E29] shadow-md">
      <div class="flex justify-between items-center mb-2">
        <p class="font-medium">Total Customers</p>
        <font-awesome-icon :icon="['fas', 'users']" class="text-2xl opacity-75"/>
      </div>
      <p class="mb-2 text-2xl font-bold">{{ metrics?.totalCustomers ?? '-' }}</p>
      
    </div>
    <div class="border rounded-lg p-3 bg-[#FEFAE0] border-[#4B5D0E29] shadow-md">
      <div class="flex justify-between items-center mb-2">
        <p class="font-medium">Average Wait Time</p>
        <font-awesome-icon :icon="['fas', 'clock']" class="text-2xl opacity-75"/>
      </div>
  <p  class="mb-2 text-2xl font-bold">{{ metrics?.avgWait != null ? minutesToHMS(metrics.avgWait) : '-' }}</p>
      
    </div>
    <div class="border rounded-lg p-3 bg-[#FEFAE0] border-[#4B5D0E29] shadow-md">
      <div class="flex justify-between items-center mb-2">
        <p class="font-medium">Completed Today</p>
        <font-awesome-icon :icon="['fas', 'dollar-sign']" class="text-2xl opacity-75"/>
      </div>
      <p  class="mb-2 text-2xl font-bold">{{ metrics?.completedToday ?? '-' }}</p>
      
    </div>
    <div class="border rounded-lg p-3 bg-[#FEFAE0] border-[#4B5D0E29] shadow-md">
      <div class="flex justify-between items-center mb-2">
        <p class="font-medium">Cancelled Today</p>
        <font-awesome-icon :icon="['fas', 'circle-xmark']" class="text-2xl opacity-75"/>
      </div>
      <p  class="mb-2 text-2xl font-bold">{{ metrics?.cancelledToday ?? '-' }}</p>
      
    </div>
  </div>
</template>

<script>
import { minutesToHMS } from '@/utils/time';
export default {
  name: 'OverviewOne',
  props: {
    metrics: { type: Object, required: false }
  },
  methods: {
    minutesToHMS
  }
};
</script>

<style></style>
