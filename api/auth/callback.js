import {cookie,getCookie,sign,configured} from '../_auth.js';
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).end();
  res.setHeader('Cache-Control','no-store');
  const state=getCookie(req,'zyon_oauth_state');
  res.setHeader('Set-Cookie',cookie('zyon_oauth_state','',0));
  if(!configured()||!state||typeof req.query.state!=='string'||state!==req.query.state||typeof req.query.code!=='string')
    return res.status(400).send('Autorização inválida. Inicie novamente pelo botão Entrar com Discord.');
  try{
    const redirect='https://zyon-mail-v2.vercel.app/api/auth/callback';
    const body=new URLSearchParams({client_id:process.env.DISCORD_CLIENT_ID,client_secret:process.env.DISCORD_CLIENT_SECRET,grant_type:'authorization_code',code:req.query.code,redirect_uri:redirect});
    const response=await fetch('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()});
    if(!response.ok){console.error('Discord OAuth token exchange failed: HTTP',response.status);return res.status(502).send('Discord recusou a autenticação. Verifique Client Secret e Redirect URI.')}
    const token=await response.json();
    if(!token.access_token)return res.status(502).send('Discord não retornou um token válido.');
    const userRes=await fetch('https://discord.com/api/users/@me',{headers:{Authorization:'Bearer '+token.access_token}});
    if(!userRes.ok){console.error('Discord profile fetch failed: HTTP',userRes.status);return res.status(502).send('Falha ao consultar o perfil do Discord.')}
    const user=await userRes.json();
    if(user.id!==process.env.DISCORD_ALLOWED_USER_ID)return res.status(403).send('Esta conta do Discord não está autorizada.');
    const expiry=String(Date.now()+86400000),payload=user.id+'.'+expiry;
    res.setHeader('Set-Cookie',cookie('zyon_session',payload+'.'+sign(payload),86400));
    return res.redirect(302,'/');
  }catch(err){console.error('Discord OAuth callback exception:',err?.name||'Error');return res.status(502).send('Erro de comunicação com o Discord. Tente novamente.')}
}
