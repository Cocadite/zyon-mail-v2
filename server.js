import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import login from './api/auth/login.js';
import callback from './api/auth/callback.js';
import logout from './api/auth/logout.js';
import me from './api/auth/me.js';
import mailbox from './api/mailbox.js';
import inbox from './api/inbox.js';
import message from './api/message.js';
import health from './api/provider-health.js';
const handlers={'/api/auth/login':login,'/api/auth/callback':callback,'/api/auth/logout':logout,'/api/auth/me':me,'/api/mailbox':mailbox,'/api/inbox':inbox,'/api/message':message,'/api/provider-health':health};
const root=dirname(fileURLToPath(import.meta.url));
const html=await readFile(join(root,'index.html'));
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  res.status=function(code){this.statusCode=code;return this};
  res.json=function(data){this.setHeader('Content-Type','application/json; charset=utf-8');this.end(JSON.stringify(data));return this};
  res.send=function(data){this.setHeader('Content-Type','text/plain; charset=utf-8');this.end(String(data));return this};
  res.redirect=function(code,target){this.writeHead(code,{Location:target});this.end();return this};
  req.query=Object.fromEntries(url.searchParams);
  try{
    if(handlers[url.pathname]){
      if(['POST','PUT','PATCH'].includes(req.method)){
        let size=0;const chunks=[];
        for await(const chunk of req){size+=chunk.length;if(size>16384){res.status(413).end();return}chunks.push(chunk)}
        const raw=Buffer.concat(chunks).toString();
        if(raw){try{req.body=JSON.parse(raw)}catch{res.status(400).json({error:'JSON inválido'});return}}
      }
      await handlers[url.pathname](req,res);
    }else if(url.pathname==='/'||url.pathname==='/index.html'){
      if(req.method!=='GET'){res.status(405).end();return}
      res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(html);
    }else res.status(404).end();
  }catch(err){console.error('Unhandled request error',err?.name||'Error');if(!res.headersSent)res.status(500).json({error:'Erro interno'});else res.end()}
});
server.listen(Number(process.env.PORT||10000),'0.0.0.0',()=>console.log('ZYON MAIL listening'));