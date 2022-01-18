const dayjs = require('dayjs')

const closeTabs = async tabs => tabs.forEach(tab => chrome.tabs.remove(tab.id))

const fetchTabData = async (tab, tag, settings) => {
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const hostSplit = document.location.hostname.split('.')
        const provider = hostSplit[hostSplit.length - 2]

        let title = null
        try {
          const titleOgData = document.querySelector("meta[property='og:title']")
          const titleOgDataUrl = titleOgData ? titleOgData.getAttribute("content") : null
          title = document.title || titleOgDataUrl || location.hostname
        } catch (e) {
          console.log('Error getting title', e)
        }

        let description = null
        try {
          const descriptionData = document.querySelector("meta[name='description']")
          const descriptionOgData = document.querySelector("meta[property='og:image']")
          const descriptionDataUrl = descriptionData ? descriptionData.getAttribute("content") : null
          const descriptionOgDataUrl = descriptionOgData ? descriptionOgData.getAttribute("content") : null
          description = descriptionDataUrl || descriptionOgDataUrl
        } catch (e) {
          console.log('Error getting description', e)
        }

        let image = null
        let icon = null
        try {
          const imageData = document.querySelector("meta[property='og:image']")
          image = imageData ? imageData.getAttribute("content") : null

          const iconData = document.querySelector("link[rel='icon']")
          icon = iconData ? iconData.getAttribute("href") : null
        } catch (e) {
          console.log('Error getting images', e)
        }

        return {
          title,
          url: document.location.href,
          description,
          icon,
          image,
          provider,
        }
      }
    })
    const metadata = res[0].result
    metadata.id = crypto.randomUUID()
    metadata.date = dayjs().format('YYYY-MM-DD hh:mm')
    metadata.tags = [tag, metadata.provider, dayjs().format(settings.dateFormat)].filter(f => !!f)
    return metadata
  } catch (e) {
    return null
  }
}

const updateList = async (listData, settings) => {
  const storage = await chrome.storage.sync.get(['bumarks'])
  let bumarks = storage.bumarks || []
  listData.forEach(data => bumarks.unshift(data))
  if (bumarks.length > settings.max) {
    return 'ERROR_MAX'
  } else {
    await updateBadge(bumarks.length ? bumarks.length.toString() : null, settings)
    await chrome.storage.sync.set({ bumarks })
    return bumarks
  }
}

const updateBadge = async (text, settings) => {
  try {
    await chrome.action.setBadgeText({ text: text || '' })
    const val = text ? parseInt(text) : 0
    if (settings.max && val === settings.max) {
      await chrome.action.setBadgeBackgroundColor({ color: '#f00' })
    } else {
      await chrome.action.setBadgeBackgroundColor({ color: 'green' })
    }
  } catch (e) {
    return e.message
  }
}

const removeFromList = async id => {
  const storage = await chrome.storage.sync.get(['bumarks'])
  let bumarks = (storage.bumarks || []).filter(f => f.id !== id)
  await chrome.storage.sync.set({ bumarks })
  return bumarks
}

const closeAndSaveTabs = async (tabs, tag, settings) => {
  const data = tabs.map(t => fetchTabData(t, tag, settings))
  const resolvedData = await Promise.all(data)
  const listData = resolvedData.filter(f => !!f)
  let list = await updateList(listData, settings)
  if (Array.isArray(list)) {
    await closeTabs(tabs)
  }
  if (!listData.length) {
    list = 'ERROR_NOTHING'
  }
  return list
}

const getTabs = async (active = true, currentWindow = true) => {
  let queryOptions = {
    ...(active ? { active: true} : null ),
    ...(currentWindow ? { currentWindow: true } : null),
  }
  return chrome.tabs.query(queryOptions)
}

const arrayEquals = (a, b) => Array.isArray(a) &&
  Array.isArray(b) &&
  a.length === b.length &&
  a.every((val, index) => val === b[index])

browser.runtime.onMessage.addListener(async request => {
  switch (request.type) {
    case 'closeCurrentTab': {
      const currentTabs = await getTabs(true, true)
      return closeAndSaveTabs(currentTabs, request.tag, request.settings)
    }
    case 'closeAllTabs': {
      const allTabs = await getTabs(false, true)
      return closeAndSaveTabs(allTabs, request.tag, request.settings)
    }
    case 'clearMarks': {
      await chrome.storage.sync.set({ bumarks: [] })
      await updateBadge(null, request.settings)
      return []
    }
    case 'openAllMarks': {
      const links = (request.links || []).map(link => chrome.tabs.create({ url: link }))
      await Promise.all(links)
      return true
    }
    case 'openMark': {
      await chrome.tabs.create({ url: request.link })
      return true
    }
    case 'removeMark': {
      const list = await removeFromList(request.id)
      await updateBadge(list.length ? list.length.toString() : null, request.settings)
      return list
    }
    case 'previewMark': {
      const tabs = await getTabs(true, true)
      return fetchTabData(tabs[0], null, request.settings)
    }
    case 'getInitialStorage': {
      const storage = await chrome.storage.sync.get(['bumarks', 'settings'])
      const bumarks = storage.bumarks || []
      const settings = storage.settings || {}
      if (!arrayEquals(Object.keys(request.settings), Object.keys(settings))) {
        const newSett = { ...request.defaultSettings, ...settings }
        Object.keys(newSett).forEach(k => settings[k] = newSett[k])
        await chrome.storage.sync.set({ settings })
      }
      await updateBadge(bumarks.length ? bumarks.length.toString() : null, request.settings)
      return {
        bumarks,
        settings,
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
