# Video/Audio Transcription POC using OpenAI Whisper

This is a Proof-of-Concept (POC) application demonstrating how to transcribe video or audio files using OpenAI's Whisper model (specifically `whisper-1`) and generate SRT subtitle files.

It uses:
*   **Frontend:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui
*   **Backend:** Node.js + Express + TypeScript
*   **Transcription:** OpenAI API (`whisper-1` model for `verbose_json` output)
*   **Preprocessing:** FFmpeg (via `fluent-ffmpeg`) to extract audio and convert to MP3
*   **Logging:** Winston (logs to `/logs/server.log`)

## Features

*   Upload audio or video files via a simple web interface.
*   Backend preprocesses the file using FFmpeg to extract audio as MP3.
*   Calls the OpenAI Whisper API (`whisper-1`) to transcribe the audio, requesting `verbose_json` format to get segment timestamps.
*   Converts the timestamped segments from the API response into an SRT subtitle file format.
*   Downloads the generated SRT file to the user's browser.

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
    *   An SRT file should automatically download once complete. Check the backend logs for detailed progress and timing.

## Notes

*   The backend uses the OS's temporary directory (e.g., `/tmp` or `C:\Users\...\AppData\Local\Temp`) to store the initial upload and the converted MP3 file. These are cleaned up automatically.
*   The `gpt-4o-transcribe` model was initially tested but found *not* to return segment timestamps needed for SRT generation in its `json` response format, hence the switch to `whisper-1` with `verbose_json`.
*   Large file processing might take significant time depending on file size, server resources, and OpenAI API response time.
*   The FFmpeg conversion is currently set to extract audio to MP3 at 192k bitrate. These settings can be adjusted in `server/index.ts`.
