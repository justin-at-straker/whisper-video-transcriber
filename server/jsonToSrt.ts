import OpenAI from "openai";
// Revert specific import - it didn't resolve the type issue
// import type { Transcription, TranscriptionSegment } from "openai/resources/audio/transcriptions";


export function jsonToSrt(data: OpenAI.Audio.Transcription): string {
    // Remove previous debug logs
    const fmt = (s: number) =>
        new Date(s * 1000).toISOString().substring(11, 23).replace(".", ",");

    // @ts-ignore - SDK type for Transcription seems incomplete for verbose_json format
    const segments = data.segments; 

    if (!segments || !Array.isArray(segments)) {
        console.error("Error: Response does not contain a valid segments array (expected from verbose_json):");
        // Log the actual data received to help debug if this happens
        console.log("Received data:", JSON.stringify(data, null, 2)); 
        throw new TypeError("Invalid transcription data: segments property is missing or not an array.");
    }
    
    return segments
        .map(
            (seg: any, i: number) => { // Use any for seg due to uncertainty from type issues
                if (typeof seg?.start !== 'number' || typeof seg?.end !== 'number' || typeof seg?.text !== 'string') {
                    console.warn(`Skipping segment with invalid structure at index ${i}:`, seg);
                    return null; // Skip invalid segments
                }
                return [i + 1, `${fmt(seg.start)} --> ${fmt(seg.end)}`, seg.text.trim(), ""].join("\n");
            }
        )
        .filter(line => line !== null) // Filter out skipped segments
        .join("\n");
} 