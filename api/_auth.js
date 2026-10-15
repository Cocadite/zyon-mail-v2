import crypto from 'node:crypto';
export const cookie=(name,value,age)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
export function sign(value){return crypto.createHmac('sha256',process.env.SESSION_SECRET).update(value).digest('base64url')}
export function getCookie(req,name){const raw=req.headers.cookie||'';const pair=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));return pair?pair.slice(name.length+1):null}
export function authorized(req){const token=getCookie(req,'zyon_session');if(!token||!process.env.SESSION_SECRET||!process.env.DISCORD_ALLOWED_USER_ID)return false;const [id,expiry,mac]=token.split('.');if(!id||!expiry||!mac||id!==process.env.DISCORD_ALLOWED_USER_ID||!/^\d+$/.test(expiry)||Number(expiry)<Date.now())return false;const expected=sign(id+'.'+expiry);const a=Buffer.from(mac),b=Buffer.from(expected);return a.length===b.length&&crypto.timingSafeEqual(a,b)}
export function configured(){return Boolean(process.env.DISCORD_CLIENT_ID&&process.env.DISCORD_CLIENT_SECRET&&process.env.DISCORD_ALLOWED_USER_ID&&process.env.SESSION_SECRET)}
