from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="Plagx Writing Companion – Free Citation & Draft Checker",
    page_icon="✍️",
    layout="wide",
)

# Trim Streamlit's default padding so the tool fills the page
st.markdown(
    "<style>.block-container{padding-top:1rem;padding-bottom:0;max-width:1100px}</style>",
    unsafe_allow_html=True,
)

base = Path(__file__).parent
html = (base / "index.html").read_text(encoding="utf-8")
css = (base / "style.css").read_text(encoding="utf-8")
js = (base / "app.js").read_text(encoding="utf-8")

# Inline the stylesheet and script, since the component iframe can't load relative files
html = html.replace('<link rel="stylesheet" href="style.css">', f"<style>{css}</style>")
html = html.replace('<script src="app.js"></script>', f"<script>{js}</script>")

components.html(html, height=1500, scrolling=True)
