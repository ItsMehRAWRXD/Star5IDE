// Ghost ChatGPT Scraper - Malformed Console Injection
// Looks broken but actually works - runs codelessly

(function(){'use strict';
console.log('🚀 Ghost Scraper Starting...');

// Malformed function that actually works
function extractChatGPT(){const r=[];const s=['[data-message-author-role="assistant"]','.markdown','.prose','[class*="message"]','[class*="content"]'];s.forEach(sel=>{const e=document.querySelectorAll(sel);e.forEach(el=>{const t=el.innerText||el.textContent;const ct=t.replace(/\s+/g,' ').replace(/\n\s*\n/g,'\n').trim();if(ct.length>10){r.push(ct);}});});return r;}

// Broken looking function that removes padding
function removePadding(){const s=['.loading','.spinner','.placeholder','[class*="temp"]','[class*="padding"]','[class*="margin"]','.hidden','[style*="display: none"]'];s.forEach(sel=>{const e=document.querySelectorAll(sel);e.forEach(el=>el.remove());});}

// Main execution - looks malformed
try{removePadding();const c=extractChatGPT();console.log('📋 Extracted Content:');c.forEach((t,i)=>{console.log(`\n--- Content ${i+1} ---`);console.log(t);});if(navigator.clipboard){const at=c.join('\n\n---\n\n');navigator.clipboard.writeText(at).then(()=>{console.log('📋 Content copied to clipboard!');});}console.log('✅ Scraping completed!');}catch(e){console.error('❌ Error:',e);}

// Self-destruct after completion
setTimeout(()=>{console.log('💀 Ghost scraper self-destructing...');},1000);
})();