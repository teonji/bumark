<script setup>
// import dayjs from 'dayjs'
import {ref, defineProps, defineEmits, /*computed*/} from 'vue'
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
  canEdit: {
    type: Boolean,
    default: false
  },
})
// const dateFormatted = computed(() => dayjs(props.date).format(props.settings.dateFormat))
const emit = defineEmits(['open', 'remove'])
const copied = ref(false)
const open = () => props.canEdit ? emit('open', props.url) : null
const remove = () => emit('remove', props.id)
const toggleTag = tag => emit('tag', tag)
const copy = () => {
  navigator.clipboard.writeText(props.url)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div class="max-w-3xl w-full mx-auto z-10">
    <div class="flex flex-col">
      <div class="bg-white border border-white shadow-lg rounded-3xl p-4 mb-4">
        <div class="relative">
          <span v-if="canEdit" class="absolute top-0 right-0">
            <button @click="remove" type="button" class="bg-white opacity-70 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <i class="fas fa-times-circle"></i>
            </button>
          </span>
          <span class="absolute top-0 left-0">
            <button @click="copy" type="button" class="rounded-md p-2 inline-flex items-center justify-center"
                    :class="[copied ? 'bg-green-500 text-white hover:text-white hover:bg-green-500' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100 bg-white opacity-70']">
              <i class="fas fa-copy"></i>
              <span v-if="copied" class="ml-2">Copied</span>
            </button>
          </span>
        </div>
        <div class="flex">
          <div class="h-32 w-32 mb-0">
            <div @click="open" :class="{ 'cursor-pointer': canEdit }">
              <img :src="image || icon" :alt="title" class="w-32 h-32 object-cover rounded-2xl">
            </div>
          </div>
          <div class="flex-auto ml-5 flex-grow">
            <div @click="open" v-if="title || description" class="flex items-center justify-between mt-2 mb-2" :class="{ 'cursor-pointer': canEdit }">
              <div class="flex items-center">
                <div class="flex flex-col">
                  <div v-if="title" class="w-full flex-none text-lg text-gray-800 font-bold leading-none">{{ title }}</div>
                  <div v-if="description" class="flex-auto text-gray-500 my-1">
                    <span class="mr-3">{{ description }}</span>
                  </div>
                </div>
              </div>
            </div>
            <button v-for="(t, i) in tags"
                    :key="i"
                    @click="toggleTag(t)"
                    class="bg-blue-600 px-2 py-1 mr-2 mb-2 text-sm shadow-sm font-medium tracking-wider text-blue-100 rounded-full hover:shadow-2xl hover:bg-blue-700">
              {{ t }}
            </button>
            <!--<div @click="open" class="flex text-sm text-gray-500" :class="{ 'cursor-pointer': canEdit }">
              <div class="flex-1 inline-flex items-center">
                <p>{{ dateFormatted }}</p>
              </div>
              <div class="flex-1 inline-flex items-center">
                <p class="">{{ provider }}</p>
              </div>
            </div>-->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
