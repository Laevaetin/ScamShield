from flask import Flask, render_template, request, jsonify
from groq import Groq
import json, re
import os

app = Flask(__name__)



GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

ANALYSIS_PROMPT = """You are a scam detection expert. Analyze the following message and return ONLY valid JSON (no markdown, no extra text).

Message to analyze:
\"\"\"
{message}
\"\"\"

Return this exact JSON structure:
{{
  "verdict": "SCAM" or "LIKELY SCAM" or "SUSPICIOUS" or "SAFE",
  "confidence": <integer 0-100>,
  "scam_type": <one of: "Phishing", "Smishing", "Impersonation", "Lottery/Prize", "Romance Scam", "Tech Support", "Investment Fraud", "Job Scam", "Urgency/Fear", "Safe", "Other">,
  "summary": "<one sentence plain-English verdict>",
  "red_flags": [<list of specific red flag strings found in the message, 0-6 items>],
  "what_they_want": "<what the scammer is trying to get: money, credentials, personal info, etc. Or 'Nothing suspicious' if safe>",
  "what_to_do": "<specific action advice for the recipient, 1-2 sentences>"
}}

Be accurate. If it is a normal message, say SAFE with a low confidence score. Only list real red flags actually present in the text."""


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/analyze", methods=["POST"])
def analyze():
    data    = request.get_json()
    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({"error": "No message provided."}), 400
    if len(message) > 5000:
        return jsonify({"error": "Message too long (max 5000 characters)."}), 400

    try:
        prompt = ANALYSIS_PROMPT.format(message=message)
        chat   = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        raw = chat.choices[0].message.content.strip()

        # Strip markdown fences if model adds them
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        result = json.loads(raw)
        return jsonify(result)

    except json.JSONDecodeError:
        return jsonify({"error": "parse_error", "raw": raw[:300]}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
