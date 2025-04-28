import puppeteer from 'puppeteer'

async function getDataFromPage() {
    const browser = await puppeteer.launch({
        headless: 'new',
    })
    const page = await browser.newPage()

    await page.setViewport({ width: 1280, height: 800 })
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36')
    await page.goto('https://www.lider.cl/supermercado', { waitUntil: 'networkidle2' })
    await page.waitForSelector('.ais-SearchBox-input', { visible: true })

    await page.type('.ais-SearchBox-input', 'atun lomitos')
    await page.keyboard.press('Enter')
    await new Promise(resolve => setTimeout(resolve, 8000))
    await page.screenshot({path: 'example.png'})

    try {
        const elementHandle = await page.$eval("body", (body) => {
            const element = Array.from(body.querySelectorAll("*")).find(el => el.textContent.includes('Mantén presionado unos segundos'))
            return element ? el.textContent : null
        })

        if (elementHandle.length > 0) {
            console.log('Aviso detectado. Simulando long press...')
            const box = await elementHandle.boundingBox()

            if (box) {
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
                await page.mouse.down()
                await page.waitForTimeout(10000) // 10 segundos presionando
                await page.mouse.up()
                console.log('Long press completado.')
            }
        } else {
            console.log('No se detectó el aviso de "Mantén presionado unos segundos". Continuando normal.')
        }
    } catch (error) {
        console.error('Error al manejar el aviso:', error)
    }

    try {
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
    } catch (error) {
        console.log('Error durante el scraping:', error)
    } finally {
        await browser.close()
    }
}

getDataFromPage()
