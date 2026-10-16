import { chromium } from '@playwright/test';
import { RESOURCES } from '../src/features/admin/resources';
import { allFields, toFormValues, fromFormValues } from '../src/components/admin/form/values';
import * as schemas from '../../backend/src/validations/content';
type SchemaName = { [K in keyof typeof schemas]: (typeof schemas)[K] extends { safeParse: unknown } ? K : never }[keyof typeof schemas];
import { writeFileSync } from 'node:fs';
import { siteSettingsUpdate, brandingUpdate } from '../../backend/src/validations/settings';
const names: Record<string,SchemaName>={tours:'tourCreate',destinations:'destinationCreate',excursions:'excursionCreate',vehicles:'vehicleCreate',gallery:'galleryCreate',blog:'blogCreate',reviews:'reviewCreate',testimonials:'reviewCreate',faqs:'faqCreate',hero:'heroCreate',navigation:'navigationCreate',seo:'seoMetadataCreate','guest-shorts':'guestShortCreate'};
const id='507f1f77bcf86cd799439011';
async function main(){
 const b=await chromium.launch({channel:'chrome',headless:true}); const p=await b.newPage();
 let endpoint='',item:Record<string,unknown>={},saved:unknown=null,validation:unknown=null;
 let settingsSchema: typeof siteSettingsUpdate | typeof brandingUpdate | null = null;
 await p.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/^\/api/,'');
  if(path==='/auth/me'){await route.fulfill({json:{success:true,data:{user:{id,name:'QA',email:'qa@example.test',permissions:['*'],role:{id,name:'QA'}}}}});return;}
  if(req.method()==='PUT'&&settingsSchema&&path===endpoint){saved=req.postDataJSON();const parsed=settingsSchema.safeParse(saved);validation=parsed.success?null:parsed.error.issues;if(parsed.success)item={...item,...parsed.data};await route.fulfill({status:parsed.success?200:422,json:{success:parsed.success,data:item,message:parsed.success?'Saved':'Validation failed',errors:parsed.success?[]:parsed.error.issues.map(e=>({path:e.path.join('.'),message:e.message}))}});return;}
  if(req.method()==='PUT'&&path===endpoint+'/'+id){const key=Object.keys(RESOURCES).find(k=>RESOURCES[k].endpoint===endpoint)!;const schema=schemas[key.endsWith('-categories')||endpoint==='/admin/categories'?'categoryCreate':names[key]];saved=req.postDataJSON();const parsed=schema.safeParse(saved);validation=parsed.success?null:parsed.error.issues;if(parsed.success)item={...item,...parsed.data};await route.fulfill({status:parsed.success?200:422,json:{success:parsed.success,data:item,message:parsed.success?'Saved':'Validation failed',errors:parsed.success?[]:parsed.error.issues.map(e=>({path:e.path.join('.'),message:e.message}))}});return;}
  if(req.method()!=='GET'){await route.fulfill({status:403,json:{success:false,message:'Isolated audit blocks unhandled writes'}});return;}
  await route.fulfill({json:{success:true,data:path===endpoint+'/'+id||(settingsSchema&&path===endpoint)?item:[],meta:{page:1,limit:100,total:0,totalPages:1}}});
 });
 const results=[];
 for(const [key,r] of Object.entries(RESOURCES)){
  endpoint=r.endpoint;const fields=allFields(r.sections),values=toFormValues(fields,{...r.defaults,...r.fixedValues});
  for(const f of fields)if(f.required&&!values[f.name])values[f.name]=f.type==='number'?1:f.type==='media'?{publicId:'qa/image',url:'https://example.com/image.jpg',resourceType:'image'}:f.type==='url'?'https://www.youtube.com/watch?v=dQw4w9WgXc':'audit-content';
  if(key==='gallery')values.media={publicId:'qa/image',url:'https://example.com/image.jpg',resourceType:'image'};
  item={...fromFormValues(fields,values),...r.fixedValues,_id:id};saved=null;validation=null;
  await p.goto('http://localhost:3000/admin/content/'+key+'/'+id,{waitUntil:'networkidle'});
  await p.getByTestId('save-button').click();
  try{await p.waitForFunction(()=>document.querySelector('[data-sonner-toast]')!==null,{},{timeout:5000});}catch{}
  const result={key,submitted:!!saved,validation,errors:await p.locator('[role=alert]').allTextContents()};results.push(result);console.log(JSON.stringify(result));
 }
 for(const path of ['settings','footer','rates','social','branding']){
  const branding=path==='branding';endpoint=branding?'/admin/branding':'/admin/site-settings';settingsSchema=branding?brandingUpdate:siteSettingsUpdate;
  item=branding?{logoWidth:180,logoHeight:56,colors:{primary:'#08261a',secondary:'#0f3d2e',accent:'#c99b32'}}:{siteName:'Audit Site',businessName:'Audit Business',currency:'USD',timezone:'Asia/Colombo',defaultLanguage:'en'};
  saved=null;validation=null;
  await p.goto('http://localhost:3000/admin/'+path,{waitUntil:'networkidle'});
  await p.getByTestId('save-button').click();
  try{await p.waitForFunction(()=>document.querySelector('[data-sonner-toast]')!==null,{},{timeout:5000});}catch{}
  const result={key:path,submitted:!!saved,validation,errors:await p.locator('[role=alert]').allTextContents()};results.push(result);console.log(JSON.stringify(result));
 }
 writeFileSync('test-results/admin-save-audit.json',JSON.stringify(results,null,2));await b.close();
 if(results.some(x=>!x.submitted||x.validation))process.exitCode=1;
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
