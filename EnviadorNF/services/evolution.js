const axios = require("axios");
const fs = require("fs");

async function enviarTexto(telefone, texto) {
    const url = `${process.env.EVOLUTION_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`;

    const payload = {
        number: telefone,
        text: texto
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
}

async function enviarMidia({ telefone, arquivo, tipo, mimetype, legenda }) {
    const url = `${process.env.EVOLUTION_URL}/message/sendMedia/${process.env.EVOLUTION_INSTANCE}`;

    const mediaBase64 = fs.readFileSync(arquivo.path, {
        encoding: "base64"
    });

    const payload = {
        number: telefone,
        mediatype: tipo,
        mimetype: mimetype,
        caption: legenda,
        media: mediaBase64,
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

    if (fs.existsSync(arquivo.path)) {
        fs.unlinkSync(arquivo.path);
    }
}

module.exports = {
    enviarTexto,
    enviarMidia
};