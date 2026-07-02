const fs = require("fs");
const path = require("path");

const caminho = path.join(__dirname, "..", "historico.json");

function salvarHistorico(dados) {
    let historico = [];

    if (fs.existsSync(caminho)) {
        try {
            historico = JSON.parse(fs.readFileSync(caminho, "utf8"));
        } catch {
            historico = [];
        }
    }

    historico.unshift({
        data: new Date().toLocaleString("pt-BR"),
        ...dados
    });

    fs.writeFileSync(caminho, JSON.stringify(historico, null, 2));
}

function listarHistorico() {
    if (!fs.existsSync(caminho)) return [];

    try {
        return JSON.parse(fs.readFileSync(caminho, "utf8"));
    } catch {
        return [];
    }
}

module.exports = {
    salvarHistorico,
    listarHistorico
};