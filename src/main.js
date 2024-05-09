import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueCookies from 'vue-cookies'

const app = createApp(App);
app.config.globalProperties.$baseURL = "192.168.124.4:8086";
app.config.globalProperties.$ismobile = Boolean(
    navigator.userAgent.match(
        /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
    )
);
app.use(router).use(VueCookies).mount('#app')
