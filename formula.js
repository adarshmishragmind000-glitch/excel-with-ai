
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Only POST requests are allowed."
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Server setup incomplete: OPENAI_API_KEY is missing."
    });
  }

  const question = String(req.body?.question || "").trim();

  const allowedLanguages = ["Hindi", "English", "Hinglish"];
  const language = allowedLanguages.includes(req.body?.language)
    ? req.body.language
    : "Hindi";

  if (!question) {
    return res.status(400).json({
      error: "Please enter your Excel question."
    });
  }

  if (question.length > 2000) {
    return res.status(400).json({
      error: "Question is too long. Maximum 2000 characters."
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          instructions: [
            "You are Excel with AI, a friendly Microsoft Excel teacher.",
            "Teach beginners in a clear, practical way.",
            "Answer Excel formulas, functions, spreadsheet tasks and Excel learning questions only.",
            "If unrelated, politely ask the user to enter an Excel-related question.",
            `Write the explanation in ${language}.`,
            "Structure the answer with: 1. Formula, 2. Example, 3. Step-by-step explanation, 4. Quick tip.",
            "Use valid Excel syntax and realistic cell references.",
            "Explain what each important part of the formula does.",
            "Mention Excel-version compatibility when relevant.",
            "Never claim that you executed or tested a formula."
          ].join(" "),
          input: question,
          max_output_tokens: 800,
          store: false
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);

      if (response.status === 401) {
        return res.status(502).json({
          error: "API key invalid. Check OPENAI_API_KEY in Vercel."
        });
      }

      if (response.status === 429) {
        return res.status(502).json({
          error: "API quota or rate limit reached. Check API billing and usage."
        });
      }

      return res.status(502).json({
        error: "AI request failed. Check API model access and try again."
      });
    }

    const answer = (data.output || [])
      .filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n")
      .trim();

    if (!answer) {
      return res.status(502).json({
        error: "AI returned an empty answer. Please try again."
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
