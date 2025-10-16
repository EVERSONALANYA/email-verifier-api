const dns = require('dns');

module.exports = async (req, res) => {
    // Configuración de CORS
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ isValid: false, reason: 'Método no permitido (solo POST).' });
    }

    // El cuerpo de la petición debe ser JSON
    let email;
    try {
        email = req.body.email;
    } catch (e) {
        return res.status(400).json({ isValid: false, reason: 'Formato de datos JSON inválido.' });
    }
    
    if (!email) {
        return res.status(400).json({ isValid: false, reason: 'Correo electrónico no proporcionado.' });
    }

    const parts = email.split('@');
    // Validación de formato básico (@)
    if (parts.length !== 2) {
        return res.status(200).json({ isValid: false, reason: '❌ Formato de correo inválido (falta @).' });
    }
    
    const domain = parts[1];

    // Consulta de Registros MX (El núcleo de la verificación)
    try {
        const mxRecords = await new Promise((resolve, reject) => {
            dns.resolveMx(domain, (err, addresses) => {
                // ENOENT: Dominio no existe. NODATA: Dominio existe pero no tiene MX.
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
                reason: `✅ ¡Formato correcto y dominio '${domain}' tiene servidores de correo activos!`
            });
        } else {
            return res.status(200).json({
                isValid: false,
                reason: `❌ El dominio '${domain}' existe, pero no tiene registros MX válidos.`
            });
        }

    } catch (error) {
        console.error("DNS Error:", error);
        return res.status(500).json({ isValid: false, reason: 'Error interno del servidor al consultar DNS.' });
    }
};
