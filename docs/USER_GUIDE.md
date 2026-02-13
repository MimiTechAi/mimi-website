# MIMI User Guide

> Your sovereign AI assistant that runs entirely in your browser.

---

## Getting Started

### System Requirements

- **Browser:** Chrome 130+, Edge 130+ (WebGPU required)
- **RAM:** At least 4 GB free memory
- **GPU:** Any WebGPU-capable GPU (integrated or dedicated)
- **Internet:** Required only for first model download (cached afterward)

### First Launch

1. Navigate to the MIMI page (`/mimi`)
2. MIMI checks your hardware for WebGPU compatibility
3. The AI model downloads (~1-4 GB, depends on your hardware tier)
4. Once loaded, the model is cached locally for instant future loads
5. You see the Welcome Screen -- MIMI is ready

If your browser does not support WebGPU, you will see an "Unsupported Browser" screen with instructions to upgrade.

---

## Chat Interface

### Sending Messages

Type your message in the input field and press Enter or click Send. MIMI responds in real-time with streaming text.

You can ask MIMI to:
- Answer questions in German or English
- Write and execute Python code
- Analyze uploaded documents (PDFs)
- Analyze uploaded images
- Search the web
- Create downloadable files
- Perform calculations
- Write professional emails and reports
- Translate between languages

### Agent Status

The status badge at the top shows what MIMI is doing:
- **Idle** -- Waiting for input
- **Thinking** -- Reasoning about your request
- **Calculating** -- Running Python code
- **Searching** -- Searching documents or the web
- **Coding** -- Writing code

### Stopping a Response

Click the Stop button while MIMI is generating to interrupt the current response.

### Clearing Chat

Use the Clear button in the header to reset the conversation.

---

## Capabilities

### Python Execution

MIMI can write and run Python code directly in your browser. The Python environment includes:
- **NumPy** -- Numerical computing
- **Pandas** -- Data analysis
- **Matplotlib** -- Charts and visualizations
- **SciPy** -- Scientific computing
- **scikit-learn** -- Machine learning

When MIMI generates a chart with Matplotlib, it renders inline in the chat.

**Example prompts:**
- "Create a bar chart of monthly sales: Jan 100, Feb 150, Mar 200"
- "Analyze this CSV data and find correlations"
- "Write a Python script to calculate compound interest"

### Document Analysis (RAG)

Upload PDF documents and ask questions about their content.

**How to use:**
1. Click the PDF upload button
2. Select one or more PDF files
3. MIMI extracts text, chunks it, and builds a vector index
4. Ask questions -- MIMI searches the documents and cites relevant passages

**Example prompts:**
- "What does the contract say about termination?"
- "Summarize the key findings from this report"
- "Find all mentions of revenue in the document"

### Image Analysis

Upload images for MIMI to analyze.

**How to use:**
1. Click the image upload button
2. Select an image file
3. Ask questions about the image

**Example prompts:**
- "What do you see in this image?"
- "What text is visible in this screenshot?"
- "Describe the chart in this image"

### Voice Input/Output

- Click the microphone button to speak your message
- MIMI transcribes your speech and processes it as text
- MIMI can read responses aloud using text-to-speech
- Switch languages between German and English

### Web Search

MIMI can search the internet for current information via DuckDuckGo.

**Example prompts:**
- "Search for the latest AI news"
- "What is the current weather in Berlin?"
- "Compare React vs Vue in 2026"

Note: Web search runs through CORS proxies and may occasionally be unavailable.

### File Generation

MIMI can create downloadable files:
- **CSV** -- Spreadsheet data
- **JSON** -- Structured data
- **TXT** -- Plain text
- **HTML** -- Formatted documents
- **Markdown** -- Documentation

**Example prompts:**
- "Create a CSV with a sample budget spreadsheet"
- "Generate an HTML report of our analysis"
- "Export these results as JSON"

### SQL Database

MIMI includes a local SQLite database for data operations.

**Example prompts:**
- "Create a table for tracking expenses"
- "Insert sample data and run a summary query"
- "Show me a SQL query to find top customers"

### JavaScript Execution

MIMI can run JavaScript in a sandboxed QuickJS environment.

---

## MIMI Agent Pages

### Dashboard (`/mimi/dashboard`)

Overview of MIMI capabilities, usage statistics, and quick-start actions.

### Workspace (`/mimi/workspace`)

Full workspace environment with file explorer, code editor, and output panel.

### Settings (`/mimi/settings`)

Configure MIMI behavior, model preferences, and voice settings.

---

## Privacy

MIMI runs 100% on your device:
- **No data sent to the cloud** -- All AI inference happens locally via WebGPU
- **No API keys needed** -- The AI model runs in your browser
- **Documents stay local** -- Uploaded PDFs and images are processed on-device
- **No tracking of conversations** -- Your chat history is only in browser memory

The only network requests MIMI makes are:
- Initial model download (cached after first load)
- Web search queries (when you explicitly ask for web search)

---

## Troubleshooting

### "WebGPU not supported"

- Use Chrome 130+ or Edge 130+
- Firefox has experimental WebGPU support (enable in `about:config`)
- Safari does not yet support WebGPU

### Model takes a long time to load

- First load downloads 1-4 GB -- this is normal
- Subsequent loads use the browser cache and are much faster
- A slow network connection will increase first-load time

### "Out of memory" warning

- Close other browser tabs to free RAM
- MIMI monitors memory usage and shows a warning at high utilization
- The model needs approximately 4 GB of RAM

### Python code execution fails

- Pyodide loads in the background after the AI model
- Wait a few seconds after "MIMI is ready" before running Python
- The `isPythonReady` indicator shows when Python is available

### Voice input not working

- Grant microphone permission when prompted
- Check that no other app is using the microphone
- Voice input requires HTTPS or localhost
