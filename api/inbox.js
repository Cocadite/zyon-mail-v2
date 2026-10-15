export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({error:"Método não permitido"});
  return res.status(200).json({mode:"demo",messages:[],notice:"Nenhum serviço de recebimento de e-mails foi conectado."});
}
