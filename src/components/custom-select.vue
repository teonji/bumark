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
  disabled: {
    type: Boolean,
    default: false
  },
  list: {
    type: Array,
    default: () => ([])
  }
})
const emit = defineEmits(['change', 'remove', 'open'])

const colors = [
  'gray-500',
  'red-500',
  'yellow-500',
  'green-500',
  'blue-500',
  'indigo-500',
  'purple-500',
  'pink-500',
]
const icons = [
  'align-justify',
  'bell',
  'box',
  'calendar',
  'check-square',
  'clock',
  'comments',
  'database',
  'envelope',
  'folder',
  'hourglass',
  'info',
  'laptop',
  'plus',
  'poop',
  'ban',
  'search',
  'thumbs-up',
  'thumbs-down',
  'trash',
  'user',
  'wine-glass-alt',
  'plus',
]

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
    innerValue.value = null
    emit('remove', id)
  }
}
const toggle = () => {
  if (props.disabled) return
  opened.value = !opened.value
  emit('open')
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
    <div class="max-w-[125px] h-[40px] flex items-center cursor-pointer tracking-wider text-white text-sm rounded leading-loose font-semibold border-2 min-h-[36px]"
         :class="[boxClass(innerValueData ? innerValueData.color : innerValue), category === 'color' ? 'px-4' : 'px-2', {'border-transparent': innerValue !== (innerValueData ? innerValueData.color : innerValue) }]"
         @click="toggle"
    >
      <i v-if="category !== 'color'" class="fas text-white" :class="[`fa-${innerValueData ? innerValueData.icon : innerValue}`, {'mr-2': innerValueData && innerValueData.label }]" aria-hidden="true" />
      <span v-if="innerValueData" class="max-w-[120px] h-[28px] truncate">{{ innerValueData.label || '' }}</span>
    </div>
    <div v-if="opened" class="flex w-[350px] pt-2 absolute z-20" style="overflow: overlay">
      <div v-for="(item, k) in data"
            :key="k"
            class="max-w-[125px] h-[40px] relative tracking-wider text-white text-sm rounded leading-loose font-semibold border-2 mb-2 mr-4 min-h-[36px]"
            :class="[boxClass(item.color || item), category === 'color' ? 'px-4' : 'px-3', category === 'icon' ? 'py-2 w-[36px]' : 'py-1', {'border-transparent': innerValue !== item.color || item, 'cursor-pointer': category === 'color' }]"
            @click="() => { if (category === 'color') { changeValue(item) } }"
      >
        <div @click="changeValue(item.hasOwnProperty('id') ? item.id : item)" class="flex items-center cursor-pointer">
          <i v-if="category !== 'color'" class="fas text-white" :class="[`fa-${item.icon || item}`, {'mr-2' : item.label}]" aria-hidden="true" />
          <span v-if="item && item.label" class="max-w-[120px] h-[28px] truncate">{{ item.label || '' }}</span>
        </div>
        <i v-if="canRemove && item.hasOwnProperty('id') && item.id && item.id !== 'ADD'" class="absolute cursor-pointer top-[-8px] right-[-8px] fas fa-times-circle text-white" @click="remove(item.id)" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>
