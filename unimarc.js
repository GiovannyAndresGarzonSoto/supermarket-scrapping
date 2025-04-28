import puppeteer from 'puppeteer'

async function handleDynamicWebPage() {
    const browser = await puppeteer.launch({
        headless: 'new',
    })
    const page = await browser.newPage()
    
    await page.setViewport({ width: 1280, height: 800 })    
    try {
        await page.goto('https://www.unimarc.cl/', { waitUntil: 'networkidle2' })        
        await page.type('#search-header__input', 'pechuga pollo')
        await new Promise(resolve => setTimeout(resolve, 2000))
        await page.screenshot({path: 'example.png'})
        const productData = await page.evaluate(() => {
            const name = document.querySelector('p[class*="nameProduct"]').innerText.trim()
            const brand = document.querySelector('p[class*="brandText"]')?.innerText.trim()        
            const imageSrc = document.querySelector('img[class*="defaultImgStyle"]')?.src        
            const productLink = document.querySelector(`a[class*="Link_link"]`)?.href
        
            return {
              name,
              brand,
              imageSrc,
              productLink
            }
          })
        
          console.log(productData)
    } catch (error) {
        console.log('Error durante el scraping:', error)
    } finally {
        await browser.close()
    }
}

handleDynamicWebPage()