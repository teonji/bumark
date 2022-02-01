<script setup>
import QrcodeVue from 'qrcode.vue'
import customSelect from '../components/custom-select.vue'
import {ref, defineProps, defineEmits} from 'vue'
const props = defineProps({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  tags: {
    type: Array,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  settings: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    default: () => []
  },
  provider: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  image: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  category: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  canEdit: {
    type: Boolean,
    default: false
  },
})
const emit = defineEmits(['open', 'tag', 'remove', 'change'])
const copied = ref(false)
const openNotes = ref(false)
const openQrCode = ref(false)
const open = () => props.canEdit ? emit('open', props.url) : null
const remove = () => emit('remove', props.id)
const toggleTag = tag => emit('tag', tag)
const change = (id, name, value) => emit('change', { id, name, value })
const changeCategory = category => change(props.id, 'category', category)
const copy = () => {
  navigator.clipboard.writeText(props.url)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div class="relative bg-gray-900 block overflow-hidden border border-gray-100 rounded-lg">
    <span v-if="!openNotes" class="absolute bottom-[10px] right-[10px]">
      <button @click="openQrCode = !openQrCode" type="button" class="bg-white opacity-70 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100">
        <i class="fas fa-qrcode"></i>
      </button>
    </span>
    <span v-if="notes && !openQrCode" class="absolute bottom-[40px] right-[10px]">
      <button @click="openNotes = !openNotes" type="button" class="bg-white opacity-70 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100">
        <i class="fas fa-sticky-note"></i>
      </button>
    </span>
    <span v-if="canEdit && !openQrCode && !openNotes" class="absolute top-[10px] right-[10px]">
      <button @click="remove" type="button" class="bg-white opacity-70 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100">
        <i class="fas fa-times-circle"></i>
      </button>
    </span>
    <span v-if="!openQrCode && !openNotes" class="absolute top-[10px] left-[10px]">
          <button @click="copy" type="button" class="rounded-md p-2 inline-flex items-center justify-center"
                  :class="[copied ? 'bg-green-500 text-white hover:text-white hover:bg-green-500' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100 bg-white opacity-70']">
            <i class="fas fa-copy"></i>
            <span v-if="copied" class="ml-2">Copied</span>
          </button>
        </span>

    <div v-if="!openNotes && !openQrCode" @click="open" class="bg-gray-200" :class="{ 'cursor-pointer': canEdit, 'hidden sm:block': !image }">
      <img v-if="image" :src="image" class="max-h-[200px] w-full object-cover" />
      <img v-else src="/logo.png" class="max-h-[200px] w-full object-cover" />
    </div>
    <div v-if="!openNotes && !openQrCode" class="p-8">
      <div class="justify-between flex">
        <div>
          <h5 @click="open" class="text-xl font-bold text-gray-100 pb-4" :class="{ 'cursor-pointer': canEdit }">
            {{ title }}
          </h5>
        </div>

        <div v-if="icon" @click="open" class="flex-shrink-0 ml-3" :class="{ 'cursor-pointer': canEdit }">
          <img :src="icon" class="object-cover w-16 h-16 bg-gray-200 rounded-lg shadow-sm"/>
        </div>
      </div>
      <div class="flex justify-between items-center">
        <custom-select
            v-if="canEdit"
            :list="categories"
            :value="category"
            @change="changeCategory"
        />
        <div class="ml-2">
          <button v-for="(t, i) in tags"
                  :key="i"
                  @click="toggleTag(t)"
                  class="bg-blue-600 px-2 py-1 mr-2 mb-2 text-sm shadow-sm font-medium tracking-wider text-blue-100 rounded-full hover:shadow-2xl hover:bg-blue-700">
            {{ t }}
          </button>
        </div>
      </div>

      <div v-if="description" @click="open" class="mt-4 sm:pr-8" :class="{ 'cursor-pointer': canEdit }">
        <p class="text-sm text-gray-200">
          {{ description }}
        </p>
      </div>

      <dl class="flex mt-6 justify-between">

      </dl>
    </div>
    <div v-if="openNotes" class="flex items-center justify-between m-4 overflow-auto text-white">
      <div class="flex items-center">
        {{ notes }}
      </div>
    </div>
    <div v-if="openQrCode">
      <qrcode-vue class="m-auto mt-[60px]" :value="url" :size="360" level="H" />
    </div>
  </div>
</template>
