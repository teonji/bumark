const dayjs = require('dayjs')

const get = async (name, defaultValue = null) => {
  const storage = await chrome.storage.sync.get(name)
  return storage[name] || defaultValue
}

const closeTabs = async tabs => tabs.forEach(tab => chrome.tabs.remove(tab.id))

const fetchTabData = async (tab, tag, category, notes) => {
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const _getDomQuery = (selectors, name) => {
          const data = document.querySelector(selectors)
          return data ? data.getAttribute(name) : null
        }
        const getDomQueries = rules => {
          const resolved = rules.map(rule => _getDomQuery(rule[0], rule[1])).filter(f => !!f)
          return resolved && resolved.length > 0 ? resolved[0] : null
        }
        const fixImageUrl = (img, base, url) => {
          if (img) {
            if (img.startsWith('//')) {
              img = `https:${img}`
            } else if (img.startsWith('/')) {
              img = `${base || url}${img}`
            } else if (!img.startsWith('http')) {
              img = `${base || url}${img}`
            }
          }
          return img
        }

        const hostSplit = document.location.hostname.split('.')
        const provider = hostSplit[hostSplit.length - 2] !== 'co' ? hostSplit[hostSplit.length - 2] : hostSplit[hostSplit.length - 3]

        const url = `${window.location.origin}/`

        let title = null
        try {
          const titleOgDataUrl = getDomQueries([
            ["meta[property='og:title']", "content"],
            ["meta[name='twitter:title']", "content"],
            ["meta[name='title']", "content"]
          ])
          title = document.title || titleOgDataUrl || location.hostname
        } catch (e) {
          console.log('Error getting title', e)
        }
        let description = null
        try {
          description = getDomQueries([
            ["meta[property='og:description']", "content"],
            ["meta[name='twitter:description']", "content"],
            ["meta[name='description']", "content"],
          ])
        } catch (e) {
          console.log('Error getting description', e)
        }

        let image = null
        let icon = null
        try {
          const baseData = document.querySelector("base")
          const base = baseData ? baseData.getAttribute("href") : ''

          image = getDomQueries([
            ["meta[name='twitter:image']", "content"],
            ["meta[property='og:image']", "content"],
          ])
          image = fixImageUrl(image, base, url)

          icon = getDomQueries([
            ["meta[itemprop='image']", "content"],
            ["link[rel='apple-touch-icon-precomposed']", "href"],
            ["link[rel='apple-touch-icon']", "href"],
            ["link[rel='shortcut icon']", "href"],
            ["link[rel='icon']", "href"],
          ])
          icon = fixImageUrl(icon, base, url)
        } catch (e) {
          console.log('Error getting images', e)
        }

        return {
          title,
          url,
          description,
          icon,
          image,
          provider,
        }
      }
    })
    const metadata = res[0].result
    metadata.id = `bumark_${crypto.randomUUID()}`
    metadata.category = category
    metadata.notes = notes
    metadata.date = dayjs().format('YYYY-MM-DD HH:mm')
    metadata.tags = [tag, metadata.provider, dayjs().format('DD MMM YYYY')].filter(f => !!f)
    return metadata
  } catch (e) {
    return null
  }
}

const updateBadge = async text => {
  try {
    await chrome.action.setBadgeText({ text: text || '' })
    await chrome.action.setBadgeBackgroundColor({ color: 'blue' })
  } catch (e) {
    return e.message
  }
}

const removeMark = async id => {
  try {
    await chrome.storage.sync.remove(id)
    const list = await getBumarksList()
    await updateBadge(list.length ? list.length.toString() : null)
    return list
  } catch (e) {
    return null
  }
}

const fetchTabsData = async (tabs, tag, category, notes) => {
  const data = tabs.map(t => fetchTabData(t, tag, category, notes))
  return Promise.all(data)
}

const closeAndSaveTabs = async (tabs, tag, category, notes) => {
  let list
  const settings = get( 'settings', {})
  try {
    const listData = await fetchTabsData(tabs, tag, category, notes)
    if (!listData.length) {
      list = 'ERROR_NOTHING'
    } else {
      const tabsIndex = listData.map((k, i) => k ? i : null).filter(f => f !== null)
      const tabsWithData = tabsIndex.map(i => tabs[i])
      list = await addMarks(listData.filter(f => f !== null))
      if (Array.isArray(list) && tabsWithData.length) {
        await closeTabs(tabsWithData)
      }
      if (settings.category !== category) {
        await chrome.storage.sync.set({ settings: { ...settings, category } })
      }
    }
    return list
  } catch (e) {
    return null
  }
}

const clearSelectedMarks = async marks => {
  try {
    await chrome.storage.sync.remove(marks)
    const list = await getBumarksList()
    await updateBadge(list.length ? list.length.toString() : null)
    return list
  } catch (e) {
    return null
  }
}

