<script setup>
import customSelect from '../components/custom-select.vue'
import { ref, shallowRef, reactive, computed, onMounted, defineAsyncComponent, } from 'vue'
const defaultSettings = {
  type: 'row',
  max: 100,
  dateFormat: 'DD-MM-YYYY',
}
const emptyCategory = {
  id: null,
  label: 'Nothing',
  color: 'gray-500',
  icon: 'ban',
}
const addCategory = {
  id: 'ADD',
  label: 'Add',
  color: 'gray-500',
  icon: 'plus',
}

const settings = reactive(defaultSettings)
const copiedAll = ref(false)
const list = ref([])
const tag = ref('')
const categories = ref([])
const category = ref(emptyCategory.id)
const categoryAddMode = ref(false)
const categoryToAdd = reactive({
  label: '',
  color: 'blue-500',
  icon: 'ban',
})
const categorySelectOpen = ref(null)
const notes = ref('')
const search = ref('')
const searchByTag = ref([])
const show = ref('add') // add | list | settings

// TODO: check ref?
const mark = ref(null)
const loaded = ref(false)
const dateFormats = ['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD']

const settingsCategoriesToAdd = computed(() => {
  return [
    emptyCategory,
    ...categories.value || [],
    addCategory,
  ]
})
const settingsCategories = computed(() => JSON.parse(JSON.stringify(settingsCategoriesToAdd.value)).filter(c => c.id !== 'ADD'))
const settingsCategoriesFilters = computed(() => JSON.parse(JSON.stringify(settingsCategories.value)).map(c => {
  if (!c.id) {
    c.label = 'No Filter'
  }
  return c
}))

const searchInputRef = ref(null)
const tagInputRef = ref(null)

const typeView = shallowRef(defineAsyncComponent(() => import(`../components/${settings.type}.vue`)))

const listFiltered = computed(() => {
  const listData = JSON.parse(JSON.stringify(list.value))
      .filter(l => searchByTag.value.length === 0 || l.tags.some(t => searchByTag.value.includes(t)))
      .filter(l => category.value === null || l.category === category.value)
  if (search.value === '') {
    return listData
  }
  return listData.filter(l => (l.title || '').toLowerCase().includes(search.value.toLowerCase())
    || (l.description || '').toLowerCase().includes(search.value.toLowerCase())
    || (l.provider || '').toLowerCase().includes(search.value.toLowerCase())
    || (l.tags || []).includes(search.value.toLowerCase())
    || (l.notes || '').includes(search.value.toLowerCase())
    || (l.category || '').includes(search.value.toLowerCase())
  )
})

const openSelectedMarks = async () => await browser.runtime.sendMessage({ type: 'openSelectedMarks', links: listFiltered.value.map(l => l.url) })
const copySelectedMarks = () => {
  navigator.clipboard.writeText(listFiltered.value.map(l => l.url).join("\n"))
  copiedAll.value = true
  setTimeout(() => {
    copiedAll.value = false
  }, 2000)
}
const openMark = async link => await browser.runtime.sendMessage({ type: 'openMark', link })

const removeMark = async id => {
  if (confirm('Are you sure?')) {
    list.value = await browser.runtime.sendMessage({ type: 'removeMark', id, settings, })
    clearTag()
  }
}

const changeMark = async ({ id, name, value }) => {
  list.value = await browser.runtime.sendMessage({
    type: 'changeMark',
    id,
    name,
    value,
  })
}

const send = async (type, data = {}) => {
  const newList = await browser.runtime.sendMessage({
    type,
    tag: tag.value,
    category: category.value,
    notes: notes.value,
    settings,
    ...data,
  })
  if (newList === 'ERROR_MAX') {
    alert('Max mark reached.')
  } else if (newList === 'ERROR_NOTHING') {
    alert('Tab without url.')
  } else {
    list.value = newList
    clearTag()
  }
}

const clearTag = () => {
  tag.value = ''
}
const closeCurrentTab = async () => {
  if (list.value.length < settings.max && mark.value && loaded.value) {
    await send('closeCurrentTab')
  }
}
const closeAllTabs = async () => {
  await send('closeAllTabs')
}
const clearSelectedMarks = async () => {
  if (confirm('Are you sure?')) {
    await send('clearSelectedMarks', { list: listFiltered.value.map(l => l.id) })
  }
}
const toggleTag = e => {
  if (searchByTag.value.includes(e)) {
    searchByTag.value = searchByTag.value.filter(t => t !== e)
  } else {
    searchByTag.value.push(e)
  }
}
const openOptions = async () => await browser.runtime.sendMessage({ type: 'openOptions' })

