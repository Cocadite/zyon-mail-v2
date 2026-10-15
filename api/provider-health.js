import {authorized} from './_auth.js';
const providers=[['Mail.gw','https://api.mail.gw/domains'],['Mail.tm','https://api.mail.tm/domains']];
async function probe([name,url]){
  try{
    const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(6500),cache:'no-store'});
    if(!response.ok)return {provider:name,available:false,status:response.status,reason:'http'};
    const data=await response.json();
    const domains=data['hydra:member'];
    return {provider:name,available:Array.isArray(domains)&&domains.some(x=>x.isActive&&!x.isPrivate),status:response.status,reason:Array.isArray(domains)?'ok':'unexpected_format'};
  }catch(error){
    return {provider:name,available:false,status:null,reason:error.name==='TimeoutError'?'timeout':'network_or_parse'};
  }
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
  if(!authorized(req))return res.status(401).json({error:'Não autorizado'});
  const checks=await Promise.all(providers.map(probe));
  return res.status(200).json({checks,checkedAt:new Date().toISOString(),note:'Somente consulta de domínios; nenhuma conta criada.'});
}
