<script>
import item from './item.js'
export default {
  ...item,
}
</script>

<template>
  <tr class="relative hover:bg-gray-100 border-b border-gray-200 py-4 2xl:h-[150px]">
    <div class="table-cell 2xl:hidden absolute top-0 left-0">
      {{ time }}
    </div>
    <div v-if="openQrCode" class="flex justify-center m-auto 2xl:hidden absolute top-0 left-0 w-[380px]">
      <qrcode-vue class="m-auto" :value="url" :size="90" level="H" />
    </div>
    <td class="hidden 2xl:table-cell ml-2 py-4 w-[50px] 2xl:pl-2">{{ time }}</td>
    <td class="hidden 2xl:table-cell px-4 py-4 w-[160px]">
      <template v-if="!openQrCode">
        <custom-select
            v-if="canEdit"
            :list="categories"
            :value="category"
            @change="changeCategory"
        />
      </template>
      <template v-else>
        <qrcode-vue class="m-auto" :value="url" :size="90" level="H" />
      </template>
    </td>
    <td class="py-4 2xl:px-4 pr-2 flex-1 items-center">
      <div class="flex items-center">
        <img :src="icon || '/logo.png'" class="2xl:mx-4 mr-4 bg-gray-200 w-[20px] h-[20px] 2xl:w-[50px] 2xl:h-[50px]">
        <div v-if="!openNotes">
          <div class="font-bold 2xl:text-xl font-display">{{ title }}</div>
          <div class="hidden 2xl:table-cell">{{ description }}</div>
        </div>
        <div v-else>
          <div class="font-bold 2xl:text-xl">Notes</div>
          <div class="hidden 2xl:table-cell">{{ notes }}</div>
        </div>
      </div>
      <div v-if="!openNotes" class="2xl:pl-4 2xl:pt-4 pt-2">
        <button v-for="(t, i) in tags"
                :key="i"
                @click="toggleTag(t)"
                class="bg-blue-600 px-2 py-1 mr-2 mb-2 text-sm shadow-sm font-medium tracking-wider text-blue-100 rounded-full hover:shadow-2xl hover:bg-blue-700">
          {{ t }}
        </button>
      </div>
    </td>
    <td class="px-2 py-2 2xl:px-4 2xl:py-4 2xl:w-[120px] w-[45px] m-auto">
      <div class="flex justify-end flex-col">
        <button @click="openQrCode = !openQrCode" type="button" class="bg-white opacity-70 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100">
          <i class="fas fa-qrcode"></i>
        </button>
        <button v-if="notes && canEdit" @click="openNotes = !openNotes" type="button" class="bg-white opacity-70 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100">
            <i class="fas fa-sticky-note"></i>
          </button>
        <button @click="copy" type="button" class="rounded-md p-2 inline-flex items-center justify-center"
                :class="[copied ? 'bg-green-500 text-white hover:text-white hover:bg-green-500' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100 bg-white opacity-70']">
          <i class="fas fa-copy"></i>
          <span v-if="copied" class="hidden 2xl:table-cell ml-2">Copied</span>
        </button>
        <button v-if="canEdit" @click="remove" type="button" class="bg-white opacity-70 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100">
          <i class="fas fa-times-circle"></i>
        </button>
      </div>
    </td>
  </tr>
</template>