const setShow = e => {
  show.value = e
  setTimeout(() => {
    if (e === 'add') {
      tagInputRef.value.focus()
    } else if (e === 'list') {
      searchInputRef.value.focus()
    }
  })
}

const changeTypeView = async component => {
  try {
    typeView.value = await defineAsyncComponent(() => import(`../components/${component}.vue`))
  } catch (e) {
    alert(e.message)
  }
}

const setSettings = async (type, value) => {
  settings[type] = value
  if (type === 'type') {
    await changeTypeView(value)
  }
  await chrome.storage.sync.set({ settings, })
}

const changeCategory = val => {
  category.value = val
  if (val === 'ADD') {
    categoryAddMode.value = !categoryAddMode.value
  }
}
const clearAddCategory = () => {
  categoryAddMode.value = !categoryAddMode.value
  categoryToAdd.label = ''
  categoryToAdd.icon = emptyCategory.icon
  categoryToAdd.color = emptyCategory.color
}

const removeCategory = async id => {
  const storage = await browser.runtime.sendMessage({ type: 'removeCategory', id, })
  category.value = emptyCategory.id
  categories.value = storage.categories
  list.value = storage.bumarks
}

const toggleCategorySelectOpen = type => {
  if (type !== categorySelectOpen.value) {
    categorySelectOpen.value = type
  } else {
    categorySelectOpen.value = null
  }
}
const changeCategorySelectOpen = data => {
  categoryToAdd.color = data
  categorySelectOpen.value = null
}

const toggleCancelCategory = async () => {
  category.value = emptyCategory.id
  clearAddCategory()
}
const toggleAddCategory = async () => {
  const cat = categoryToAdd
  cat.id = crypto.randomUUID()
  const categoriesFromStorage = await browser.runtime.sendMessage({ type: 'addCategory', category: cat, })
  category.value = cat.id
  categories.value = categoriesFromStorage
  clearAddCategory()
}

onMounted(async () => {
  tagInputRef.value.focus()
  if (location.search === '?show=list') {
    show.value = 'list'
  }
  try {
    mark.value = await browser.runtime.sendMessage({ type: 'previewMark', settings, })
    loaded.value = true
  } catch (e) {
    alert(e)
  }
  try {
    const { bumarks, settings: settingsFromStorage, categories: categoriesFromStorage } = await browser.runtime.sendMessage({ type: 'getInitialStorage', defaultSettings })
    list.value = bumarks
    categories.value = categoriesFromStorage
    Object.keys(settingsFromStorage).forEach(k => settings[k] = settingsFromStorage[k])
    await changeTypeView(settingsFromStorage.type)
  } catch (e) {
    alert(e)
  }
})
</script>

