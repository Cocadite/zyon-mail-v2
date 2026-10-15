export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  if (req.method !== "GET") return res.status(405).json({error:"Método não permitido"});
  return res.status(200).json({ok:true,service:"ZYON MAIL API",mode:"demo",mailReceiving:false,version:"2.0"});
}
