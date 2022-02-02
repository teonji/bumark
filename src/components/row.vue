<script>
import item from './item.js'
export default {
  ...item,
}
</script>

<template>
  <div class="max-w-3xl w-full mx-auto z-10">
    <div class="flex flex-col">
      <div class="relative bg-white border border-white shadow-lg rounded-3xl p-4">
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
        <div v-if="!openNotes && !openQrCode" class="flex">
          <div class="mb-0">
            <div @click="open" class="h-[120px] w-[120px]" :class="{ 'cursor-pointer': canEdit }">
              <img :src="icon || image || '/logo.png'" class="h-[120px] w-[120px] bg-gray-200 object-cover rounded-2xl">
            </div>
            <div class="my-2 lg:mt-4">
              <custom-select
                  v-if="canEdit"
                  :list="categories"
                  :value="category"
                  @change="changeCategory"
              />
            </div>
          </div>
          <div class="flex-auto ml-5">
            <div @click="open" v-if="title || description" class="flex items-center justify-between mt-2 mb-2" :class="{ 'cursor-pointer': canEdit }">
              <div class="flex items-center">
                <div class="flex flex-col w-[180px] sm:w-[450px] 2xl:w-[300px]">
                  <div v-if="title" class="w-full flex-none text-lg text-gray-800 font-bold leading-none sm:h-[55px] overflow-ellipsis overflow-hidden">{{ title }}</div>
                  <div class="flex-auto text-gray-500 my-1 sm:h-[110px] overflow-ellipsis overflow-hidden">
                    <span class="mr-3">{{ description || '(No description)' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="openNotes" class="sm:h-[225px] overflow-auto">
          <div class="flex items-center justify-between mt-2 mb-2">
            <div class="flex items-center">
              {{ notes }}
            </div>
          </div>
        </div>
        <div v-if="openQrCode" class="sm:h-[225px]">
          <qrcode-vue class="m-auto" :value="url" :size="220" level="H" />
        </div>
        <div v-if="!openNotes && !openQrCode">
          <button v-for="(t, i) in tags"
                  :key="i"
                  @click="toggleTag(t)"
                  class="bg-blue-600 px-2 py-1 mr-2 mb-2 text-sm shadow-sm font-medium tracking-wider text-blue-100 rounded-full hover:shadow-2xl hover:bg-blue-700">
            {{ t }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
