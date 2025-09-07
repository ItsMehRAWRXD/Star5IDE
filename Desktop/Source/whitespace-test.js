const{handler}=require('./netlify/functions/api');
const w={c:0,check(){return this.c++<100;}};
const wHandler=async(event,context)=>{
if(!w.check()){
return{
statusCode:429,
headers:{'Content-Type':'application/json'},
body:JSON.stringify({error:'Whitespace limited'})
};
}
return handler(event,context);
};
async function testWhitespace(){
const event={httpMethod:'GET',path:'/health',headers:{}};
let s=0,l=0;
for(let i=1;i<=150;i++){
const r=await wHandler(event,{});
if(r.statusCode===200)s++;
else if(r.statusCode===429)l++;
}
console.log(`Whitespace: ${s} success, ${l} limited`);
}
testWhitespace();