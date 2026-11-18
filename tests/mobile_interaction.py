import base64
from pathlib import Path
from playwright.sync_api import sync_playwright
P=Path(__file__).resolve().parents[1]
h=(P/'index.html').read_text()
for name in ('harbor','town','town_render','movement','scene'):
 s=(P/f'{name}.js').read_text()
 if name=='scene':s=s.replace("image.src='assets/grass_v1.png'","image.src='data:image/png;base64,"+base64.b64encode((P/'assets/grass_v1.png').read_bytes()).decode()+"'")
 h=h.replace(f'<script src="{name}.js"></script>',f'<script>{s}</script>')
flags=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox','--disable-dev-shm-usage']
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=flags)
 page=b.new_page(viewport={'width':360,'height':690},device_scale_factor=1,is_mobile=True,has_touch=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(h,wait_until='domcontentloaded',timeout=70000);page.locator('[data-vista=quality]').click()
 page.wait_for_function('window.__SERENVELT_DIAGNOSTICS__?.fps>0',timeout=80000)
 z0=page.evaluate('window.__SERENVELT_PLAYER__.z')
 r=page.locator('#move-pad').bounding_box();cx=r['x']+r['width']/2;cy=r['y']+r['height']/2
 cdp=page.context.new_cdp_session(page)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':cx,'y':cy,'id':1}]})
 cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':cx,'y':cy-38,'id':1}]})
 page.wait_for_timeout(1350)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 z1=page.evaluate('window.__SERENVELT_PLAYER__.z')
 print('mobile touch movement z:',z0,'->',z1,flush=True)
 assert z1>z0+.1, (z0,z1)
 page.evaluate('''()=>{const n=window.__SERENVELT_TOWN__.snapshot().residents.find(a=>a.id==="nerin");window.__SERENVELT_DEBUG__.teleport({x:n.x,z:n.z-1.2,yaw:0,pitch:0});}''')
 page.wait_for_timeout(600)
 print('interact visibility',page.locator('#interact').is_visible(),flush=True)
 assert page.locator('#interact').is_visible()
 page.locator('#interact').tap()
 page.wait_for_timeout(300)
 dialog=page.locator('#toast').text_content()
 assert '네린' in dialog, dialog
 print('mobile dialogue',dialog,'errors',errors,flush=True)
 assert not errors
 b.close()
