import crypto from 'node:crypto';
import {authorized} from './_auth.js';
import {readMailbox,saveMailbox,clearMailbox,active,sameOrigin,request,access,fail,PROVIDERS} from './_mail.js';
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');if(!authorized(req))return res.status(401).json({error:'Não autorizado'});
 if(req.method==='GET'){const mail=readMailbox(req);if(!active(mail)){if(mail)clearMailbox(res);return res.status(200).json({mailbox:null})}return res.status(200).json({mailbox:{address:mail.address,expiresAt:mail.expiresAt}})}
 if(!['POST','DELETE'].includes(req.method))return res.status(405).end();
 if(!sameOrigin(req))return res.status(403).json({error:'Origem não permitida'});
 const old=readMailbox(req);
 if(req.method==='DELETE'){clearMailbox(res);if(old){try{const token=await access(old);await request('/accounts/'+encodeURIComponent(old.id),{method:'DELETE',token,provider:old.provider||'gw'})}catch(err){console.error('Mailbox delete failed:',err.status||err.name)}}return res.status(200).json({ok:true})}
 if(active(old))return res.status(409).json({error:'Exclua ou aguarde expirar a caixa atual antes de criar outra.'});
 let stage='domains';const failures=[];
 for(const provider of PROVIDERS){
  try{
   stage='domains';const domains=await request('/domains?page=1',{provider:provider.id});
   const domain=domains['hydra:member']?.find(x=>x.isActive&&!x.isPrivate)?.domain;
   if(!domain){failures.push({provider:provider.name,stage,reason:'no_domains'});continue}
   const address='zyon'+crypto.randomBytes(8).toString('hex')+'@'+domain;
   const password=crypto.randomBytes(24).toString('base64url');
   stage='accounts';const account=await request('/accounts',{method:'POST',provider:provider.id,body:{address,password}});
   const mail={id:account.id,address,password,provider:provider.id,expiresAt:Date.now()+600000};
   saveMailbox(res,mail);return res.status(201).json({mailbox:{address,expiresAt:mail.expiresAt}});
  }catch(err){failures.push({provider:provider.name,stage,status:err.status||null});console.error('Mailbox provider attempt failed',failures[failures.length-1]);}
 }
 console.error('All mailbox providers failed',failures);
 return res.status(502).json({error:'Nenhum provedor de e-mail está disponível no momento.',diagnostic:{stage:'providers',providers:failures}});
}
