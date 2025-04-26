# Video/Audio Transcription POC using OpenAI Whisper

This is a Proof-of-Concept (POC) application demonstrating how to transcribe video or audio files using OpenAI's Whisper model (specifically `whisper-1`) and generate SRT subtitle files.

It uses:
*   **Frontend:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui
*   **Backend:** Node.js + Express + TypeScript
*   **Preprocessing:** FFmpeg (via `fluent-ffmpeg`) to extract audio and convert to 16kHz mono WAV.
*   **Transcription:** OpenAI API (`whisper-1` model requesting `srt` format directly).
*   **Logging:** Winston (logs to `/logs/server.log`)

## Features

*   Upload audio or video files via a simple web interface.
*   Backend preprocesses the file using FFmpeg to extract audio as a 16kHz mono WAV file.
*   Calls the OpenAI Whisper API (`whisper-1`) to transcribe the WAV audio, requesting the `srt` format directly.
*   Downloads the generated SRT file (received directly from OpenAI) to the user's browser.

## Prerequisites

1.  **Node.js:** Version 18 or higher recommended.
2.  **npm:** Included with Node.js.
3.  **FFmpeg:** Must be installed on the system and accessible in the `PATH`. Download from [ffmpeg.org](https://ffmpeg.org/download.html). Verify installation by running `ffmpeg -version` in your terminal.
4.  **OpenAI API Key:** You need an API key from [platform.openai.com](https://platform.openai.com/).

## Setup

1.  **Clone the repository:**
    ```bash
    git clone git@github.com:justin-at-straker/whisper-video-transcriber.git
    cd whisper-video-transcriber
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    *   Create a `.env` file in the project root.
    *   Copy the contents of `.env.example` (if it exists) or add the following line:
        ```dotenv
        OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
        ```
    *   Replace `YOUR_OPENAI_API_KEY_HERE` with your actual OpenAI API key.

4.  **Initialize shadcn/ui (if needed):**
    If you haven't initialized shadcn/ui during setup or cloned fresh, you might need to run:
    ```bash
    npx shadcn@latest init
    ```
    Follow the prompts (select defaults, Vite, TypeScript, etc.). Then add the required components:
    ```bash
    npx shadcn@latest add button input label progress
    ```

## Running the Application

You need to run the frontend and backend servers concurrently in separate terminals.

1.  **Start the Backend Server:**
    ```bash
    # From the project root directory
    npx tsx server/index.ts
    ```
    The backend will run on `http://localhost:5174`. Logs will be written to `logs/server.log`.

2.  **Start the Frontend Dev Server:**
    ```bash
    # From the project root directory (in a new terminal)
    npm run dev
    ```
    The frontend will usually run on `http://localhost:5173`.

3.  **Access the Application:**
    Open your web browser and navigate to `http://localhost:5173`.

4.  **Usage:**
    *   Select an audio or video file using the input field.
    *   Click the "Transcribe and Download SRT" button.
    *   Wait for the processing (FFmpeg conversion + OpenAI transcription).
    *   An SRT file should automatically download once complete. Check the backend logs (`logs/server.log`) for detailed progress and timing.

## Notes

*   The backend uses the OS's temporary directory (e.g., `/tmp` or `C:\Users\...\AppData\Local\Temp`) to store the initial upload and the converted WAV file. These are cleaned up automatically.
*   The approach of requesting `verbose_json` and manually converting to SRT using `jsonToSrt.ts` was previously implemented but removed in favor of requesting `srt` directly from the API, which proved functional after initial tests.
*   The `gpt-4o-transcribe` model was initially tested but found *not* to return segment timestamps needed for SRT generation in its `json` response format.
*   Large file processing might take significant time depending on file size, server resources, and OpenAI API response time.
*   The FFmpeg conversion is currently set to extract audio to 16kHz mono WAV. These settings can be adjusted in `server/index.ts`.
