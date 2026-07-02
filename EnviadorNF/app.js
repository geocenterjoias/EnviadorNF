const express = require("express");
const path = require("path");
const multer = require("multer");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { enviarTexto, enviarMidia } = require("./services/evolution");
const { salvarHistorico, listarHistorico } = require("./services/logger");

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ dest: "uploads/" });

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

function proteger(req, res, next) {
    if (req.cookies.logado === "sim") return next();
    return res.redirect("/login");
}

app.get("/", proteger, (req, res) => {
    res.redirect("/menu");
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/login", (req, res) => {
    const { usuario, senha } = req.body;

    if (usuario === process.env.APP_USER && senha === process.env.APP_PASSWORD) {
        res.cookie("logado", "sim", { httpOnly: true });
        return res.redirect("/menu");
    }

    res.send("Usuário ou senha incorretos. <br><a href='/login'>Tentar novamente</a>");
});

app.get("/logout", (req, res) => {
    res.clearCookie("logado");
    res.redirect("/login");
});

app.get("/menu", proteger, (req, res) => {
    res.sendFile(path.join(__dirname, "views", "menu.html"));
});

app.get("/nf", proteger, (req, res) => {
    res.sendFile(path.join(__dirname, "views", "nf.html"));
});

app.post("/nf", proteger, upload.single("pdf"), async (req, res) => {
    const arquivo = req.file;

    try {
        const cliente = req.body.cliente;
        let telefone = req.body.telefone.replace(/\D/g, "");

        if (!arquivo) return res.send("Nenhum PDF enviado.");
        if (!telefone.startsWith("55")) telefone = "55" + telefone;

        const mensagem = `Olá, ${cliente}! Tudo bem?

Segue em anexo a sua Nota Fiscal referente à sua compra na Geo Center Joias.

Agradecemos pela sua compra!

Muito obrigado pela preferência.`;

        await enviarMidia({
            telefone,
            arquivo,
            tipo: "document",
            mimetype: "application/pdf",
            legenda: mensagem
        });

        salvarHistorico({
            tipo: "Nota Fiscal",
            cliente,
            telefone,
            arquivo: arquivo.originalname,
            status: "Enviado"
        });

        res.redirect("/sucesso?tipo=Nota Fiscal");

    } catch (error) {
        res.redirect("/erro");
    }
});

app.get("/pagamento", proteger, (req, res) => {
    res.sendFile(path.join(__dirname, "views", "pagamento.html"));
});

app.post("/pagamento", proteger, async (req, res) => {
    try {
        const cliente = req.body.cliente;
        let telefone = req.body.telefone.replace(/\D/g, "");
        const link = req.body.link;

        if (!telefone.startsWith("55")) telefone = "55" + telefone;

        const mensagem = `Olá, ${cliente}! Tudo bem?

Segue o link para realizar o pagamento da sua compra na Geo Center Joias:

${link}

Assim que o pagamento for confirmado, daremos continuidade ao seu atendimento.

Qualquer dúvida, estamos à disposição.`;

        await enviarTexto(telefone, mensagem);

        salvarHistorico({
            tipo: "Link de Pagamento",
            cliente,
            telefone,
            arquivo: link,
            status: "Enviado"
        });

        res.redirect("/sucesso?tipo=Link de Pagamento");

    } catch (error) {
        res.redirect("/erro");
    }
});

app.get("/foto", proteger, (req, res) => {
    res.sendFile(path.join(__dirname, "views", "foto.html"));
});

app.post("/foto", proteger, upload.single("foto"), async (req, res) => {
    const arquivo = req.file;

    try {
        const cliente = req.body.cliente;
        let telefone = req.body.telefone.replace(/\D/g, "");
        const legenda = req.body.legenda;

        if (!arquivo) return res.send("Nenhuma foto enviada.");
        if (!telefone.startsWith("55")) telefone = "55" + telefone;

        await enviarMidia({
            telefone,
            arquivo,
            tipo: "image",
            mimetype: arquivo.mimetype,
            legenda
        });

        salvarHistorico({
            tipo: "Foto da Joia",
            cliente,
            telefone,
            arquivo: arquivo.originalname,
            status: "Enviado"
        });

        res.redirect("/sucesso?tipo=Foto");

    } catch (error) {
        res.redirect("/erro");
    }
});

app.get("/historico", proteger, (req, res) => {
    const historico = listarHistorico();

    let linhas = historico.map(item => `
        <tr>
            <td>${item.data}</td>
            <td>${item.tipo}</td>
            <td>${item.cliente}</td>
            <td>${item.telefone}</td>
            <td>${item.arquivo}</td>
            <td>${item.status}</td>
        </tr>
    `).join("");

    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Histórico - Geo Center</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <div class="card-large">
                <a class="voltar" href="/menu">← Voltar</a>
                <h2>Histórico de Envios</h2>

                <table>
                    <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Cliente</th>
                        <th>Telefone</th>
                        <th>Arquivo / Link</th>
                        <th>Status</th>
                    </tr>
                    ${linhas}
                </table>
            </div>
        </body>
        </html>
    `);
});

app.get("/sucesso", proteger, (req, res) => {
    const tipo = req.query.tipo || "Envio";

    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Sucesso - Geo Center</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <div class="card">
                <h2 style="color:#2e7d32;">✅ ${tipo} enviado com sucesso!</h2>
                <a class="btn" href="/menu">Voltar ao Menu</a>
            </div>
        </body>
        </html>
    `);
});

app.get("/erro", proteger, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Erro - Geo Center</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <div class="card">
                <h2 style="color:#c62828;">❌ Erro ao realizar envio</h2>
                <a class="btn" href="/menu">Voltar ao Menu</a>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});