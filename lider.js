import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { executablePath } from 'puppeteer'

puppeteer.use(StealthPlugin())

async function scrapeLider(searchTerm = 'atún lomitos') {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: executablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    await page.setViewport({ width: 1280, height: 800 })

    await page.goto(`https://www.lider.cl/supermercado/search?query=${encodeURIComponent(searchTerm)}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    await new Promise(resolve => setTimeout(resolve, 20000))

    const products = await page.evaluate(() => {
      const cleanPrice = (text) => parseInt(text?.replace(/[^\d]/g, '') || '0')

      return Array.from(document.querySelectorAll('li.ais-Hits-item')).map(item => {
        try {
          const anchor = item.querySelector('a[data-testid="product-card-nav-test-id"]')
          const productUrl = anchor ? `https://www.lider.cl${anchor.getAttribute('href')}` : ''
          
          const brand = item.querySelector('h2.product-description span:first-child')?.textContent?.trim() || ''
          const name = item.querySelector('h2.product-description span:last-child')?.textContent?.trim() || ''

          const priceText = item.querySelector('.product-card__sale-price span')?.textContent || ''
          const originalPriceText = item.querySelector('.regular-unit-price__price-product-card span')?.textContent || priceText
          
          const currentPrice = cleanPrice(priceText.split('x').pop())
          const originalPrice = cleanPrice(originalPriceText)

          const imageElement = item.querySelector('img#lazy-img')
          const imageUrl = imageElement?.src || imageElement?.getAttribute('data-src') || ''

          return {
            id: item.querySelector('.product-card__image-area')?.id || '',
            name,
            brand,
            currentPrice,
            originalPrice,
            discount: originalPrice > currentPrice 
              ? `${Math.round((1 - (currentPrice / originalPrice)) * 100)}%` 
              : '0%',
            pricePerUnit: item.querySelector('.regular-unit-price__price-product-card')?.textContent?.replace('Regular:', '').trim() || '',
            promotion: item.querySelector('[data-testid="attribute-tag-test-id"]')?.textContent?.trim() || '',
            imageUrl,
            productUrl,
            flag: '',
            rating: 'Sin calificación',
            supermarket: 'Lider',
            timestamp: new Date().toISOString()
          }
        } catch (error) {
          console.error('Error procesando producto:', error)
          return null
        }
      })
    })

    console.log(`Encontrados ${products.length} productos`)
    return products

  } catch (error) {
    console.error('Error en el scraping:', error)
    return []
  } finally {
    await browser.close()
  }
}

// Ejemplo de uso
scrapeLider().then(results => {
  console.log('Resultados:', results)
})