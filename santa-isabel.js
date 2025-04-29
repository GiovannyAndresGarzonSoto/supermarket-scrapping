import puppeteer from 'puppeteer'

async function getDataFromPage() {
    const browser = await puppeteer.launch({
        headless: 'new',
    })
    const page = await browser.newPage()
    
    await page.setViewport({ width: 1280, height: 800 })
    await page.goto('https://www.santaisabel.cl/', { waitUntil: 'networkidle2' })     
    await page.waitForSelector('.new-header-search-input', { visible: true })
    await page.type('.new-header-search-input', 'atun lomitos')
    await page.click('.new-header-search-submit')
    await new Promise(resolve => setTimeout(resolve, 4000))    
    try{
        const products = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.product-card'))
            return items.map(item => {
              try {
                const name = item.querySelector('.product-card-name')?.innerText.trim() || ''
                const brand = item.querySelector('.product-card-brand')?.innerText.trim() || ''
                const productUrl = item.getAttribute('href') ? `https://www.santaisabel.cl${item.getAttribute('href')}` : ''
                
                const currentPriceText = item.querySelector('.prices-main-price')?.innerText.trim().replace('$', '').replace('.', '') || '0'
                const oldPriceText = item.querySelector('.prices-old-price')?.innerText.trim().replace('$', '').replace('.', '') || currentPriceText
                const pricePerUnit = item.querySelector('.area-measurement-unit')?.innerText.trim() || ''
                
                const promotion = item.querySelector('.area-promo-tmp')?.innerText.trim() || ''
                
                const imageElement = item.querySelector('.lazy-image')
                const imageUrl = imageElement ? imageElement.src.replace('-280-280', '-500-500') : ''
                
                const flag = item.querySelector('.flag-text')?.innerText.trim() || ''
                
                const ratingElement = item.querySelector('.average-quantity')
                const rating = ratingElement ? ratingElement.innerText.trim() : 'Sin calificación'
                const hasRating = ratingElement?.innerText.trim() !== 'Producto sin calificar'
                
                const productWrap = item.querySelector('.product-card-wrap')
                const productId = productWrap?.getAttribute('data-cnstrc-item-id') || ''
                const originalName = productWrap?.getAttribute('data-cnstrc-item-name') || name
                
                return {
                  id: productId,
                  name: originalName,
                  brand,
                  currentPrice: parseInt(currentPriceText),
                  originalPrice: parseInt(oldPriceText),
                  discount: oldPriceText !== currentPriceText ? 
                    Math.round((1 - (parseInt(currentPriceText) / parseInt(oldPriceText))) * 100) + '%' : '0%',
                  pricePerUnit,
                  promotion,
                  imageUrl,
                  productUrl,
                  flag,
                  rating: hasRating ? rating : 'Sin calificación',
                  supermarket: 'Santa Isabel',
                  timestamp: new Date().toISOString()
                }
              } catch (error) {
                console.error('Error procesando producto:', error)
                return null
              }
            }).filter(product => product !== null)
          })
        
        console.log(products)
    } catch (error) {
        console.log('Error durante el scraping:', error)
    } finally {
        await browser.close()
    }
}

getDataFromPage()