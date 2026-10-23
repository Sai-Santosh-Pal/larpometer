const HACKCLUB_AI_URL = "https://ai.hackclub.com/proxy/v1/chat/completions";

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
                model: "openai/gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "You score how much a person is larping. Larping means pretending to be someone or something you are not, especially for status. " +
                            "Rate the person from 0 to 100, where 0 is not larping at all and 100 is peak larp. " +
                            "Respond with only the integer score, nothing else."
                    },
                    {
                        role: "user",
                        content: `Name: ${name}\nLarp name: ${larpName}\nLarp: ${larp}`
                    }
                ],
                temperature: 0.2
            })
        });

        if (response.status === 401 || response.status === 403) {
            return send(res, 502, { error: "Hack Club AI rejected the configured key." });
        }

        if (!response.ok) {
            const detail = await response.text().catch(() => "");
            console.error("HCAI error:", response.status, detail);
            return send(res, 502, {
                error: `Hack Club AI returned HTTP ${response.status}`
            });
        }

        const result = await response.json();
        const content = result?.choices?.[0]?.message?.content ?? "";
        const match = String(content).match(/\d{1,3}/);
        const score = match ? Number(match[0]) : NaN;

        if (!Number.isFinite(score) || score < 0 || score > 100) {
            return send(res, 502, { error: "Invalid score returned by Hack Club AI." });
        }

        return send(res, 200, { score });
    } catch (error) {
        console.error("HCAI request failed:", error);
        return send(res, 502, { error: "Could not reach Hack Club AI." });
    }
};