const getTabs = async (active = true, currentWindow = true) => {
  let queryOptions = {
    ...(active ? { active: true} : null ),
    ...(currentWindow ? { currentWindow: true } : null),
  }
  return chrome.tabs.query(queryOptions)
}

const addCategory = async category => {
  const storage = await chrome.storage.sync.get(['categories'])
  let categories = storage.categories || []
  categories.push(category)
  await chrome.storage.sync.set({ categories })
  return categories
}

const removeCategory = async id => {
  let categories = await get('categories', [])
  categories = categories.filter(cat => cat.id !== id) || []

  const bumarksToUpdate = await getBumarksList()
                    .filter(f => f.category === id)
                    .map(b => {
                      if (b.category === id) {
                        b.category = null
                      }
                      return b
                    })
                    .reduce((acc, cur) => {
                      acc[cur.id] = cur
                      return acc
                    }, {})
  await chrome.storage.sync.set({ categories, ...bumarksToUpdate })

  const list = await getBumarksList()
  return {
    categories,
    list,
  }
}

const getBumarksList = async () => {
  const storage = await chrome.storage.sync.get()
  const list = Object.keys(storage).filter(s => s.startsWith('bumark_')).map(s => storage[s])
  return list.sort((a, b) => {
    const aDate = dayjs(a.date)
    const bDate = dayjs(b.date)
    if (aDate > bDate) {
      return -1
    }
    if (aDate < bDate) {
      return 1
    }
    return 0
  })
}

const getMark = async id => {
  const storage = await chrome.storage.sync.get(id)
  return storage[id] || null
}

const addMarks = async (marks = []) => {
  try {
    const toAdd = {}
    marks.forEach(mark => {
      toAdd[mark.id] = mark
    })
    await chrome.storage.sync.set(toAdd)
    const list = await getBumarksList()
    await updateBadge(list.length ? list.length.toString() : null)
    return list
  } catch (e) {
    return null
  }
}

const editMark = async (id, name, value) => {
  try {
    const mark = await getMark(id)
    mark[name] = value
    await chrome.storage.sync.set({ [id]: mark })
    return getBumarksList()
  } catch (e) {
    return null
  }
}

const arrayEquals = (a, b) => Array.isArray(a) &&
  Array.isArray(b) &&
  a.length === b.length &&
  a.sort().every((val, index) => val === b.sort()[index])

browser.runtime.onMessage.addListener(async request => {
  switch (request.type) {
    case 'closeCurrentTab': {
      const currentTabs = await getTabs(true, true)
      return closeAndSaveTabs(currentTabs, request.tag, request.category, request.notes)
    }
    case 'closeAllTabs': {
      const allTabs = await getTabs(false, true)
      return closeAndSaveTabs(allTabs, request.tag, request.category, request.notes)
    }
    case 'clearSelectedMarks': {
      return clearSelectedMarks(request.list)
    }
    case 'openSelectedMarks': {
      const links = (request.links || []).map(link => chrome.tabs.create({ url: link }))
      await Promise.all(links)
      return true
    }
    case 'openMark': {
      await chrome.tabs.create({ url: request.link })
      return true
    }
    case 'removeMark': {
      return removeMark(request.id)
    }
    case 'changeMark': {
      return editMark(request.id, request.name, request.value)
    }
    case 'previewMark': {
      const activeTabs = await getTabs(true, true)
      const actual = await fetchTabData(activeTabs[0], null, null, null)
      const allTabs = await getTabs(false, true)
      const list = await fetchTabsData(allTabs, null, null, null)
       return {
        actual,
        list: list.filter(f => f !== null),
      }
    }
    case 'addCategory': {
      return addCategory(request.category)
    }
    case 'removeCategory': {
      return removeCategory(request.id)
    }
    case 'getInitialStorage': {
      const storage = await chrome.storage.sync.get(['settings', 'categories'])
      const bumarks = await getBumarksList()
      const settings = storage.settings || {}
      const categories = storage.categories || []
      if (!arrayEquals(Object.keys(request.defaultSettings), Object.keys(settings))) {
        const newSett = { ...request.defaultSettings, ...settings }
        Object.keys(newSett).forEach(k => settings[k] = newSett[k])
        await chrome.storage.sync.set({ settings })
      }
      await updateBadge(bumarks.length ? bumarks.length.toString() : null)
      return {
        bumarks,
        settings,
        categories,
      }
    }
    case 'openOptions': {
      const url = await chrome.runtime.getURL('popup.html?show=list')
      await chrome.tabs.create({ url })
      return true
    }
    default: {
      return true
    }
  }
})
