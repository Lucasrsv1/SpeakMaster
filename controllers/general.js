const packageJson = require("../package.json");

class General {
	/**
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	welcome (req, res) {
		res.status(200).json({ message: `SpeakMaster API v${packageJson.version}` });
	}

	/**
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	timestamp (req, res) {
		res.status(200).json({ timestamp: Date.now() });
	}
}

const generalController = new General();
module.exports = generalController;
