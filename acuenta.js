import puppeteer from 'puppeteer'

async function getDataFromAcuenta() {
    const browser = await puppeteer.launch({
        headless: 'new',
    })
    const page = await browser.newPage()
    
    await page.setViewport({ width: 1280, height: 800 })
    
    try {
        await page.goto('https://www.acuenta.cl/store/580__843/xlarge', { waitUntil: 'networkidle2' })
        await page.waitForSelector('.ant-input', { visible: true })
        await page.type('.ant-input', 'atun lomitos')
        await page.keyboard.press('Enter')
        await page.waitForSelector('[data-dtname]', { timeout: 10000 })
        await new Promise(resolve => setTimeout(resolve, 8000)) 

        const products = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.card-product-vertical'))
            return items.map(item => {
                try {
                    const cartQuantifier = item.querySelector('[data-dtname]')
                    const id = cartQuantifier ? cartQuantifier.getAttribute('data-dtname') : ''
                    
                    const nameElement = item.querySelector('.prod__name')
                    const name = nameElement ? nameElement.textContent.trim() : ''
                    
                    const priceElement = item.querySelector('.base__price')
                    const priceText = priceElement ? priceElement.textContent.trim().replace('$', '').replace(/\./g, '') : '0'
                    const currentPrice = parseInt(priceText) || 0
                    
                    const pricePerUnitElement = item.querySelector('.MlrBO span')
                    const pricePerUnit = pricePerUnitElement ? pricePerUnitElement.textContent.trim() : ''
                    
                    const promoElement = item.querySelector('.prod__n-per-price__text')
                    const promotion = promoElement ? promoElement.textContent.trim() : ''
                    
                    const imageElement = item.querySelector('.ant-image-img')
                    let imageUrl = imageElement ? imageElement.src : ''
                    if (imageUrl && imageUrl.includes('160x160')) {
                        imageUrl = imageUrl.replace('160x160', '500x500')
                    }
                    
                    let originalPrice = currentPrice
                    let discount = '0%'
                    
                    if (promotion.includes('X $')) {
                        const [quantity, promoPrice] = promotion.split('X $')
                        const promoPriceNum = parseInt(promoPrice.replace(/\./g, '')) / parseInt(quantity.trim())
                        originalPrice = Math.round(promoPriceNum)
                        discount = Math.round((1 - (currentPrice / originalPrice)) * 100) + '%'
                    }
                    
                    const brand = name.split(' ')[0] || ''
                    
                    return {
                        id,
                        name,
                        brand,
                        currentPrice,
                        originalPrice,
                        discount,
                        pricePerUnit,
                        promotion,
                        imageUrl,
                        productUrl: id ? `https://www.acuenta.cl/product/${id}` : '',
                        flag: '', // Acuenta no muestra flags
                        rating: 'Sin calificación', // Acuenta no muestra ratings
                        supermarket: 'Acuenta',
                        timestamp: new Date().toISOString()
                    }
                } catch (error) {
                    console.error('Error procesando producto:', error)
                    return null
                }
            }).filter(product => product !== null && product.id)
        })

        console.log(products)
        
    } catch (error) {
        console.log('Error durante el scraping:', error)
    } finally {
        await browser.close()
    }
}

getDataFromAcuenta()