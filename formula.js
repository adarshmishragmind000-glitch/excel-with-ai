export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "AI API key is not configured on the server."
    });
  }

  const question = String(req.body?.question || "").trim();
  const language = ["Hindi", "English", "Hinglish"].includes(
    req.body?.language
  ) ? req.body.language : "Hindi";

  if (!question || question.length > 2000) {
    return res.status(400).json({
      error: "Please enter a question under 2000 characters."
    });
  }

  try {
    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        instructions: [
          "You are a friendly Microsoft Excel teacher for beginners.",
          "Answer Excel, spreadsheet formula, and Excel learning questions.",
          "If the question is unrelated to Excel, politely guide the user back to Excel.",
          `Explain in ${language}.`,
          "Give the formula, a small example, step-by-step explanation, and a quick tip.",
          "Use valid Excel formula syntax and explain cell references.",
          "Mention when a formula differs between Excel versions if relevant.",
          "Use plain text and formulas. Never claim you executed a formula."
        ].join(" "),
        input: question,
        max_output_tokens: 900
      })
    });

    const result = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("AI API error:", result);
      return res.status(502).json({
        error: "AI service error. Please check the API setup and try again."
      });
    }

    const answer = (result.output || [])
      .filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    if (!answer) {
      return res.status(502).json({
        error: "No answer received. Please try again."
      });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Formula helper error:", error);
    return res.status(500).json({
      error: "Server error. Please try again later."
    });
  }
}
