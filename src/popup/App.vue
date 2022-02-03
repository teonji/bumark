<script>
import dayjs from 'dayjs'
import timeView from '../components/time.vue'
import rowView from '../components/row.vue'
import cardView from '../components/card.vue'
import customSelect from '../components/custom-select.vue'
import { ref, reactive, computed, onMounted, } from 'vue'
export default {
  components: {
    timeView,
    rowView,
    cardView,
    customSelect,
  },
  setup () {
    const defaultSettings = {
      type: 'row',
      category: null,
    }
    const emptyCategory = {
      id: null,
      label: 'None',
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
    const reloading = ref(false)
    const list = ref([])
    const tag = ref('')
    const categories = ref([])
    const category = ref(undefined)
    const categoryFilter = ref(emptyCategory.id)
    const categoryAddMode = ref(false)
    const categorySelectOpen = ref(null)
    const notes = ref('')
    const search = ref('')
    const searchByTag = ref([])
    const show = ref('add') // add | list
    const scrollDesktopClass = ref(null)
    const mark = ref(null)
    const marks = ref(null)
    const loaded = ref(false)
    const searchInputRef = ref(null)
    const tagInputRef = ref(null)
    const type = ref('row')
    const settingsCategoriesToAdd = computed(() => {
      return [
        emptyCategory,
        addCategory,
        ...categories.value || [],
      ]
    })
    const settingsCategories = computed(() => JSON.parse(JSON.stringify(settingsCategoriesToAdd.value)).filter(c => c.id !== 'ADD'))
    const settingsCategoriesFilters = computed(() => JSON.parse(JSON.stringify(settingsCategories.value)).map(c => {
      if (!c.id) {
        c.label = 'No Filter'
      }
      return c
    }))
    const listFiltered = computed(() => {
      const categoryId = categoryFilter.value
      const listData = list.value
          .filter(l => searchByTag.value.length === 0 || l.tags.some(t => searchByTag.value.includes(t)))
          .filter(l => !categoryId || l.category === categoryId)
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
    const listFilteredGroupByDate = computed(() => {
      const group = JSON.parse(JSON.stringify(listFiltered.value)).reduce(function(rv, x) {
        const date = dayjs(x.date).format('YYYY-MM-DD');
        (rv[date] = rv[date] || []).push(x)
        return rv
      }, {})
      return Object.keys(group).map(k => ({
        date: k,
        formattedDate: dayjs(k).format('MMM DD, YYYY'),
        list: group[k].map(l => {
          l.time = dayjs(l.date).format('HH:mm')
          return l
        }),
      }))
    })
    const categoryToAdd = reactive({
      label: '',
      color: 'blue-500',
      icon: 'ban',
    })

    const today = dayjs().format('DD MMM YYYY')
    const formatDate = date => {
      const dateFormatted = dayjs(date).format('DD MMM YYYY')
      return dateFormatted === today ? 'Today' : dateFormatted
    }
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
      if (confirm('Are you sure you wanna remove this?')) {
        list.value = await browser.runtime.sendMessage({ type: 'removeMark', id, })
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
        ...data,
      })
      if (newList === 'ERROR_NOTHING') {
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
      if (mark.value && loaded.value) {
        await send('closeCurrentTab')
      }
    }
    const closeAllTabs = async () => {
      if (confirm(`Are you sure you wanna close this ${marks.value.length} tab${marks.value.length > 1 ? 's' : ''}?`)) {
        await send('closeAllTabs')
        await reload()
        show.value = 'list'
      }
    }
    const clearSelectedMarks = async () => {
      const listToClear = listFiltered.value.map(l => l.id)
      if (confirm(`Are you sure you wanna clear this ${listToClear.length} tab${listToClear.length > 1 ? 's' : ''}?`)) {
        await send('clearSelectedMarks', { list: listToClear })
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
          if (!categoryAddMode.value && loaded.value && (mark.value || (marks.value && marks.value.length))) {
            tagInputRef.value.focus()
          }
        } else if (e === 'list') {
          searchInputRef.value.focus()
        }
      })
    }
    const changeTypeView = async component => {
      try {
        type.value = component
        changeScrollDesktopClass()
      } catch (e) {
        alert(e.message)
      }
    }
    const setType = async value => {
      await changeTypeView(value)
      settings.type = value
      await chrome.storage.sync.set({ settings, })
    }
    const changeCategory = val => {
      category.value = val
      if (val === 'ADD') {
        categoryAddMode.value = !categoryAddMode.value
      }
    }
    const changeCategoryFilter = val => {
      categoryFilter.value = val
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
      list.value = storage.list
    }
    const toggleCategorySelectOpen = type => {
      if (type !== categorySelectOpen.value) {
        categorySelectOpen.value = type
      } else {
        categorySelectOpen.value = null
      }
    }
    const changeCategorySelectOpen = (type, data) => {
      categoryToAdd[type] = data
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
    const changeScrollDesktopClass = () => {
      if (document.body.scrollHeight !== 600 && document.body.scrollWidth !== 400) {
        scrollDesktopClass.value = document.body.scrollHeight - document.getElementById('nav').clientHeight + document.getElementById('action').clientHeight - 120
      }
    }
    const reload = async () => {
      reloading.value = true
      await previewMark()
      await getInitialStorage()
      changeScrollDesktopClass()
      setTimeout(() => {
        reloading.value = false
      }, 1000)
    }
    const previewMark = async () => {
      try {
        const preview = await browser.runtime.sendMessage({ type: 'previewMark', })
        mark.value = preview.actual
        marks.value = preview.list
        loaded.value = true
        if (show.value !== 'list') {
          setTimeout(() => {
            if (tagInputRef.value) {
              tagInputRef.value.focus()
            }
          }, 200)
        }
      } catch (e) {
        alert(e)
      }
    }
    const getInitialStorage = async () => {
      try {
        const { bumarks, settings: settingsFromStorage, categories: categoriesFromStorage } = await browser.runtime.sendMessage({ type: 'getInitialStorage', defaultSettings })
        list.value = bumarks
        categories.value = categoriesFromStorage
        Object.keys(settingsFromStorage).forEach(k => settings[k] = settingsFromStorage[k])
        category.value = settingsFromStorage.category || null
        await changeTypeView(settingsFromStorage.type)
      } catch (e) {
        alert(e)
      }
    }
    onMounted(async () => {
      if (location.search === '?show=list') {
        show.value = 'list'
      }
      await reload()
    })

    return {
      settings,
      copiedAll,
      reloading,
      list,
      tag,
      categories,
      category,
      categoryFilter,
      categoryAddMode,
      categorySelectOpen,
      notes,
      search,
      searchByTag,
      show,
      scrollDesktopClass,
      mark,
      marks,
      loaded,
      searchInputRef,
      tagInputRef,
      type,

      settingsCategoriesToAdd,
      settingsCategories,
      settingsCategoriesFilters,
      listFiltered,
      listFilteredGroupByDate,
      categoryToAdd,

      formatDate,
      openSelectedMarks,
      copySelectedMarks,
      openMark,
      removeMark,
      changeMark,
      send,
      clearTag,
      closeCurrentTab,
      closeAllTabs,
      clearSelectedMarks,
      toggleTag,
      openOptions,
      setShow,
      changeTypeView,
      setType,
      changeCategory,
      changeCategoryFilter,
      clearAddCategory,
      removeCategory,
      toggleCategorySelectOpen,
      changeCategorySelectOpen,
      toggleCancelCategory,
      toggleAddCategory,
      changeScrollDesktopClass,
      reload,
      previewMark,
      getInitialStorage,
    }
  }
}
</script>

<template>
  <div class="bg-gray-800 sm:h-screen overflow-hidden">
    <nav id="nav" class="bg-white w-full flex justify-between items-center mx-auto px-4 h-16">
      <div class="flex justify-center items-center">
        <img src="/logo.png" class="h-[50px] w-[50px] object-cover rounded-2xl">
        <span class="font-bold text-2xl">BUMARK</span>
      </div>
      <div v-if="show === 'list'" class="w-full mx-auto ml-3">
        <div class="hidden sm:block relative text-gray-600 focus-within:text-gray-400">
          <span class="absolute inset-y-0 left-0 flex items-center pl-4">
            <i class="fas fa-search"></i>
          </span>
          <input v-model="search" ref="searchInputRef" placeholder="Search mark" class="w-full py-2 text-sm text-gray-400 bg-gray-900 rounded-md pl-10 focus:outline-none focus:bg-white focus:text-gray-900">
        </div>
      </div>
      <div class="flex justify-end items-center relative">
        <div class="flex items-center">
          <button @click="reload"
                  class="w-[44px] h-[44px] inline-block py-1 px-3 rounded-full relative ml-2 bg-gray-200 hover:bg-gray-300 text-black"
          >
            <i class="far fa-sync text-xl pt-1 mb-1 block" :class="{'fa-spin': reloading}" />
          </button>
          <button @click="setShow('add')"
                  class="w-[44px] h-[44px] inline-block py-1 px-3 rounded-full relative ml-2"
                  :class="[show === 'add' ? 'bg-blue-400 hover:bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-black' ]"
          >
            <i class="far fa-plus text-xl pt-1 mb-1 block" />
          </button>
          <button v-if="list && list.length" @click="setShow('list')"
                  type="button"
                  class="w-[44px] h-[44px] flex inline-block py-1 px-3 rounded-full relative ml-2"
                  :class="[show === 'list' ? 'bg-blue-400 hover:bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-black' ]"
          >
            <span v-if="list.length" class="absolute top-[-6px] right-[-4px] bg-blue-600 px-1 m-1 text-sm shadow-sm font-medium tracking-wider text-blue-100 rounded-full">{{ list.length }}</span>
            <i class="far fa-list text-xl pt-1 mb-1 block" />
          </button>
          <button @click="openOptions"
                  type="button"
                  class="block sm:hidden w-[44px] h-[44px] inline-block py-1 px-3 hover:bg-gray-300 rounded-full relative ml-2">
            <i class="far fa-external-link-alt text-xl pt-1 mb-1 block" />
          </button>
        </div>
      </div>
    </nav>
    <div id="action" class="container mx-auto bg-gray-800">
      <template v-if="show === 'add' && loaded && (mark || (marks && marks.length))">
        <div class="flex items-center justify-center px-5">
          <div class="w-full max-w-md mx-auto h-[92px]">
            <div v-if="loaded" class="flex">
              <div class="flex-1 group" v-if="mark">
                <div @click="closeCurrentTab"
                     class="flex items-end justify-center text-center mx-auto px-4 pt-2 w-full text-gray-400 group-hover:text-indigo-500"
                     :class="[!mark && loaded ? 'text-gray-700 group-hover:text-gray-700' : 'cursor-pointer']"
                >
                  <span class="block px-1 pt-1 pb-1">
                    <i class="far fa-window-close text-4xl pt-1 mb-1 block"></i>
                    <span class="block text-xs pb-2">Close Current tab</span>
                    <span v-if="mark && loaded" class="block w-5 mx-auto h-1 group-hover:bg-indigo-500 rounded-full" />
                  </span>
                </div>
              </div>
              <div v-if="marks && marks.length > (mark ? 1 : 0)" class="flex-1 group">
                <button @click="closeAllTabs" class="flex items-end justify-center text-center mx-auto px-4 pt-2 w-full text-gray-400 cursor-pointer group-hover:text-indigo-500">
                    <span class="block px-1 pt-1 pb-1">
                      <i class="far fa-times-circle text-4xl pt-1 mb-1 block"></i>
                      <span class="block text-xs pb-2">Close All <span v-if="marks">{{ marks.length }}</span> tabs</span>
                      <span class="block w-5 mx-auto h-1 group-hover:bg-indigo-500 rounded-full"></span>
                    </span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!categoryAddMode && category !== undefined && loaded && (mark || (marks && marks.length))" class="flex items-center justify-center container m-auto pb-3 px-3">
          <custom-select
              :list="settingsCategoriesToAdd"
              :value="category"
              :can-remove="true"
              @change="changeCategory"
              @remove="removeCategory"
          />
          <div class="w-full mx-auto ml-3">
            <div class="relative text-gray-600 focus-within:text-gray-400">
              <span class="absolute inset-y-0 left-0 flex items-center pl-4">
                <i class="fas fa-tag"></i>
              </span>
              <input v-model="tag"
                     ref="tagInputRef"
                     @keyup.enter="closeCurrentTab"
                     placeholder="Insert a tag"
                     :disabled="!mark && (!marks || !marks.length) && loaded"
                     class="w-full py-2 text-sm text-gray-400 bg-gray-900 rounded-md pl-10 focus:outline-none focus:bg-white focus:text-gray-900">
            </div>
          </div>
        </div>

        <div v-if="!categoryAddMode && loaded && (mark || (marks && marks.length))" class="flex items-center justify-center container m-auto pb-3 px-3">
          <div class="w-full mx-auto">
            <div class="relative text-gray-600 focus-within:text-gray-400">
                <textarea v-model="notes"
                          placeholder="Insert notes"
                          maxlength="255"
                          :disabled="!mark && (!marks || !marks.length) && loaded"
                          class="w-full py-2 text-sm text-gray-400 bg-gray-900 rounded-md pl-4 focus:outline-none focus:bg-white focus:text-gray-900" />
            </div>
          </div>
        </div>

        <div v-if="!categoryAddMode && loaded && (mark || (marks && marks.length))" class="flex justify-between items-center mb-3">
          <span class="text-white ml-3 text-2xl">Preview</span>
          <ul class="flex justify-end mr-3">
            <li @click="setType('row')" class="px-2 rounded-l-lg cursor-pointer" :class="[settings.type === 'row' || settings.type === 'time' ? 'bg-blue-400 hover:bg-blue-500 text-white' : 'hover:bg-gray-200 bg-white']">
              <i class="far fa-stream text-xl pt-1 mb-1 block" />
            </li>
            <li @click="setType('card')" class="px-2 rounded-r-lg cursor-pointer" :class="[settings.type === 'card' ? 'bg-blue-400 hover:bg-blue-500 text-white' : 'hover:bg-gray-200 bg-white']">
              <i class="far fa-th-large text-xl pt-1 mb-1 block" />
            </li>
          </ul>
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
                    @change="data => changeCategorySelectOpen('color', data)"
                />
              </div>
              <div>
                <custom-select
                    category="icon"
                    :disabled="categorySelectOpen === 'color'"
                    :value="categoryToAdd.icon"
                    @open="toggleCategorySelectOpen('icon')"
                    @change="data => changeCategorySelectOpen('icon', data)"
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

      </template>
      <template v-if="show === 'list'">
        <div v-if="list.length" class="block sm:hidden flex items-center justify-center p-3">
          <div class="w-full mx-auto">
            <div class="relative text-gray-600 focus-within:text-gray-400">
               <span class="absolute inset-y-0 left-0 flex items-center pl-4">
                <i class="fas fa-search"></i>
              </span>
              <input v-model="search" ref="searchInputRef" placeholder="Search mark" class="w-full py-2 text-sm text-gray-400 bg-gray-900 rounded-md pl-10 focus:outline-none focus:bg-white focus:text-gray-900">
            </div>
          </div>
        </div>
        <div v-if="list.length" class="flex items-center justify-center px-3">
          <button v-for="(t, i) in searchByTag"
                  :key="i"
                  @click="toggleTag(t)"
                  class="bg-blue-600 px-2 py-1 mr-2 mb-2 text-sm shadow-sm font-medium tracking-wider text-blue-100 rounded-full hover:shadow-2xl hover:bg-blue-700">
            <span>{{ t }}</span>
            <span class="ml-3">x</span>
          </button>
        </div>
        <div v-if="list.length" class="flex justify-between items-center mt-3">
          <button @click="copySelectedMarks" type="button" class="ml-3 rounded-md p-2 inline-flex items-center justify-center"
                  :class="[copiedAll ? 'bg-green-500 text-white hover:text-white hover:bg-green-500' : 'text-white bg-blue-400 hover:bg-blue-500']">
            <i class="fas fa-copy"></i>
            <span v-if="copiedAll" class="ml-2">Copied</span>
            <span v-else class="flex justify-between items-center ml-2">
              <span>Copy</span>
              <span class="hidden sm:block ml-1">
                {{ listFiltered.length > 1 ? 'all' : '' }} {{ listFiltered.length }} url{{ listFiltered.length > 1 ? 's' : '' }}
              </span>
            </span>
          </button>
          <button @click="openSelectedMarks" type="button" class="ml-3 rounded-md p-2 inline-flex items-center justify-center text-white bg-green-400 hover:bg-green-500">
            <i class="fas fa-external-link-alt"></i>
            <span class="flex justify-between items-center ml-2">
              Open
              <span class="hidden sm:block ml-1">
                {{ listFiltered.length > 1 ? 'all' : '' }} {{ listFiltered.length }} url{{ listFiltered.length > 1 ? 's' : '' }}
              </span>
            </span>
          </button>
          <button @click="clearSelectedMarks" type="button" class="ml-3 rounded-md p-2 inline-flex items-center justify-center text-white bg-red-400 hover:bg-red-500">
            <i class="fas fa-trash"></i>
            <span class="flex justify-between items-center ml-2">
              Clear
              <span class="hidden sm:block ml-1">
                {{ listFiltered.length > 1 ? 'all' : '' }} {{ listFiltered.length }} url{{ listFiltered.length > 1 ? 's' : '' }}
              </span>
            </span>
          </button>
          <div class="hidden sm:block">
            <custom-select
                v-if="settingsCategories.length > 1"
                :list="settingsCategoriesFilters"
                :value="categoryFilter"
                @change="changeCategoryFilter"
            />
          </div>
          <ul v-if="loaded" class="flex justify-end mr-3">
            <li @click="setType('row')" class="px-2 rounded-l-lg cursor-pointer" :class="[settings.type === 'row' ? 'bg-blue-400 hover:bg-blue-500 text-white' : 'hover:bg-gray-200 bg-white']">
              <i class="far fa-stream text-xl pt-1 mb-1 block" />
            </li>
            <li @click="setType('card')" class="px-2 cursor-pointer" :class="[settings.type === 'card' ? 'bg-blue-400 hover:bg-blue-500 text-white' : 'hover:bg-gray-200 bg-white']">
              <i class="far fa-th-large text-xl pt-1 mb-1 block" />
            </li>
            <li @click="setType('time')" class="px-2 rounded-r-lg cursor-pointer" :class="[settings.type === 'time' ? 'bg-blue-400 hover:bg-blue-500 text-white' : 'hover:bg-gray-200 bg-white']">
              <i class="far fa-clock text-xl pt-1 mb-1 block" />
            </li>
          </ul>
        </div>
        <div v-if="list.length" class="flex justify-center items-center mt-3 block sm:hidden">
          <custom-select
              v-if="settingsCategories.length > 1"
              :list="settingsCategoriesFilters"
              :value="categoryFilter"
              @change="changeCategoryFilter"
          />
        </div>
      </template>
    </div>
    <div class="overflow-auto" :class="[show !== 'list' ? 'h-[270px]' : 'h-[370px]']" :style="{ height: `${ scrollDesktopClass }px` }">
      <div class="2xl:container mx-auto">
        <div v-if="show === 'add'">
          <div v-if="!categoryAddMode && mark && loaded" class="grid grid-cols-1 gap-1 container m-auto px-3 pb-3">
            <component :is="`${type}View`" v-bind="mark" :settings="settings" class="pb-4" />
          </div>
          <div v-else-if="!categoryAddMode">
            <div v-if="loaded">
              <div v-if="marks && marks.length" class="grid grid-cols-1 lg:gap-3 gap-1 px-3 sm:grid-cols-3">
                <component :is="`${type === 'time' ? 'row' : type}View`"
                           v-for="(l, i) in marks"
                           :key="`mark-${i}`"
                           v-bind="l"
                           :can-edit="false"
                           :settings="settings"
                           :categories="settingsCategories"
                           @open="openMark"
                />
              </div>
              <div v-else class="flex items-center justify-center px-5 text-gray-400">
                <div class="relative flex flex-col p-4 text-gray-400 w-[380px] rounded">
                  <div class="relative flex flex-col font-bold text-xl border border-gray-200 border-dashed rounded cursor-pointer">
                    <div class="flex flex-col items-center justify-center py-10 text-center">
                      <p class="m-0">No preview available.</p>
                      <p class="mt-4">Open a tab and come back here to save it.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="flex items-center justify-center px-5 text-gray-400">
              Loading
            </div>
          </div>
        </div>
        <div v-if="show === 'list'" class="mt-4">
          <div v-if="type !== 'time'" class="grid grid-cols-1 2xl:gap-3 gap-1 px-3 2xl:grid-cols-3">
            <component :is="`${type}View`"
                       v-for="l in listFiltered"
                       :key="`mark-${type}-${l.id}`"
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
          <div v-else class="px-4">
            <template v-for="g in listFilteredGroupByDate" :key="g.date">
              <div class="2xl:pb-4 pb-2 2xl:px-4 px-2 2xl:my-4 my-2 bg-white rounded-md w-full bg-white">
                <div class="flex justify-between w-full pt-6 ">
                  <div class="font-extrabold text-2xl m-auto">{{ formatDate(g.date) }}</div>
                </div>
                <div class="overflow-x-auto mt-6">
                  <table class="table-auto border-collapse w-full">
                    <tbody class="text-sm font-normal text-gray-700">
                      <component :is="'timeView'"
                                 v-for="l in g.list"
                                 :key="`mark-${type}-${l.id}`"
                                 v-bind="l"
                                 can-edit
                                 :settings="settings"
                                 :categories="settingsCategories"
                                 @open="openMark"
                                 @remove="removeMark"
                                 @change="changeMark"
                                 @tag="toggleTag"
                      />
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </div>
          <div v-if="!listFiltered.length" class="flex items-center justify-center px-5 text-gray-400">
            <div class="relative flex flex-col p-4 text-gray-400 w-[380px] rounded">
              <div class="relative flex flex-col font-bold text-xl border border-gray-200 border-dashed rounded cursor-pointer">
                <div class="flex flex-col items-center justify-center py-10 text-center">
                  <p class="m-0" v-if="list.length">Nothing found.</p>
                  <p class="m-0" v-else>Nothing found yet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
         min-h-[600px]
}
</style>

