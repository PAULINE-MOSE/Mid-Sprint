const API_BASE=(window.NORTHSTAR_API_BASE||'').replace(/\/$/,'');
const apiUrl=(path)=>API_BASE+path;
const form=document.getElementById('inventoryForm');
const btn=document.getElementById('submitBtn');
const result=document.getElementById('result');
const text=document.getElementById('resultText');
const json=document.getElementById('resultJson');
const health=document.getElementById('health');
const steps=['step-api','step-publish','step-consume','step-result'];
function resetSteps(){steps.forEach(id=>document.getElementById(id).className='step')}
function mark(index,state='active'){resetSteps();for(let i=0;i<index;i++)document.getElementById(steps[i]).classList.add('done');if(index<steps.length)document.getElementById(steps[index]).classList.add(state)}
async function checkHealth(){try{const r=await fetch(apiUrl('/health'));if(!r.ok)throw new Error();health.textContent='API online';health.className='badge ok'}catch{health.textContent='API unavailable';health.className='badge bad'}}
form.addEventListener('submit',async e=>{
  e.preventDefault();btn.disabled=true;result.className='card result';text.textContent='Sending update…';json.textContent='';mark(0);
  const data=Object.fromEntries(new FormData(form));data.quantity=Number(data.quantity);
  try{
    mark(1);
    const r=await fetch(apiUrl('/api/inventory'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const body=await r.json();
    if(!r.ok)throw new Error(body.error||'Request failed');
    mark(2);text.textContent='✓ Message accepted and queued. The consumer will process it asynchronously.';json.textContent=JSON.stringify(body,null,2);result.classList.add('success');setTimeout(()=>mark(3,'done'),350);form.reset();
  }catch(err){resetSteps();document.getElementById('step-api').classList.add('fail');text.textContent='✕ The update could not be queued.';json.textContent=err.message;result.classList.add('error')}
  finally{btn.disabled=false}
});
checkHealth();