<template>
  <div class="bg-gray-800">
    <nav class="fixed z-50 top-0 bg-white w-full flex justify-between items-center mx-auto px-4 h-16">
      <img src="/logo.png" class="h-[50px] w-[50px] object-cover rounded-2xl">
      <div class="flex justify-end items-center relative">
        <div class="flex items-center">
          <button @click="setShow('add')"
                  class="block sm:hidden w-[44px] h-[44px] inline-block py-1 px-3 hover:bg-gray-200 rounded-full relative ml-2"
                  :class="[show === 'add' ? 'bg-blue-400 text-white' : 'bg-gray-200 text-black' ]"
          >
            <i class="far fa-plus text-xl pt-1 mb-1 block" />
          </button>
          <button @click="setShow('list')"
                  type="button"
                  class="w-[44px] h-[44px] flex inline-block py-1 px-3 hover:bg-gray-200 rounded-full relative ml-2"
                  :class="[show === 'list' ? 'bg-blue-400 text-white' : 'bg-gray-200 text-black' ]"
          >
            <span class="absolute top-[-6px] right-[-4px] bg-blue-600 px-1 m-1 text-sm shadow-sm font-medium tracking-wider text-blue-100 rounded-full">{{ list.length }}</span>
            <i class="far fa-list text-xl pt-1 mb-1 block" />
          </button>
          <button @click="setShow('settings')"
                  type="button"
                  class="w-[44px] h-[44px] inline-block py-1 px-3 hover:bg-gray-200 rounded-full relative ml-2"
                  :class="[show === 'settings' ? 'bg-blue-400 text-white' : 'bg-gray-200 text-black' ]"
          >
            <i class="far fa-cog text-xl pt-1 mb-1 block" />
          </button>
          <button @click="openOptions"
                  type="button"
                  class="w-[44px] h-[44px] inline-block py-1 px-3 hover:bg-gray-200 rounded-full relative ml-2">
            <i class="far fa-external-link-alt text-xl pt-1 mb-1 block" />
          </button>
        </div>
      </div>
    </nav>
    <div class="container mx-auto">
      <template v-if="show === 'add'">
        <div class="container fixed z-50 top-[64px] bg-gray-800">
          <div class="flex items-center justify-center px-5">
            <div class="w-full max-w-md mx-auto">
              <div class="flex">
                <div class="flex-1 group">
                  <div @click="closeCurrentTab"
                       class="flex items-end justify-center text-center mx-auto px-4 pt-2 w-full text-gray-400 group-hover:text-indigo-500"
                       :class="[list.length >= settings.max || (!mark && loaded) ? 'text-gray-700 group-hover:text-gray-700' : 'cursor-pointer']"
                  >
                    <span class="block px-1 pt-1 pb-1">
                        <i class="far fa-flushed text-4xl pt-1 mb-1 block"></i>
                        <span class="block text-xs pb-2">Close Current tab</span>
                        <span v-if="list.length < settings.max && mark && loaded" class="block w-5 mx-auto h-1 group-hover:bg-indigo-500 rounded-full" />
                    </span>
                  </div>
                </div>
                <div class="flex-1 group">
                  <button @click="closeAllTabs" class="flex items-end justify-center text-center mx-auto px-4 pt-2 w-full text-gray-400 cursor-pointer group-hover:text-indigo-500">
                    <span class="block px-1 pt-1 pb-1">
                        <i class="far fa-dizzy text-4xl pt-1 mb-1 block"></i>
                        <span class="block text-xs pb-2">Close All tabs</span>
                        <span class="block w-5 mx-auto h-1 group-hover:bg-indigo-500 rounded-full"></span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!categoryAddMode" class="flex items-center justify-center container m-auto pb-3 px-3">
            <custom-select
                :list="settingsCategoriesToAdd"
                :value="category"
                :can-remove="true"
                @change="changeCategory"
                @remove="removeCategory"
            />
            <div class="w-full mx-auto ml-3">
              <div class="relative text-gray-600 focus-within:text-gray-400">
                <span class="absolute inset-y-0 left-0 flex items-center pl-2">
                  <button type="submit" class="p-1 focus:outline-none focus:shadow-outline">
                    <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" class="w-6 h-6"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </button>
                </span>
                <input v-model="tag"
                       ref="tagInputRef"
                       @keyup.enter="closeCurrentTab"
                       placeholder="Insert a tag"
                       :disabled="list.length >= settings.max || (!mark && loaded)"
                       class="w-full py-2 text-sm text-gray-400 bg-gray-900 rounded-md pl-10 focus:outline-none focus:bg-white focus:text-gray-900">
              </div>
            </div>
          </div>

          <div v-if="!categoryAddMode" class="flex items-center justify-center container m-auto pb-3 px-3">
            <div class="w-full mx-auto">
              <div class="relative text-gray-600 focus-within:text-gray-400">
                <textarea v-model="notes"
                          placeholder="Insert notes"
                          :disabled="list.length >= settings.max || (!mark && loaded)"
                          class="w-full py-2 text-sm text-gray-400 bg-gray-900 rounded-md pl-4 focus:outline-none focus:bg-white focus:text-gray-900" />
              </div>
            </div>
          </div>

          <div v-if="categoryAddMode" class="flex items-center justify-center container m-auto pb-3 px-3">
            <div class="flex w-full">
              <div class="flex w-full w-[90px] mr-2">
                <div class="mr-2">
                  <custom-select
                      category="color"
                      :disabled="categorySelectOpen === 'icon'"
                      :value="categoryToAdd.color"
                      @open="toggleCategorySelectOpen('color')"
                      @change="data => changeCategorySelectOpen(data)"
                  />
                </div>
                <div>
                  <custom-select
                      category="icon"
                      :disabled="categorySelectOpen === 'color'"
                      :value="categoryToAdd.icon"
                      @open="toggleCategorySelectOpen('icon')"
                      @change="data => changeCategorySelectOpen(data)"
                  />
                </div>
              </div>
              <input v-model="categoryToAdd.label"
                     placeholder="Insert category name"
                     class="w-full py-2 text-sm text-gray-400 bg-gray-900 rounded-md pl-4 focus:outline-none focus:bg-white mr-2 focus:text-gray-900"
              />
              <div class="flex w-[90px] mr-2">
                <button :disabled="categoryToAdd.label === ''"
                        class="font-bold text-white p-2 transition duration-300 ease-in-out mr-2 rounded"
                        :class="[categoryToAdd.label === '' ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer']"
                        @click="toggleAddCategory"
                >
                  OK
                </button>
                <button class="bg-gray-500 font-bold text-white p-2 transition duration-300 ease-in-out hover:bg-gray-600 rounded" @click="toggleCancelCategory">Cancel</button>
              </div>
            </div>
          </div>

          <ul v-if="loaded && mark" class="flex justify-end mr-3 mb-3">
            <li @click="setSettings('type', 'row')" class="px-2 rounded-l-lg cursor-pointer" :class="[settings.type === 'row' ? 'bg-blue-400 text-white' : 'bg-white']">
              <i class="far fa-stream text-xl pt-1 mb-1 block" />
            </li>
            <li @click="setSettings('type', 'card')" class="px-2 rounded-r-lg cursor-pointer" :class="[settings.type === 'card' ? 'bg-blue-400 text-white' : 'bg-white']">
              <i class="far fa-th-large text-xl pt-1 mb-1 block" />
            </li>
          </ul>
        </div>
        <div class="mt-[340px]">
          <div v-if="mark && loaded" class="grid grid-cols-1 gap-1 container m-auto px-3 pb-3">
            <component :is="typeView" v-bind="mark" :settings="settings" class="pb-4" />
          </div>
          <div v-else-if="!categoryAddMode" class="flex items-center justify-center px-5 text-gray-400">
          <div v-if="loaded">
            No preview available
          </div>
          <div v-else>
            Loading
          </div>
        </div>
        </div>
      </template>
      <template v-if="show === 'list'">
        <div class="container fixed z-50 top-[64px] bg-gray-800">
          <div class="flex items-center justify-between p-3">
            <div @click="openSelectedMarks" class="text-gray-400 cursor-pointer">Open {{ listFiltered.length > 1 ? 'all' : '' }} {{ listFiltered.length }} url{{ listFiltered.length > 1 ? 's' : '' }}</div>
            <div @click="clearSelectedMarks" class="text-gray-400 cursor-pointer">Clear {{ listFiltered.length > 1 ? 'all' : '' }} {{ listFiltered.length }} url{{ listFiltered.length > 1 ? 's' : '' }}</div>
          </div>
          <div class="flex items-center justify-center pb-3 px-3">
            <div class="w-full mx-auto">
              <div class="relative text-gray-600 focus-within:text-gray-400">
              <span class="absolute inset-y-0 left-0 flex items-center pl-2">
                <button type="submit" class="p-1 focus:outline-none focus:shadow-outline">
                  <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" class="w-6 h-6"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>
              </span>
                <input v-model="search" ref="searchInputRef" placeholder="Search mark" class="w-full py-2 text-sm text-gray-400 bg-gray-900 rounded-md pl-10 focus:outline-none focus:bg-white focus:text-gray-900">
              </div>
            </div>
          </div>
          <div class="flex items-center justify-center px-3">
            <button v-for="(t, i) in searchByTag"
                    :key="i"
                    @click="toggleTag(t)"
                    class="bg-blue-600 px-2 py-1 mr-2 mb-2 text-sm shadow-sm font-medium tracking-wider text-blue-100 rounded-full hover:shadow-2xl hover:bg-blue-700">
              <span>{{ t }}</span>
              <span class="ml-3">x</span>
            </button>
          </div>
          <div class="flex justify-between items-center mb-3">
            <button @click="copySelectedMarks" type="button" class="ml-3 rounded-md p-2 inline-flex items-center justify-center"
                    :class="[copiedAll ? 'bg-green-500 text-white hover:text-white hover:bg-green-500' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100 bg-white opacity-70']">
              <i class="fas fa-copy"></i>
              <span v-if="copiedAll" class="ml-2">Copied</span>
              <span v-else class="ml-2">Copy {{ listFiltered.length > 1 ? 'all' : '' }} {{ listFiltered.length }} url{{ listFiltered.length > 1 ? 's' : '' }}</span>
            </button>
            <custom-select
                v-if="settingsCategories.length > 1"
                :list="settingsCategoriesFilters"
                :value="category"
                @change="changeCategory"
            />
            <ul v-if="loaded" class="flex justify-end mr-3">
              <li @click="setSettings('type', 'row')" class="px-2 rounded-l-lg cursor-pointer" :class="[settings.type === 'row' ? 'bg-blue-400 text-white' : 'bg-white']">
                <i class="far fa-stream text-xl pt-1 mb-1 block" />
              </li>
              <li @click="setSettings('type', 'card')" class="px-2 rounded-r-lg cursor-pointer" :class="[settings.type === 'card' ? 'bg-blue-400 text-white' : 'bg-white']">
                <i class="far fa-th-large text-xl pt-1 mb-1 block" />
              </li>
            </ul>
          </div>
        </div>
        <div class="mt-[215px]">
          <div class="grid grid-cols-1 lg:gap-3 gap-1 px-3"
              :class="{'md:grid-cols-3': typeView === 'card', 'md:grid-cols-3': typeView === 'row'}"
          >
            <component :is="typeView"
                       v-for="(l, i) in listFiltered"
                       :key="`mark-${i}`"
                       v-bind="l"
                       can-edit
                       :settings="settings"
                       :categories="settingsCategories"
                       @open="openMark"
                       @remove="removeMark"
                       @change="changeMark"
                       @tag="toggleTag"
            />
          </div>
          <div v-if="!listFiltered.length" class="flex items-center justify-center px-5 text-gray-400">
            Nothing found
          </div>
        </div>
      </template>
      <template v-if="show === 'settings'">
        <div class="mt-[80px]">
          <div class="flex items-center justify-between px-5">
            <span class="text-gray-400 text-3xl">Date Format</span>
            <div class="mb-3 xl:w-96">
              <select v-model="settings.dateFormat"
                      @change="e => setSettings('dateFormat', e.target.value)"
                      class="form-select appearance-none
                           block
                           w-full
                           px-3
                           py-1.5
                           text-base
                           font-normal
                           text-gray-700
                           bg-white bg-clip-padding bg-no-repeat
                           border border-solid border-gray-300
                           rounded
                           transition
                           ease-in-out
                           m-0
                           focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                      aria-label="Select date format">
                <option v-for="(f, i) in dateFormats" :selected="settings.dateFormat === f" :key="`format-${i}`">{{ f }}</option>
              </select>
            </div>
          </div>
          <div class="flex items-center justify-between px-5">
            <span class="text-gray-400 text-3xl">Max mark</span>
            <div class="mb-3 xl:w-96">
              <input v-model="settings.max"
                     min="10"
                     max="999"
                     type="number"
                     @change="e => setSettings('max', parseInt(e.target.value))"
                     class="form-control
                          block
                          w-full
                          px-4
                          py-2
                          text-xl
                          font-normal
                          text-gray-700
                          bg-white bg-clip-padding
                          border border-solid border-gray-300
                          rounded
                          transition
                          ease-in-out
                          m-0
                          focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                     placeholder="Max mark"
              />
            </div>
          </div>
          <div class="flex items-center justify-between px-5">
            <span class="text-gray-400 text-3xl">Shortcut popup</span>
            <div class="mb-3 xl:w-96 text-2xl text-right text-gray-400">
              Ctrl+u / Cmd+u
            </div>
          </div>
          <div class="flex items-center justify-center mt-12 text-gray-400">
            <span>Made with ❤ by teonji © {{ new Date().getFullYear() }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style>
@import url('https://pro.fontawesome.com/releases/v5.10.0/css/all.css');
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;800&display=swap');
body {
  font-family: 'Poppins', sans-serif;
  @apply bg-gray-800
         min-w-[400px]
}
         /*min-h-[600px]*/
</style>

