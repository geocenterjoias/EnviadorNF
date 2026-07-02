const fs = require("fs");
const path = require("path");

const HISTORICO_PATH = path.join(__dirname, "..", "historico.json");

function salvarHistorico(dados) {
    let historico = [];

    if (fs.existsSync(HISTORICO_PATH)) {
        try {
            historico = JSON.parse(fs.readFileSync(HISTORICO_PATH, "utf8"));
        } catch {
            historico = [];
        }
    }

    historico.unshift({
        data: new Date().toLocaleString("pt-BR"),
        ...dados
    });

    fs.writeFileSync(HISTORICO_PATH, JSON.stringify(historico, null, 2));
}

function listarHistorico() {
    if (!fs.existsSync(HISTORICO_PATH)) return [];

    try {
        return JSON.parse(fs.readFileSync(HISTORICO_PATH, "utf8"));
    } catch {
        return [];
    }
}

module.exports = {
    salvarHistorico,
    listarHistorico
};