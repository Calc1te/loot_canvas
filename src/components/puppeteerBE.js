const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors')


const app = express();
app.use(cors())

app.get('/api/capture-canvas', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL parameter is required' });
    }

    try {
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set viewport for consistent rendering
        await page.setViewport({ width: 1405, height: 545 });
        
        // Navigate to the URL
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });


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
            res.json({ success: true, data: imageData });
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