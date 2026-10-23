const HACKCLUB_AI_URL = "https://ai.hackclub.com/proxy/v1/jev/systemone";

function send(res, status, body) {
    res.status(status).json(body);
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return send(res, 405, { error: "Method not allowed." });
    }

    const apiKey = process.env.HCAI || process.env.HCAI_API_KEY;
    if (!apiKey) {
        return send(res, 500, { error: "HCAI environment variable is not set." });
    }

    const { name, larpName, larp } = req.body || {};
    const fields = [name, larpName, larp];

    if (!fields.every((value) => typeof value === "string" && value.trim())) {
        return send(res, 400, { error: "name, larpName and larp are required." });
    }

    if (fields.some((value) => value.length > 2000)) {
        return send(res, 400, { error: "One of the fields is too long." });
    }

    try {
        const response = await fetch(HACKCLUB_AI_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "jev-latest",
                state: {
                    name,
                    larpName,
                    larp
                },
                questions: {
                    larpiness: {
                        type: "score",
                        instructions:
                            "How much is this person larping? Larping means pretending to be someone or something you are not, especially for status. Rate from 0 to 10.",
                        criteria: [
                            "0 - not larping at all",
                            "1 - almost no larp",
                            "2 - very slight larp",
                            "3 - a little larp",
                            "4 - mild larp",
                            "5 - moderate larp",
                            "6 - noticeable larp",
                            "7 - heavy larp",
                            "8 - very heavy larp",
                            "9 - almost peak larp",
                            "10 - peak larp"
                        ]
                    }
                }
            })
        });

        if (response.status === 401 || response.status === 403) {
            return send(res, 502, { error: "Hack Club AI rejected the configured key." });
        }

        if (!response.ok) {
            return send(res, 502, {
                error: `Hack Club AI returned HTTP ${response.status}`
            });
        }

        const result = await response.json();
        const rawScore = Number(result?.answers?.larpiness?.score);
        const score = Math.round(rawScore * 10);

        if (!Number.isFinite(score) || score < 0 || score > 100) {
            return send(res, 502, { error: "Invalid score returned by Hack Club AI." });
        }

        return send(res, 200, { score });
    } catch (error) {
        console.error("HCAI request failed:", error);
        return send(res, 502, { error: "Could not reach Hack Club AI." });
    }
};
