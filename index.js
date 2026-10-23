const form = document.querySelector("#details");
const btn = document.querySelector("#btn");

const SCORE_URL = "/api/score";

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
        const response = await fetch(SCORE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(
                errorBody.error || `Score request failed with HTTP ${response.status}`
            );
        }

        const result = await response.json();
        const score = Number(result?.score);

        if (!Number.isFinite(score) || score < 0 || score > 100) {
            throw new Error("Invalid score returned by the server");
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
            feedback.textContent = "Could not reach the score server.";
        } else {
            feedback.textContent = error.message || "Failed to calculate your score.";
        }
    } finally {
        btn.disabled = false;
        btn.textContent = "get your larp score";
    }
});
