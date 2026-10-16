import { chromium } from '@playwright/test';
import { sectionCreate, sectionUpdate, pageUpdate } from '../../backend/src/validations/content';
import { PageSection } from '../../backend/src/models/PageSection';
import { SECTION_TYPES } from '../src/lib/admin/page-fields';
async function main(){
const id='507f1f77bcf86cd799439011';
const browser=await chromium.launch({channel:'chrome',headless:true});
const tab=await browser.newPage();
let section: Record<string, unknown>={};
let saved=false;
const failures:unknown[]=[];
await tab.route('**/api/**',async route=>{
 const req=route.request();const path=new URL(req.url()).pathname.replace(/^\/api/,'');
 if(path==='/auth/me')return route.fulfill({json:{success:true,data:{user:{id,name:'QA',email:'qa@example.test',permissions:['*'],role:{id,name:'QA'}}}}});
 if(req.method()==='POST'&&path===`/admin/pages/${id}/sections`){
  const parsed=sectionCreate.parse(req.postDataJSON());
  if(!parsed.enabled)failures.push({message:'New section should be visible by default'});
  section={...parsed,_id:id};saved=true;
  return route.fulfill({status:201,json:{success:true,data:section}});
 }
 if(req.method()==='PUT'){
  const payload=req.postDataJSON();const parsed=(path.includes('/sections/')?sectionUpdate:pageUpdate).safeParse(payload);
  if(!parsed.success)failures.push({type:section.type,issues:parsed.error.issues});
  else {section={...section,...parsed.data};saved=true;}
  return route.fulfill({status:parsed.success?200:422,json:{success:parsed.success,data:section,message:parsed.success?'Saved':'Validation failed',errors:parsed.success?[]:parsed.error.issues.map(e=>({path:e.path.join('.'),message:e.message}))}});
 }
 if(req.method()!=='GET')return route.fulfill({status:403,json:{success:false,message:'Unhandled write blocked'}});
 const page={_id:id,slug:'home',title:'Homepage',status:'published',isSystem:true,sections:[section]};
 return route.fulfill({json:{success:true,data:path==='/admin/pages'?[page]:path===`/admin/pages/${id}`?page:[]}});
});
try {
 for(const t of SECTION_TYPES){
  section=JSON.parse(JSON.stringify(new PageSection({page:id,type:t.value,title:'Original',enabled:true}).toObject()));saved=false;
  await tab.goto('http://localhost:3000/admin/pages/home',{waitUntil:'networkidle'});
  await tab.getByTestId(`edit-section-${t.value}`).click();
  const dialog=tab.getByRole('dialog');
  await dialog.getByLabel(t.value==='offer'?'Offer title':'Title',{exact:true}).fill('Updated '+t.value);
  await dialog.getByTestId('save-button').click();
  await tab.waitForTimeout(400);
  const result={type:t.value,saved,title:section.title,alerts:await dialog.locator('[role=alert]').allTextContents()};
  console.log(JSON.stringify(result));
  if(!saved||section.title!=="Updated "+t.value)failures.push(result);
 }
 saved=false;
 await tab.getByTestId('add-section').click();
 await tab.getByRole('dialog').getByRole('button',{name:'Add',exact:true}).click();
 await tab.waitForTimeout(400);
 if(!saved||!section.enabled)failures.push({message:'Adding a visible section failed'});
 console.log(JSON.stringify({action:'add-section',saved,enabled:section.enabled}));
} finally {await browser.close();}
if(failures.length){console.log(JSON.stringify(failures,null,2));process.exitCode=1;}

}
main().catch(e=>{console.error(e);process.exitCode=1;});
