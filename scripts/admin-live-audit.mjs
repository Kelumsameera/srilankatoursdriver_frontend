import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const paths=['/admin','/admin/analytics','/admin/settings','/admin/branding','/admin/footer','/admin/rates','/admin/social','/admin/pages','/admin/pages/home','/admin/media','/admin/itineraries','/admin/bookings','/admin/tailor-made','/admin/customers','/admin/messages','/admin/translations','/admin/translations/languages','/admin/translations/editor','/admin/users','/admin/roles','/admin/permissions','/admin/activity','/admin/system/api','/admin/system/security'];
const resources=['tours','destinations','excursions','vehicles','tour-categories','destination-categories','excursion-categories','vehicle-categories','blog-categories','gallery-categories','gallery','blog','guest-shorts','reviews','testimonials','faqs','hero','navigation','seo'];
for(const resource of resources)paths.push('/admin/content/'+resource,'/admin/content/'+resource+'/new');
async function main(){
 const browser=await chromium.launch({channel:'chrome',headless:false});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();
 await page.goto('http://localhost:3000/admin/login',{waitUntil:'domcontentloaded',timeout:60000}).catch(()=>undefined);
 console.log('LIVE_ADMIN_LOGIN_REQUIRED: Sign in in the separate Chrome window. Passwords and cookies are not read or recorded.');
 await page.waitForURL(url=>url.pathname.startsWith('/admin')&&!url.pathname.startsWith('/admin/login'),{timeout:600000});
 console.log('LIVE_ADMIN_SIGNED_IN');
 const results=[];let errors=[],httpFailures=[],blockedWrites=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{const u=new URL(response.url());if(u.pathname.startsWith('/api/')&&response.status()>=400)httpFailures.push({path:u.pathname,status:response.status()});});
 await page.route('**/api/**',async route=>{
  const request=route.request(),u=new URL(request.url());
  if(!['GET','HEAD','OPTIONS'].includes(request.method())&&!u.pathname.startsWith('/api/auth/')){blockedWrites.push({method:request.method(),path:u.pathname});await route.abort('blockedbyclient');return;}
  await route.continue();
 });
 mkdirSync('test-results/live-admin',{recursive:true});
 for(const path of paths){
  errors=[];httpFailures=[];blockedWrites=[];
  try{
   await page.goto('http://localhost:3000'+path,{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('main h1').first().waitFor({timeout:20000});
   await page.waitForLoadState('networkidle',{timeout:10000}).catch(()=>undefined);
   const result={path,urlPath:new URL(page.url()).pathname,headings:await page.locator('main h1').allTextContents(),errors:[...errors],httpFailures:[...httpFailures],blockedWrites:[...blockedWrites],overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
   results.push(result);
   if(errors.length||httpFailures.length)await page.screenshot({path:'test-results/live-admin/'+path.replaceAll('/','_')+'.png',fullPage:true});
   console.log(JSON.stringify(result));
  }catch(error){results.push({path,failed:true,error:error.message.split('\n')[0]});console.log(JSON.stringify(results.at(-1)));}
  writeFileSync('test-results/live-admin/audit.json',JSON.stringify(results,null,2));
 }
 console.log('LIVE_ADMIN_AUDIT_DONE',JSON.stringify({pages:results.length,failures:results.filter(r=>r.failed||r.errors?.length||r.httpFailures?.length).length}));
 await browser.close();
}
main().catch(error=>{console.error('LIVE_ADMIN_AUDIT_STOPPED:',error.message.split('\n')[0]);process.exitCode=1;});
