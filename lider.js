import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { executablePath } from 'puppeteer'

// Configura puppeteer-extra con el plugin stealth
puppeteer.use(StealthPlugin())

// Función para generar delays aleatorios
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function getDataFromPage() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: executablePath(), // Usa la versión de Chromium que viene con puppeteer
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled'
    ],
  })

  const page = await browser.newPage()

  // Configuración de headers y user-agent
  await page.setExtraHTTPHeaders({
    'accept-language': 'es-ES,esq=0.9',
    'sec-ch-ua': '"Google Chrome"v="119", "Chromium"v="119", "Not?A_Brand"v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'upgrade-insecure-requests': '1'
  })

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36')

  // Ocultar que es un navegador automatizado
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    })
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    })
    Object.defineProperty(navigator, 'languages', {
      get: () => ['es-ES', 'es'],
    })
  })

  // Interceptar requests para bloquear recursos innecesarios
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    const url = request.url()
    const resourceType = request.resourceType()

    // Bloquear ciertos recursos
    if (
      resourceType === 'image' || 
      resourceType === 'stylesheet' || 
      resourceType === 'font' ||
      url.includes('analytics') ||
      url.includes('google') ||
      url.includes('facebook') ||
      url.includes('doubleclick') ||
      url.includes('adservice') ||
      url.includes('track') ||
      url.includes('tagmanager')
    ) {
      request.abort()
    } else {
      request.continue()
    }
  })

  try {
    // Navegar a la página con comportamiento humano simulado
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false })
    
    // Movimientos aleatorios del mouse antes de la navegación
    await page.mouse.move(randomDelay(100, 500), randomDelay(100, 300))
    await new Promise(resolve => setTimeout(resolve, randomDelay(500, 2000)))
    
    await page.goto('https://www.lider.cl/supermercado', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })

    // Esperar aleatoriamente y hacer scroll
    await new Promise(resolve => setTimeout(resolve, randomDelay(2000, 5000)))
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight / 2)
    })
    await new Promise(resolve => setTimeout(resolve, randomDelay(1000, 3000)))

    // Esperar al buscador y simular escritura humana
    await page.waitForSelector('.ais-SearchBox-input', { visible: true, timeout: 30000 })
    await page.type('.ais-SearchBox-input', 'atun lomitos', { delay: randomDelay(50, 150) })
    await new Promise(resolve => setTimeout(resolve, randomDelay(500, 1500)))
    await page.keyboard.press('Enter')

    // Esperar resultados con timeout largo
    await page.waitForSelector('li.ais-Hits-item', { visible: true, timeout: 30000 })
    await new Promise(resolve => setTimeout(resolve, randomDelay(3000, 8000)))

    // Hacer scroll para cargar posibles lazy-loading
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0
        const distance = 100
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight
          window.scrollBy(0, distance)
          totalHeight += distance
          if (totalHeight >= scrollHeight) {
            clearInterval(timer)
            resolve()
          }
        }, 100)
      })
    })

    // Tomar screenshot para debug
    await page.screenshot({path: 'lider_results.png'})

    // Extraer datos de productos
    const products = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('li.ais-Hits-item'))
      return items.map(item => {
        try {
          const anchor = item.querySelector('a[data-testid="product-card-nav-test-id"]')
          const productUrl = anchor ? `https://www.lider.cl${anchor.getAttribute('href')}` : ''

          const brandElement = item.querySelector('h2.product-description span:nth-child(1)')
          const nameElement = item.querySelector('h2.product-description span:nth-child(2)')

          const brand = brandElement ? brandElement.innerText.trim() : ''
          const name = nameElement ? nameElement.innerText.trim() : ''

          const currentPriceText = item.querySelector('.product-card__sale-price span')?.innerText.replace(/\$/g, '').replace(/\./g, '').replace('x', '')?.trim() || '0'
          const oldPriceText = item.querySelector('.regular-unit-price__price-product-card span')?.innerText.replace(/\$/g, '').replace(/\./g, '').trim() || currentPriceText

          const imageElement = item.querySelector('img#lazy-img')
          const imageUrl = imageElement ? imageElement.getAttribute('src') : ''

          const flagElement = item.querySelector('span[data-testid="attribute-tag-test-id"]')
          const flag = flagElement ? flagElement.innerText.trim() : ''

          const productId = item.querySelector('.product-card__image-area')?.id || ''

          return {
            id: productId,
            name: name,
            brand: brand,
            currentPrice: parseInt(currentPriceText),
            originalPrice: parseInt(oldPriceText),
            discount: oldPriceText !== currentPriceText ?
              Math.round((1 - (parseInt(currentPriceText) / parseInt(oldPriceText))) * 100) + '%' : '0%',
            pricePerUnit: '',
            promotion: '', 
            imageUrl,
            productUrl,
            flag,
            rating: 'Sin calificación', 
            supermarket: 'Lider',
            timestamp: new Date().toISOString()
          }
        } catch (error) {
          console.error('Error procesando producto:', error)
          return null
        }
      }).filter(product => product !== null)
    })

    console.log(products)
    console.log(`Se encontraron ${products.length} productos`)

  } catch (error) {
    console.error('Error durante el scraping:', error)
    await page.screenshot({path: 'error.png'})
  } finally {
    await browser.close()
  }
}

getDataFromPage()