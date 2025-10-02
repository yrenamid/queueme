import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import { IonicVue } from '@ionic/vue';


import '@ionic/vue/css/core.css';


import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';


import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';


import '@ionic/vue/css/palettes/dark.system.css';
import 'sweetalert2/dist/sweetalert2.min.css'


import './theme/global.css'
import './theme/variables.css';
import './tailwindcss.css';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faQrcode, faClock, faUsers, faChartSimple, faCreditCard, faUser, faPauseCircle, faGear, faBell, faPenToSquare, faTrashCan, faCalendar, faXmark, faPlayCircle, faArrowRightFromBracket, faCircleCheck, faEye, faCheck, faRotateRight, faCircleXmark, faDollarSign, faStar, faMaximize, faArrowRight, faCircleDot} from '@fortawesome/free-solid-svg-icons'
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons' // REGULAR STAR
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'


library.add(
  faQrcode as any,
  faClock as any,
  faUsers as any,
  faChartSimple as any,
  faCreditCard as any,
  faUser as any,
  faPauseCircle as any,
  faGear as any,
  faBell as any,
  faPenToSquare as any,
  faTrashCan as any,
  faCalendar as any,
  faXmark as any,
  faPlayCircle as any,
  faArrowRightFromBracket as any,
  faCircleCheck as any,
  faEye as any,
  faCheck as any,
  faRotateRight as any,
  faCircleXmark as any,
  faDollarSign as any,
  faStar as any,
  farStar as any,
  faMaximize as any,
  faArrowRight as any
  ,faCircleDot as any
)

const app = createApp(App)
  .use(IonicVue)
  .use(router)
  .component('font-awesome-icon', FontAwesomeIcon)

router.isReady().then(() => {
  app.mount('#app');
});
