import qrcodeVue from 'qrcode.vue'
import customSelect from '../components/custom-select.vue'
import { ref } from 'vue'

export default {
  props: {
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
  },
  components: {
    qrcodeVue,
    customSelect
  },
  emits: ['open', 'remove', 'change', 'tag'],
  setup (props, { emit }) {
    const copied = ref(false)
    const openNotes = ref(false)
    const openQrCode = ref(false)
    const open = () => props.canEdit ? emit('open', props.url) : null
    const remove = () => emit('remove', props.id)
    const toggleTag = tag => emit('tag', tag)
    const change = (id, name, value) => emit('change', {id, name, value})
    const changeCategory = category => change(props.id, 'category', category)
    const copy = () => {
      navigator.clipboard.writeText(props.url)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    }

    return {
      copied,
      openNotes,
      openQrCode,
      open,
      remove,
      toggleTag,
      change,
      changeCategory,
      copy,
    }
  }
}
