const form = document.querySelector("#details");
const btn = document.querySelector("#btn");

const HACKCLUB_AI_URL = "https://ai.hackclub.com/proxy/v1/jev/systemone";
const HCAI_API_KEY = "REDACTED_HCAI_KEY";

function getFeedback(score) {
    if (score < 20) return "Barely any larp detected. Suspiciously authentic.";
    if (score < 40) return "A mild larp. Mostly grounded, with a hint of performance.";
    if (score < 60) return "A solid larp. The persona is starting to do some work.";
    if (score < 80) return "Heavy larp. You are committing to the bit.";
    return "Peak larp. You are the character now.";
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());

    const percentage = document.querySelector(".percentage");
    const feedback = document.querySelector(".text p:last-child");

    btn.disabled = true;
    btn.textContent = "calculating...";
    feedback.textContent = "Calculating your larp score...";

    try {
        if (!HCAI_API_KEY) {
            throw new Error("no key");
        }

        const response = await fetch(HACKCLUB_AI_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HCAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "jev-latest",
                state: {
                    name: data.name,
                    larpName: data.larpName,
                    larp: data.larp
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

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("The HCAI key in .env was rejected.");
            }

            throw new Error(`Hack Club AI returned HTTP ${response.status}`);
        }

        const result = await response.json();
        const rawScore = Number(result?.answers?.larpiness?.score);
        const score = Math.round(rawScore * 10);

        if (!Number.isFinite(score) || score < 0 || score > 100) {
            throw new Error("Invalid score returned by Hack Club AI");
        }

        percentage.textContent = `${score}%`;
        percentage.style.display = "flex";
        percentage.style.alignItems = "center";
        percentage.style.justifyContent = "center";
        percentage.style.color = "white";
        percentage.style.fontSize = "2rem";

        percentage.style.background =
            `conic-gradient(#ffffff ${score}%, #000000 ${score}% 100%)`;

        feedback.textContent = `${getFeedback(score)} (${score}%)`;

    } catch (error) {
        console.error("Submission failed:", error);

        if (error instanceof TypeError) {
            feedback.textContent =
                "Could not reach Hack Club AI. The browser may be blocking the request with CORS.";
        } else {
            feedback.textContent = error.message || "Failed to calculate your score.";
        }
    } finally {
        btn.disabled = false;
        btn.textContent = "get your larp score";
    }
});
