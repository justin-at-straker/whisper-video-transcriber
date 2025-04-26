import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";
import ffmpeg from 'fluent-ffmpeg';
import path from 'path'; // Import path module
import os from 'os'; // Import os module for temp directory
import { performance } from 'perf_hooks'; // Import performance for timing
import logger from './logger'; // Import the logger

// --- Configuration ---
const UPLOAD_DIR = path.join(os.tmpdir(), 'transcribe-poc-uploads'); // Use OS temp directory
const FFMPEG_TIMEOUT_SECONDS = 60 * 5; // 5 minutes timeout for conversion

// --- Multer Setup ---
// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const upload = multer({ dest: UPLOAD_DIR }); 

// --- Express App Setup ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Helper Function for Cleanup ---
const cleanupFiles = async (...filePaths: (string | undefined)[]) => {
    for (const filePath of filePaths) {
        if (filePath) {
            try {
                await fs.promises.unlink(filePath);
                logger.info(`Successfully deleted temp file: ${filePath}`); // Use logger
            } catch (err: any) {
                // Log error but don't throw
                logger.error(`Failed to delete temp file ${filePath}:`, { // Use logger
                    message: err.message,
                    code: err.code,
                    syscall: err.syscall,
                    path: err.path
                });
            }
        }
    }
};

// --- Transcription Route ---
app.post("/api/transcribe", upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
    const requestStartTime = performance.now(); // Start timing the overall request
    logger.info("Received request on /api/transcribe"); // Use logger
    logger.info("Uploaded file details:", { file: req.file }); // Use logger, pass file object

    if (!req.file) {
        return next(new Error("No file uploaded."));
    }
    if (!process.env.OPENAI_API_KEY) {
        logger.error("OPENAI_API_KEY is not set in the environment."); // Use logger
        await cleanupFiles(req.file.path);
        return next(new Error("Server configuration error: Missing API key."));
    }

    const originalFilePath = req.file.path;
    const originalFilename = req.file.originalname;
    let convertedAudioPath: string | undefined = undefined;

    try {
        // --- 1. Convert with FFmpeg (to WAV 16kHz mono) --- 
        const ffmpegStartTime = performance.now();
        // Output WAV instead of MP3
        const outputFilename = `${path.parse(originalFilename).name}_${Date.now()}.wav`; 
        convertedAudioPath = path.join(UPLOAD_DIR, outputFilename);
        logger.info(`Starting conversion to WAV: ${originalFilePath} -> ${convertedAudioPath}`);

        if (!convertedAudioPath) {
            throw new Error("Internal server error: Converted audio path not generated.");
        }
        const finalConvertedPath = convertedAudioPath;

        await new Promise<void>((resolve, reject) => {
            const command = ffmpeg(originalFilePath)
                .noVideo() // Ensure no video
                .audioFrequency(16000) // Set audio frequency to 16kHz
                .audioChannels(1) // Set audio channels to 1 (mono)
                .outputOption('-sample_fmt s16') // Specify sample format if needed, though often implied by wav
                // Remove MP3 specific options: .audioCodec('libmp3lame').audioBitrate('192k').format('mp3')
                .output(finalConvertedPath) // Output to WAV path
                .on('start', (commandLine) => logger.info('FFmpeg Spawned: ' + commandLine))
                .on('error', (err, stdout, stderr) => {
                    logger.error('FFmpeg Error:', { message: err.message, stdout: stdout, stderr: stderr });
                    reject(new Error(`FFmpeg conversion failed: ${err.message}`));
                })
                .on('end', () => resolve());
            command.run();
        });
        const ffmpegEndTime = performance.now();
        logger.info(`FFmpeg Conversion finished successfully in ${(ffmpegEndTime - ffmpegStartTime).toFixed(2)} ms.`);

        if (!fs.existsSync(finalConvertedPath)) {
             throw new Error("FFmpeg conversion finished but output file not found.");
        }
        const stats = await fs.promises.stat(finalConvertedPath);
        logger.info(`Converted file size: ${(stats.size / (1024*1024)).toFixed(2)} MB`); // Use logger

        // --- 2. Transcribe with OpenAI (Requesting SRT directly again) --- 
        logger.info(`Attempting to transcribe converted file: ${finalConvertedPath} with model whisper-1 (requesting SRT)`);
        const openaiStartTime = performance.now();
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        // Request SRT format directly
        const transcriptionResponse = await openai.audio.transcriptions.create({
            model: "whisper-1",
            file: fs.createReadStream(finalConvertedPath),
            response_format: "srt", // <-- Request SRT
        });
        const openaiEndTime = performance.now();
        
        // NOTE: transcriptionResponse for 'srt' format is expected to be the raw SRT string.
        const srtContent = transcriptionResponse as string; 
        logger.info("Raw OpenAI SRT Response:", srtContent); // Log the received SRT string

        logger.info(`OpenAI transcription (SRT) successful in ${(openaiEndTime - openaiStartTime).toFixed(2)} ms.`);
        
        // --- 3. Send Response (No SRT conversion needed) --- 
        logger.info("Sending response...");
        res
            .header("Content-Disposition", `attachment; filename="${path.parse(originalFilename).name}.srt"`)
            .type("text/plain") // SRT is plain text
            .send(srtContent); // <-- Send the SRT content directly
        const requestEndTime = performance.now(); 
        logger.info(`SRT response sent. Total processing time: ${(requestEndTime - requestStartTime).toFixed(2)} ms.`);

    } catch (e) {
        const requestEndTime = performance.now();
        logger.error(`Error after ${(requestEndTime - requestStartTime).toFixed(2)} ms:`, e); // Use logger
        return next(e instanceof Error ? e : new Error(String(e)));
    } finally {
        logger.info("Executing finally block for file cleanup."); // Use logger
        await cleanupFiles(originalFilePath, convertedAudioPath);
    }
});

// --- Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error("--- Error Handler Caught Error ---", err); // Use logger, pass error object

    if (res.headersSent) {
        logger.error("Headers already sent, delegating to default handler.");
        return next(err);
    }
    if (err instanceof multer.MulterError) {
        logger.error("Multer Error Details:", { code: err.code, field: err.field }); // Log specific Multer details
        res.status(400).json({ error: `File upload error: ${err.message}`, code: err.code });
        return;
    }
    if (err.message.startsWith("FFmpeg conversion failed")) {
        res.status(500).json({ error: "Failed to process media file.", details: err.message });
        return;
    }
    if (err.message === "No file uploaded.") {
        res.status(400).json({ error: err.message });
        return;
    }
    if (err.message === "Server configuration error: Missing API key.") {
        res.status(500).json({ error: "Server configuration error."});
        return;
    }
    if (err instanceof OpenAI.APIError) {
        // Log specific OpenAI error details
        logger.error("OpenAI API Error Details:", { 
            status: err.status, 
            type: err.type, 
            code: err.code, 
            param: err.param, 
            // headers: err.headers // Headers can be verbose
        }); 
        res.status(err.status || 500).json({ error: `OpenAI API Error: ${err.message}`, type: err.type, code: err.code });
        return;
    }

    // Log generic error before sending response
    logger.error("Unhandled Error:", err); 
    res.status(500).json({ error: "An unexpected server error occurred." });
});

// --- Server Start ---
const port = 5174;
app.listen(port, () => logger.info(`🚀 Backend server started on http://localhost:${port}`)); // Use logger 