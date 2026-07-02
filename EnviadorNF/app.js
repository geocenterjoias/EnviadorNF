const express = require("express");
const path = require("path");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ dest: "uploads/" });

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

function proteger(req, res, next) {
    if (req.cookies.logado === "sim") return next();
    return res.redirect("/login");
}

app.get("/login", (req, res) => {
    res.send(`
        <div style="font-family: Arial; max-width: 400px; margin: 80px auto; padding: 30px; box-shadow: 0 0 15px rgba(0,0,0,.1); border-radius: 12px;">
            <h2 style="text-align:center; color:#b58a35;">Geo Center</h2>
            <form method="POST" action="/login">
                <input name="usuario" placeholder="Usuário" required style="width:100%; padding:12px; margin-bottom:15px;">
                <input name="senha" type="password" placeholder="Senha" required style="width:100%; padding:12px; margin-bottom:15px;">
                <button style="width:100%; padding:12px; background:#b58a35; color:white; border:none; border-radius:8px;">Entrar</button>
            </form>
        </div>
    `);
});

app.post("/login", (req, res) => {
    const { usuario, senha } = req.body;

    if (usuario === process.env.APP_USER && senha === process.env.APP_PASSWORD) {
        res.cookie("logado", "sim", { httpOnly: true });
        return res.redirect("/");
    }

    res.send("Usuário ou senha incorretos. <br><a href='/login'>Tentar novamente</a>");
});

app.get("/", proteger, (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/enviar", proteger, upload.single("pdf"), async (req, res) => {
    const arquivo = req.file;

    try {
        const cliente = req.body.cliente;
        let telefone = req.body.telefone.replace(/\D/g, "");

        if (!arquivo) return res.send("Nenhum arquivo enviado.");

        if (!telefone.startsWith("55")) telefone = "55" + telefone;

        const pdfBase64 = fs.readFileSync(arquivo.path, { encoding: "base64" });

        const mensagem = `Olá, ${cliente}! Tudo bem?

Segue em anexo a sua Nota Fiscal referente à sua compra na Geo Center Joias.

Em caso de dúvidas, nossa equipe está à disposição.

Muito obrigado pela preferência.`;

        const url = `${process.env.EVOLUTION_URL}/message/sendMedia/${process.env.EVOLUTION_INSTANCE}`;

        const payload = {
            number: telefone,
            mediatype: "document",
            mimetype: "application/pdf",
            caption: mensagem,
            media: pdfBase64,
            fileName: arquivo.originalname
        };

        try {
            await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${process.env.EVOLUTION_API_KEY}`,
                    "Content-Type": "application/json"
                }
            });
        } catch {
            await axios.post(url, payload, {
                headers: {
                    apikey: process.env.EVOLUTION_API_KEY,
                    "Content-Type": "application/json"
                }
            });
        }

        fs.unlinkSync(arquivo.path);

        res.send(`
            <div style="font-family: Arial; max-width: 500px; margin: 60px auto; padding: 30px; border-radius: 12px; box-shadow: 0 0 15px rgba(0,0,0,.1);">
                <h2 style="color: #2e7d32;">✅ Nota Fiscal enviada com sucesso!</h2>
                <p><strong>Cliente:</strong> ${cliente}</p>
                <p><strong>Telefone:</strong> ${telefone}</p>
                <p><strong>Arquivo:</strong> ${arquivo.originalname}</p>
                <br>
                <a href="/" style="display:inline-block; padding:12px 20px; background:#b58a35; color:white; text-decoration:none; border-radius:8px;">Enviar outra nota</a>
            </div>
        `);

    } catch (error) {
        if (arquivo && fs.existsSync(arquivo.path)) fs.unlinkSync(arquivo.path);

        res.send(`
            <h2>❌ Erro ao enviar Nota Fiscal</h2>
            <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
            <a href="/">Voltar</a>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
