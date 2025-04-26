/**
 * Calls the backend API to transcribe the given audio/video file.
 * Handles the fetch request, response processing, and file download.
 * 
 * @param file The audio or video file to transcribe.
 * @throws {Error} If the transcription request fails or the response is not ok.
 */
export async function transcribeFile(file: File): Promise<void> {
    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/transcribe", {
        method: "POST",
        body,
        // Consider adding AbortSignal for cancellation
    });

    if (!res.ok) {
        let errorMsg = `Transcription failed with status: ${res.status}`;
        try {
            const errData = await res.json();
            errorMsg = errData.error || errorMsg;
        } catch (jsonError) {
            console.error("Could not parse error response:", jsonError);
            // Use response text if JSON parsing fails
            const textError = await res.text().catch(() => ''); // Attempt to get text error
            if (textError) errorMsg += ` - ${textError}`;
        }
        throw new Error(errorMsg);
    }

    // Process the successful response (SRT file blob)
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = 'none'; // Hide the link
    a.href = url;

    // Extract filename from Content-Disposition header or use default
    const disposition = res.headers.get('Content-Disposition');
    let filename = "subtitles.srt"; // Default filename
    if (disposition && disposition.includes('attachment')) {
        const filenameRegex = /filename[^;=\n]*=((['"])(.*?[^\\])\2|([^;\n]*))/;
        const matches = filenameRegex.exec(disposition);
        if (matches?.[3]) {
            filename = matches[3].replace(/\\"/g, '"');
        } else if (matches?.[4]) {
            filename = matches[4]; // Handle unquoted filename
        }
    }
    a.download = filename;

    document.body.appendChild(a); // Append anchor to body for broader browser compatibility
    a.click();

    // Clean up
    window.URL.revokeObjectURL(url);
    a.remove();
} 