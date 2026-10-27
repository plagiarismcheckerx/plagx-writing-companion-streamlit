# Plagx Writing Companion – Streamlit version

Streamlit edition of [Plagx Writing Companion](https://github.com/plagiarismcheckerx/plagx-writing-companion), a free browser-based academic writing utility by [Plagiarism Checker X](https://plagiarismcheckerx.com/).

### 👉 [Click here for the Streamlit demo](https://plagx-writing-companion.streamlit.app/)

Full version: [plagiarismcheckerx.github.io/plagx-writing-companion](https://plagiarismcheckerx.github.io/plagx-writing-companion/)

## Features

- **Draft checks and reading time:** word, sentence and paragraph counts, Flesch Reading Ease score, and reading and speaking time. For a deeper analysis, try the [Readability Checker](https://plagiarismcheckerx.com/readability-checker).
- **Grammar and style hints:** repeated words, passive voice, filler words, common mistakes, contractions and long sentences.
- **Citation generator:** APA, MLA, Chicago and Harvard for books, journal articles and websites.
- **Reference matching:** finds citations missing from your reference list, and references that are never cited.

## How it works

`streamlit_app.py` loads `index.html`, `style.css` and `app.js` and displays them as an embedded component. All processing still happens in the visitor's browser, and no text is sent to the server.

```
├── streamlit_app.py   # Streamlit entry point
├── requirements.txt   # streamlit
├── index.html         # Page layout and tabs
├── style.css          # Styling
├── app.js             # Draft checks, hints, citations, reference matching
└── LICENSE            # MIT
```

### Run locally

```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```

## What this tool does not do

This companion does not check for plagiarism or detect AI-generated text. To check complete documents, use [Plagiarism Checker X](https://plagiarismcheckerx.com/), or [download it](https://plagiarismcheckerx.com/download) for desktop.

## License

[MIT](LICENSE) © 2026 Plagiarism Checker X
