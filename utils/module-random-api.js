const { sha512 } = require("js-sha512");

function generateRandomAPICredentials () {
	const apiKey = crypto.randomUUID();
	const apiSecret = crypto.randomUUID().split("-").join("");
	const apiSecretHash = sha512(sha512(apiSecret));

	return { apiKey, apiSecret, apiSecretHash };
}

module.exports = { generateRandomAPICredentials };
