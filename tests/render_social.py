from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,time,sys
P=Path(__file__).resolve().parents[1]
html=(P/'index.html').read_text()
for name in ('harbor','town','town_render','movement','scene'):
 code=(P/(name+'.js')).read_text()
 if name=='scene':
  code=code.replace("image.src='assets/grass_v1.png'","image.src='data:image/png;base64,"+base64.b64encode((P/'assets/grass_v1.png').read_bytes()).decode()+"'")
 html=html.replace('<script src="'+name+'.js"></script>','<script>'+code+'</script>')
flags=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox','--disable-dev-shm-usage']
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=flags)
 for mode,w,h in [('desktop',560,340),('mobile',360,690)]:
  page=b.new_page(viewport={'width':w,'height':h},device_scale_factor=1,is_mobile=(mode=='mobile'),has_touch=(mode=='mobile'))
  errors=[];page.on('pageerror',lambda err:errors.append('js:'+str(err)))
  page.on('console',lambda msg:errors.append('console:'+msg.text) if msg.type=='error' else None)
  print('loading',mode,flush=True)
  page.set_content(html,wait_until='domcontentloaded',timeout=70000)
  try:
   page.locator('[data-vista=quality]').click(timeout=5000)
   page.wait_for_function('window.__SERENVELT_DIAGNOSTICS__?.fps>0',timeout=65000)
  except Exception as err:
   print('FAIL',mode,'err',str(err),'ui',page.locator('#error').text_content(),flush=True)
   raise
  page.wait_for_timeout(800)
  screenshot=P/f'{mode}-social.png';page.screenshot(path=str(screenshot),timeout=65000)
  d=page.evaluate('({diag:window.__SERENVELT_DIAGNOSTICS__, player:window.__SERENVELT_PLAYER__, town:window.__SERENVELT_TOWN__?.snapshot()})')
  print('results',mode,{'diag':d['diag'],'player':d['player'],'npc_count':len(d['town']['residents']),'errors':errors},flush=True)
  assert d['diag']['glError']==0 and not errors
  # NPC can be interacted with when nearby and facing them; use debug teleport to land near a working resident.
  if mode=='desktop':
   nerin=d['town']['residents'][0]
   page.evaluate('(p)=>window.__SERENVELT_DEBUG__.teleport({x:p.x,z:p.z-2,yaw:0,pitch:0})',nerin)
   page.wait_for_timeout(1000)
   before=page.evaluate('window.__SERENVELT_PLAYER__')
   print('near nerin',before,flush=True)
   if before.get('inspectable'):
    page.keyboard.press('e');page.wait_for_timeout(250)
    print('dialogue',page.locator('#toast').text_content(),flush=True)
    assert '네린' in page.locator('#toast').text_content()
   page.screenshot(path=str(P/'desktop-dialogue.png'),timeout=65000)
   page.evaluate('window.__SERENVELT_TOWN__.advance(120)')
   market=page.evaluate('window.__SERENVELT_TOWN__.snapshot()')
   assert market['marketSupply']=='restocked',market
   page.evaluate('window.__SERENVELT_DEBUG__.teleport({x:-1,z:11,yaw:Math.PI/2,pitch:-.02})')
   page.wait_for_timeout(900)
   page.screenshot(path=str(P/'desktop-market-restocked.png'),timeout=65000)
   print('restocked',market['hour'],market['marketSupply'],flush=True)
   # Verify the original landscape is still reachable
   page.locator('[data-vista=grove]').click();page.wait_for_timeout(500)
   page.screenshot(path=str(P/'desktop-grove.png'),timeout=65000)
  page.close()
 b.close()
