/**
 * KamiWatch — Seanime-Compatible Plugin & Extension Engine
 * Loads and executes Seanime/KamiWatch extensions (.json files with JS Provider payload)
 * in a secure Node VM sandbox.
 */

const fs = require('fs')
const path = require('path')
const vm = require('vm')
const http = require('http')
const https = require('https')
const { app } = require('electron')

class ExtensionRunner {
  constructor() {
    /** @type {Map<string, { manifest: object, provider: object }>} */
    this.extensions = new Map()
  }

  /**
   * Minimal fetch polyfill for VM sandbox supporting custom headers & timeout
   */
  _createSandbox() {
    const sandboxFetch = (url, options = {}) => {
      return new Promise((resolve, reject) => {
        try {
          const urlObj = new URL(url)
          const isHttps = urlObj.protocol === 'https:'
          const lib = isHttps ? https : http
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            ...(options.headers || {}),
          }

          const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers,
          }

          const req = lib.request(reqOptions, (res) => {
            let data = ''
            res.on('data', chunk => { data += chunk })
            res.on('end', () => {
              resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                headers: res.headers,
                text: () => Promise.resolve(data),
                json: () => Promise.resolve(JSON.parse(data)),
              })
            })
          })

          req.on('error', reject)
          if (options.timeout) req.setTimeout(options.timeout, () => { req.destroy(); reject(new Error('Fetch timeout')) })
          if (options.body) req.write(options.body)
          req.end()
        } catch (e) {
          reject(e)
        }
      })
    }

    const memoryStore = new Map()
    const sandboxStore = {
      get: (key) => memoryStore.get(key),
      set: (key, val) => memoryStore.set(key, val),
    }

    return {
      fetch: sandboxFetch,
      $store: sandboxStore,
      $scannerUtils: {
        normalizeTitle: (title) => ({ season: 1, part: 1 }),
        buildSmartSearchTitles: (raw) => ({ season: 1, part: 1, titles: raw }),
      },
      LoadDoc: (html) => {
        // Minimal DOM query helper matching Cheerio / jQuery regex extraction
        return (selector) => ({
          first: () => ({
            attr: (attrName) => {
              const regex = new RegExp(`${attrName}=["']([^"']+)["']`, 'i')
              const match = html.match(regex)
              return match ? match[1] : ''
            },
            text: () => html.replace(/<[^>]+>/g, '').trim(),
          }),
          each: (cb) => {},
          length: () => 0,
        })
      },
      console: {
        log: (...args) => console.log('[Seanime Plugin]', ...args),
        error: (...args) => console.error('[Seanime Plugin]', ...args),
        warn: (...args) => console.warn('[Seanime Plugin]', ...args),
      },
      module: { exports: {} },
      exports: {},
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      JSON,
      URL,
      URLSearchParams,
      RegExp,
      Array,
      Object,
      String,
      Number,
      Math,
      Date,
      Promise,
      Error,
      parseInt,
      parseFloat,
      decodeURIComponent,
      encodeURIComponent,
      atob: (s) => Buffer.from(s, 'base64').toString('binary'),
      btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    }
  }

  /**
   * Load Seanime JSON Extension File containing `payload` (JS class Provider)
   */
  async loadExtensionFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return { success: false, error: 'File not found' }
      const content = fs.readFileSync(filePath, 'utf8')
      const json = JSON.parse(content)
      const id = json.id || path.basename(filePath, '.json')

      if (!json.payload) {
        return { success: false, error: 'JSON extension missing payload' }
      }

      const sandbox = this._createSandbox()
      const scriptCode = `
        ${json.payload}
        if (typeof Provider !== 'undefined') {
          module.exports = new Provider();
        }
      `
      const script = new vm.Script(scriptCode)
      const context = vm.createContext(sandbox)
      script.runInContext(context, { timeout: 10000 })

      const provider = sandbox.module.exports
      this.extensions.set(id, {
        manifest: {
          id,
          name: json.name || id,
          version: json.version || '1.0.0',
          type: json.type || 'plugin',
          description: json.description || '',
          author: json.author || 'Community',
          icon: json.icon || '',
          language: json.language || 'javascript',
          lang: json.lang || 'en',
        },
        provider,
      })

      console.log(`[ExtensionRunner] Loaded Seanime extension: ${json.name} (${id})`)
      return { success: true, manifest: this.extensions.get(id).manifest }
    } catch (e) {
      console.error(`[ExtensionRunner] Error loading ${filePath}:`, e.message)
      return { success: false, error: e.message }
    }
  }

  /**
   * Automatically scan user's local Seanime extensions folder & KamiWatch extensions folder
   */
  async autoScanAndLoad() {
    const searchDirs = [
      path.join(__dirname, '..', 'public', 'extensions'),
      path.join(app.getPath('userData'), 'extensions'),
      path.join(process.env.APPDATA || '', 'Seanime', 'extensions'),
      path.join(process.env.APPDATA || '', 'KamiWatch', 'extensions'),
    ]

    for (const dir of searchDirs) {
      try {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
          for (const file of files) {
            await this.loadExtensionFile(path.join(dir, file))
          }
        }
      } catch (e) {
        console.error(`[ExtensionRunner] Scan dir error ${dir}:`, e.message)
      }
    }
  }

  /**
   * Call a provider method (search, findChapters, findChapterPages, findEpisodes, findEpisodeServer)
   */
  async callProvider(id, method, ...args) {
    const ext = this.extensions.get(id)
    if (!ext || !ext.provider) return { error: `Extension "${id}" is not loaded or active` }

    const fn = ext.provider[method]
    if (typeof fn !== 'function') return { error: `Method "${method}" not found in provider "${id}"` }

    try {
      const result = await Promise.race([
        fn.apply(ext.provider, args),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Extension execution timeout after 25s')), 25000)),
      ])
      return { result }
    } catch (e) {
      console.error(`[ExtensionRunner] Error calling ${method} on ${id}:`, e.message)
      return { error: e.message }
    }
  }

  /**
   * Get list of all loaded active extensions
   */
  getLoadedExtensions() {
    const list = []
    for (const [id, ext] of this.extensions.entries()) {
      list.push({ id, manifest: ext.manifest, active: true })
    }
    return list
  }
}

module.exports = new ExtensionRunner()
