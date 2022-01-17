import dayjs from 'dayjs'
import {ref, defineProps, defineEmits, computed} from 'vue'
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
  type: {
    type: String,
    default: null
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
const dateFormatted = computed(() => dayjs(props.date).format(props.settings.dateFormat))
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
export default {
  props,
  dateFormatted,
  copied,
  open,
  remove,
  toggleTag,
  copy,
}
