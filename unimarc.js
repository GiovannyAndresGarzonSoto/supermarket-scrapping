import puppeteer from 'puppeteer'

async function handleDynamicWebPage() {
    const browser = await puppeteer.launch({
        headless: 'new',
    })
    const page = await browser.newPage()
    
    await page.setViewport({ width: 1280, height: 800 })    
    try {
        await page.goto('https://www.unimarc.cl/', { waitUntil: 'networkidle2' })        
        await page.type('#search-header__input', 'atun lomitos')
        await new Promise(resolve => setTimeout(resolve, 12000))
        await page.screenshot({path: 'example.png'})
        const productData = await page.evaluate(() => {
            const products = Array.from(document.querySelectorAll('.ab__shelves'))
            return products.map(product => {
              const name = product.querySelector('.Shelf_nameProduct__CXI5M')?.textContent.trim() || 'Sin nombre'
              const brand = product.querySelector('.Shelf_brandText__sGfsS')?.textContent.trim() || 'Sin marca'
              const currentPriceElement = product.querySelector('[id^="listPrice__offerPrice--discountprice"]') || 
                                        product.querySelector('.Text_text--xl__l05SR')
              const currentPrice = currentPriceElement?.textContent.trim().replace(/\D/g, '') || '0'
              const originalPriceElement = product.querySelector('[id^="listPrice__offerPrice--listprice"]') || 
                                          product.querySelector('.Text_text--line-through__1V_2e')
              const originalPrice = originalPriceElement?.textContent.trim().replace(/\D/g, '') || currentPrice
              const discountElement = product.querySelector('.OfferLabel_offerLabel__WrBKB') || 
                                     product.querySelector('[class*="discount"]')
              const discount = discountElement?.textContent.trim() || '0%'
              const pricePerUnitElement = product.querySelector('.ListPrice_listPrice__mdFUB p')
              const pricePerUnit = pricePerUnitElement?.textContent.trim() || ''              
              const promotionElement = product.querySelector('[id^="listPrice__membershipDiscountPrice"]')
              const promotion = promotionElement?.textContent.trim() || ''
              const imageUrl = product.querySelector('img[src*=".jpg"], img[src*=".png"]')?.src || ''
              const productUrl = product.querySelector('a[href^="/product/"]')?.href || ''
        
              return {
                name,
                brand,
                currentPrice: parseInt(currentPrice),
                originalPrice: parseInt(originalPrice),
                discount,
                pricePerUnit,
                promotion,
                imageUrl,
                productUrl: productUrl.includes('http') ? productUrl : `https://www.unimarc.cl${productUrl}`,
                flag: product.querySelector('.Chip_chipMemberchip__Y23ai')?.textContent.trim() || '',
                rating: 'Sin calificación',
                supermarket: 'Unimarc',
                timestamp: new Date().toISOString(),
              }
            })
          })
        
          console.log(productData)
    } catch (error) {
        console.log('Error durante el scraping:', error)
    } finally {
        await browser.close()
    }
}

handleDynamicWebPage()