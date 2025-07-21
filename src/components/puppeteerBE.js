import puppeteer from "puppeteer";
import express from "express";
import cors from "cors";
import {ref} from "vue";


const app = express();
app.use(cors())
// init browser first to prevent creating a new browser each time api is called
const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();

// Set viewport for consistent rendering
await page.setViewport({ width: 1405, height: 545 });

let url = '';
// Navigate to the URL

app.get('/api/init_url', async (req) =>{
    url = req.query.url;
    console.log('url inited: ',url)
    await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
    });
})


app.get('/api/capture-canvas', async (res) => {
    console.log('query request!')
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL parameter is required' });
    }

    try {
        // Extract canvas data
        const imageData = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) {
                throw new Error('No canvas element found on the page');
            }
            return canvas.toDataURL('image/png');
        });
        
        await browser.close();
        
        if (imageData) {
            res.status(200).json({ success: true, data: imageData });
        } else {
            res.status(404).json({ success: false, error: 'Canvas element not found' });
        }
        
    } catch (e) {
        console.error('Capture error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(3001, () => console.log('API at http://localhost:3001'));