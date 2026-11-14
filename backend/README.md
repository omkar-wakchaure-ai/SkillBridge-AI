# PathPilot AI backend

FastAPI service for learner profiles, skills, recommendations, roadmaps, progress,
assessments, chat, and resume-to-role gap analysis.

## Run on Windows

From this directory, create and install the virtual environment, then launch the
API:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `GEMINI_API_KEY` in `.env` to a valid Gemini API key. Keep `.env` local; do
not commit or expose the key in frontend code. Then start the backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Check `http://127.0.0.1:8000/health` for `{"status":"ok"}` and open
`http://127.0.0.1:8000/docs` for the API documentation.

## Resume-to-role gap analysis

The feature is available at the authenticated `POST /api/resume/analyze`
endpoint. It accepts multipart form data containing:

- `resume`: a text-readable PDF or Word `.docx` file up to 5 MB
- `target_job_title`: the role to analyze against
- `Authorization: Bearer <access_token>`: the signed-in user's token

The backend validates the upload, extracts up to 20,000 characters with
`pypdf` or `python-docx`, and sends the extracted text and target role to
Gemini. Gemini's JSON is validated and normalized before returning:

```json
{
  "target_job_title": "AI/ML Engineer",
  "current_skills": ["Python", "SQL"],
  "missing_skills": ["MLOps"],
  "learning_roadmap": [
    {
      "title": "Build an ML deployment workflow",
      "description": "Package and deploy a model with a reproducible pipeline.",
      "estimated_time": "2 weeks"
    }
  ]
}
```

The React page at `/resume-analysis` uploads the resume and role through
`frontend/src/services/resumeApi.js`, displays progress while the request runs,
and renders skills and roadmap steps from the response. Start the frontend in a
separate terminal with `npm install` (first run) and `npm run dev`.

The prompt template and Gemini response parsing are in
`app/ai/resume_gap_analyzer.py`; PDF and DOCX extraction are in
`app/ai/resume_parser.py`. Invalid documents return a 4xx response, while
Gemini or response-format failures return a descriptive 5xx response.

## AI role-play chat

The authenticated `POST /api/chat` endpoint accepts JSON containing a
`message` and returns Gemini's generated text in the `reply` field. Configure
`GEMINI_API_KEY` in the backend `.env` file; optionally set `GEMINI_MODEL` to
select the model (defaults to `gemini-3.1-flash-lite`). The backend uses the
`google-genai` SDK and Interactions API; the API key remains on the backend
and is never sent to the React app. Missing configuration returns `503`, and
Gemini failures return `502`.
