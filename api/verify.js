// JavaScript source code
const dns = require('dns');

module.exports = async (req, res) => {
    // Configuración de CORS: Permite que el Front-end acceda a la API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Maneja la petición OPTIONS (pre-flight check de CORS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ isValid: false, reason: 'Método no permitido (solo POST).' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ isValid: false, reason: 'Correo electrónico no proporcionado.' });
    }

    const parts = email.split('@');
    if (parts.length !== 2) {
        return res.status(200).json({ isValid: false, reason: 'Formato de correo inválido (falta @).' });
    }

    const domain = parts[1];

    // Consulta de Registros MX
    try {
        const mxRecords = await new Promise((resolve, reject) => {
            dns.resolveMx(domain, (err, addresses) => {
                // ENOENT, ENOTFOUND: Dominio no existe. NODATA: No tiene registros MX.
                if (err && (err.code === 'ENOTFOUND' || err.code === 'NODATA')) {
                    return resolve(null);
                }
                if (err) return reject(err);
                resolve(addresses);
            });
        });

        if (mxRecords && mxRecords.length > 0) {
            return res.status(200).json({
                isValid: true,
                reason: `¡El formato es correcto y el dominio '${domain}' tiene servidores de correo!`
            });
        } else {
            return res.status(200).json({
                isValid: false,
                reason: `El dominio '${domain}' no tiene registros MX (no puede recibir correo).`
            });
        }

    } catch (error) {
        console.error("DNS Error:", error);
        return res.status(500).json({ isValid: false, reason: 'Error interno del servidor.' });
    }
};