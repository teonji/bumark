<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
const props = defineProps({
  category: {
    type: String,
    default: null
  },
  value: {
    type: String,
    default: null
  },
  canRemove: {
    type: Boolean,
    default: false
  },
  list: {
    type: Array,
    default: () => ([])
  }
})
const emit = defineEmits(['change', 'remove'])

const colors = ['red-500', 'yellow-500', 'green-500', 'blue-500', 'indigo-500', 'purple-500', 'pink-500']
const icons = ['ban', 'plus']

const innerValue = ref(props.value)
const opened = ref(false)

const innerValueData = computed(() => props.list.find(item => item.id === innerValue.value))

const data = computed(() => {
  switch (props.category) {
    case 'color':
      return colors.filter(color => color !== innerValue.value)
    case 'icon':
      return icons.filter(icon => icon !== innerValue.value)
    default:
      return props.list.filter(item => item.id !== innerValue.value)
  }
})

const changeValue = val => {
  innerValue.value = val
  opened.value = !opened.value
  emit('change', val)
}
const remove = id => {
  if (confirm('Are you sure?')) {
    emit('remove', id)
  }
}
const boxClass = val => {
  switch (props.category) {
    case 'icon':
      return 'bg-gray-500'
    default:
      return `bg-${val}`
  }
}
</script>

<template>
  <div class="relative">
    <div class="flex items-center cursor-pointer tracking-wider text-white text-sm rounded leading-loose font-semibold border-2 min-h-[36px]"
         :class="[boxClass(innerValueData ? innerValueData.color : innerValue), category === 'color' ? 'px-4' : 'px-2', {'border-transparent': innerValue !== (innerValueData ? innerValueData.color : innerValue) }]"
         @click="opened = !opened"
    >
      <i v-if="category !== 'color'" class="fas text-white" :class="[`fa-${innerValueData ? innerValueData.icon : innerValue}`, {'mr-2': innerValueData && innerValueData.label }]" aria-hidden="true" />
      <span v-if="innerValueData">{{ innerValueData.label || '' }}</span>
    </div>
    <div v-if="opened" class="flex-col pt-2 absolute z-20">
      <div v-for="(item, k) in data"
            :key="k"
            class="relative flex items-center cursor-pointer tracking-wider text-white py-1 text-sm rounded leading-loose font-semibold border-2 mb-2 min-h-[36px]"
            :class="[boxClass(item.color || item), innerValueData ? 'px-4' : 'px-3', {'border-transparent': innerValue !== item.color || item }]"
           @click="changeValue(item.hasOwnProperty('id') ? item.id : item)"
      >
        <i v-if="category !== 'color'" class="fas text-white" :class="[`fa-${item.icon || item}`, {'mr-2' : item.label}]" aria-hidden="true" />
        <span v-if="item && item.label">{{ item.label || '' }}</span>
        <i v-if="canRemove && item.hasOwnProperty('id') && item.id && item.id !== 'ADD'" class="absolute top-0 right-0 fas fa-times-circle text-white" @click="remove(item.id)" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>
