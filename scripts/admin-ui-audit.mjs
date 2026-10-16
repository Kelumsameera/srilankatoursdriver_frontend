import { chromium } from '@playwright/test';
import fs from 'node:fs';
const paths=['/admin','/admin/analytics','/admin/settings','/admin/branding','/admin/footer','/admin/rates','/admin/social','/admin/pages','/admin/pages/home','/admin/media','/admin/itineraries','/admin/bookings','/admin/tailor-made','/admin/customers','/admin/messages','/admin/translations','/admin/translations/languages','/admin/translations/editor','/admin/users','/admin/roles','/admin/permissions','/admin/activity','/admin/system/api','/admin/system/security'];
const resources=['tours','destinations','excursions','vehicles','tour-categories','destination-categories','excursion-categories','vehicle-categories','blog-categories','gallery-categories','gallery','blog','guest-shorts','reviews','testimonials','faqs','hero','navigation','seo'];
for(const r of resources)paths.push('/admin/content/'+r,'/admin/content/'+r+'/new');
const id='507f1f77bcf86cd799439011';
function fixture(path){
 if(path==='/auth/me')return {user:{id,name:'Isolated QA',email:'qa@example.test',role:{id,name:'QA'},permissions:['*']}};
 if(path==='/admin/dashboard')return {cards:{},recentBookings:[],recentEnquiries:[],recentActivity:[],bookingsByMonth:[]};
 if(path==='/admin/analytics')return {range:'30d',granularity:'day',from:'2026-09-15',to:'2026-10-15',live:0,kpis:Object.fromEntries(['visitors','pageviews','sessions','viewsPerSession','bounceRate','bookings','conversionRate','signups'].map(x=>[x,{value:0,previous:0}])),series:[],previousSeries:[],topPages:[],sources:[],devices:[],browsers:[],os:[],countries:[],locales:[],heatmap:Array.from({length:7},()=>Array(24).fill(0)),funnel:[]};
 if(path==='/admin/permissions')return {modules:['tours','pages'],actions:['create','read','update','delete']};
 if(path==='/admin/translations')return {provider:'none',configured:false,locales:[],entityTypes:[],groups:[]};
 if(path==='/admin/system/integrations')return {environment:'test',security:{}};
 if(path==='/admin/site-settings')return {siteName:'QA',businessName:'QA'};
 if(path==='/admin/branding')return {};
 if(path==='/admin/media/status')return {configured:false};
 if(path==='/admin/pages')return [{_id:id,slug:'home',title:'Home',status:'published',isSystem:true,sectionCount:0}];
 if(path==='/admin/pages/'+id)return {_id:id,slug:'home',title:'Home',status:'published',isSystem:true,sections:[]};
 return [];
}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage();let errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/api/**',async route=>{const req=route.request();const path=new URL(req.url()).pathname.replace(/^\/api/,'');if(req.method()!=='GET'){await route.fulfill({status:403,json:{success:false,message:'Isolated audit blocks writes'}});return;}await route.fulfill({json:{success:true,message:'Isolated QA',data:fixture(path),meta:{page:1,limit:25,total:0,totalPages:1}}});});const results=[];for(const path of paths){errors=[];await p.goto('http://localhost:3000'+path,{waitUntil:'networkidle'});const text=await p.locator('body').innerText();results.push({path,errors:[...errors],failed:/Application error:|Page not found|This page could not be found/.test(text),heading:await p.locator('main h1').allTextContents()});console.log(JSON.stringify(results.at(-1)));}fs.writeFileSync('test-results/admin-route-audit.json',JSON.stringify(results,null,2));await b.close();})().catch(e=>{console.error(e.message);process.exit(1)});
