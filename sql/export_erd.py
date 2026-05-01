import asyncio
from playwright.async_api import async_playwright

async def export_erd():
    html_path = '/home/z/my-project/sql/erd.html'
    png_path = '/home/z/Downloads/HyOps-ERD.png'
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1800, 'height': 1300, 'deviceScaleFactor': 2})
        await page.goto(f'file://{html_path}', wait_until='networkidle')
        await page.wait_for_timeout(1200)  # Wait for ECharts animation to complete
        
        # Get the chart element bounding box
        chart = page.locator('#chart')
        box = await chart.bounding_box()
        
        if box:
            # Take full screenshot of the chart
            await chart.screenshot(path=png_path)
            print(f'✅ ERD exported to: {png_path}')
            print(f'   Dimensions: {int(box["width"])}x{int(box["height"])}px (2x scale)')
        else:
            print('❌ Could not find chart element')
        
        await browser.close()

asyncio.run(export_erd())
