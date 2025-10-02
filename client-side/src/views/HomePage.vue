<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar class="bg-[#3E4A2F]">
        <div id="header" class="flex items-center justify-between mx-3">
          <div class="logo flex items-center">
            <img
              class="h-10 w-10 me-2"
              src="../images/favicon.png"
              alt="logo"
            />
            <p class="name">Queue<span>Me</span></p>
          </div>
          <div class="button flex">
            <ion-button
              @click="goToRegister"
              id="btn1"
              fill="clear"
              class="border border-[#DDA15E] me-2 rounded-sm normal-case font-light"
              style="--color: white"
            >
              Register Business
            </ion-button>
            <ion-button
              @click="goToLogin"
              id="btn2"
              fill="clear"
              class="rounded-sm normal-case bg-[#DDA15E] rounded-sm font-light"
              style="--color: white"
            >
              Login
            </ion-button>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="bg-[#283618]">
      <section
        id="first"
        class="flex justify-center items-center h-full flex-col md:flex-row gap-4 mt-1"
      >
        <div class="div1 mb-0 mt-10 mx-5 md:m-5">
          <p
            id="poppins"
            class="text-4xl md:text-8xl leading-[1.3] font-light text-10xl text-white"
          >
            Say Goodbye <br />
            to <span class="text">Long Waits!</span>
          </p>
          <p id="desc" class="text-[#FFFFFFB5] my-3 font-extralight">
            QueueMe helps businesses manage customer queues efficiently, reduce
            wait times, and improve customer satisfaction.
          </p>
          <ion-button
            @click="goToRegister"
            id="btn2"
            fill="clear"
            class="me-2 normal-case mb-5 bg-[#DDA15E] rounded-sm text-white"
            >Get Started</ion-button
          >
          <ion-button
            id="btn1"
            fill="clear"
            class="border border-[#DDA15E] rounded-sm normal-case mb-5 text-white"
            @click="scrollToFeatures"
          >
            Learn More
          </ion-button>
        </div>
        <div
          id="poppins"
          class="div2 p-4 text-white rounded-lg mx-5 mt-0 md:m-5"
        >
          <div class="text-center text-3xl mb-1 font-bold">How It Works</div>
          <p class="mb-5 text-center text-sm font-extralight">
            Simple 3-Steps process to transform your business
          </p>
          <ol class="list-decimal list-inside">
            <li class="text-lg font-semibold">Register Your Business</li>
            <p class="text-sm mb-5 font-light">
              Sign-up or configure your services or menu items
            </p>
            <li class="text-lg font-semibold">Display Your Code</li>
            <p class="text-sm mb-5 font-light">
              Customers scan to join your virtual queue
            </p>
            <li class="text-lg font-semibold">Manage Your Queue</li>
            <p class="text-sm mb-5 font-light">
              Process customers efficiently with our admin dashboard
            </p>
          </ol>
        </div>
      </section>

      <section id="features" class="mt-5">
        <p class="text-white text-center text-3xl md:text-5xl mb-4 font-bold">
          Key Features
        </p>
        <p class="text-white text-center my-7 font-light">
          Everything you need to manage your business queues efficiently
        </p>
        <div
          class="mx-4 max-w-screen-xl grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 text-center text-white"
        >
          <div class="p-4 border border-[#DDA15E] rounded-xl bg-[#606C3333]">
            <font-awesome-icon
              :icon="['fas', 'qrcode']"
              class="text-3xl mb-2"
            />
            <p class="md:text-2xl font-semibold my-4">QR Code System</p>
            <p class="md:text-sm font-extralight mt-5">
              Set queue settings, manage wait times, and provide customers with
              accurate wait time estimates.
            </p>
          </div>
          <div class="p-4 border border-[#DDA15E] rounded-xl bg-[#606C3333]">
            <font-awesome-icon :icon="['fas', 'clock']" class="text-3xl mb-2" />
            <p class="md:text-2xl font-semibold my-4">Real-Time Updates</p>
            <p class="md:text-sm font-extralight mt-5">
              Track average wait times, peak hours, and customer flow to
              optimize your business operations.
            </p>
          </div>
          <div class="p-4 border border-[#DDA15E] rounded-xl bg-[#606C3333]">
            <font-awesome-icon :icon="['fas', 'users']" class="text-3xl mb-2" />
            <p class="md:text-2xl font-semibold my-4">Customer Management</p>
            <p class="md:text-sm font-extralight mt-5">
              Set queue settings, manage wait times, and provide customers with
              accurate wait time estimates.
            </p>
          </div>
        </div>
        <div
          class="flex flex-col md:flex-row gap-4 text-white text-center mx-4 md:mt-4"
        >
          <div class="md:w-50 flex-none"></div>
          <div
            class="p-4 border border-[#DDA15E] rounded-xl bg-[#606C3333] w-full md:w-100"
          >
            <font-awesome-icon
              :icon="['fas', 'chart-simple']"
              class="text-3xl mb-2"
            />
            <p class="md:text-2xl font-semibold my-4">Analytics</p>
            <p class="md:text-sm font-extralight mt-5">
              Track average wait times, peak hours, and customer flow to
              optimize your business operations.
            </p>
          </div>
          <div
            class="p-4 border border-[#DDA15E] rounded-xl bg-[#606C3333] w-full md:w-100"
          >
            <font-awesome-icon
              :icon="['fas', 'credit-card']"
              class="text-3xl mb-2"
            />
            <p class="md:text-2xl font-semibold my-4">Payment Integration</p>
            <p class="md:text-sm font-extralight mt-5">
              Get alerts when it's your turn. No more standing in long lines!
            </p>
          </div>
          <div class="md:w-50 flex-none"></div>
        </div>
      </section>

      <section
        class="flex justify-center items-center gap-4 bg-[#00000085] text-white p-5 mt-5"
      >
        <font-awesome-icon :icon="['fas', 'qrcode']" class="text-3xl mb-2" />
        <p>2025 QueueMe. All rights reserved.</p>
      </section>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonButton,
} from "@ionic/vue";
import { useRouter } from "vue-router";

const router = useRouter();


// Handles go To Register
const goToRegister = () => {
  router.push("/register");
};

// Handles go To Login
const goToLogin = () => {
  router.push("/login");
};


// Handles scroll To Features
const scrollToFeatures = () => {
  const featuresSection = document.getElementById("features");
  if (featuresSection) {
    featuresSection.scrollIntoView({ behavior: "smooth" });
  }
};
</script>
<style scoped>
ion-toolbar {
  --background: #3e4a2f !important;
}
ion-content {
  --background: #283618 !important;
}
.text {
  display: inline-block;
  vertical-align: middle;
  border-right: 5px solid;
  white-space: nowrap;
  overflow: hidden;
  animation: typing 4s, cursor 0.4s step-end infinite alternate;
}

@keyframes cursor {
  50% {
    border-color: transparent;
  }
}

@keyframes typing {
  from {
    width: 0ch;
  }
  to {
    width: 9.3ch;
  }
}

#desc {
  font-family: "Poppins", sans-serif;
}
.div1 span {
  color: #606c38;
  font-weight: 700;
}
#btn1:hover {
  background-color: #606c3846;
}
#btn2:hover {
  background-color: #f2be82ee;
}
.div2 {
  border: 1px solid #dda15e;
  background-color: #863f06;
}
#features {
  font-family: "Poppins", sans-serif;
}

</style>
