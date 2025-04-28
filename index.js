import puppeteer from 'puppeteer'

async function openWebPage() {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 250,
    })
    const page = await browser.newPage()
    await page.goto('https://example.com')
    await browser.close()
}

async function captureScreenshot() {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 250,
    })
    const page = await browser.newPage()
    await page.goto('https://example.com')
    await page.screenshot({path: 'example.png'})
    await browser.close()
}

async function navigateWebPage() {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 250,
    })
    const page = await browser.newPage()
    await page.goto('https://quotes.toscrape.com')
    await page.click('a[href="/login"]')
    await new Promise(resolve => setTimeout(resolve, 1000))
    await browser.close()
}

async function getDataFromWebPage() {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 250,
    })
    const page = await browser.newPage()
    await page.goto('https://www.unimarc.cl/')

    const result = await page.evaluate(() => {
        const element = document.querySelector('a[href="/login"]')
        if (element) {
            element.click()
        }
    })  

    await new Promise(resolve => setTimeout(resolve, 1000))
    await browser.close()
}

async function handleDynamicWebPage() {
    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 200,
    })
    const page = await browser.newPage()
    await page.goto("https://quotes.toscrape.com")
    // await page.waitForSelector('div[data-loaded="true"]')
    const data = await page.evaluate(() => {
      const quotes = document.querySelectorAll(".quote")
      const data = [...quotes].map((quote) => {
        const quoteText = quote.querySelector(".text").innerText
        const author = quote.querySelector(".author").innerText
        const tags = [...quote.querySelectorAll(".tag")].map(
          (tag) => tag.innerText
        )
        return {
          quoteText,
          author,
          tags,
        }
      })
      return data
    })
    console.log(data)
    await browser.close()
}

//openWebPage()
//captureScreenshot()
//navigateWebPage()
//getDataFromWebPage()
handleDynamicWebPage()