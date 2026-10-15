import {cookie} from '../_auth.js';
export default function handler(req,res){if(req.method!=='POST')return res.status(405).end();res.setHeader('Set-Cookie',cookie('zyon_session','',0));return res.status(200).json({ok:true})}
