import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import i18n from './i18n'
import '@mdi/font/css/materialdesignicons.css'

const app = createApp(App)

app.use(vuetify)
app.use(i18n)

app.mount('#app')
