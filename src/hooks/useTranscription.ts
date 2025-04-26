import { useState, useCallback } from 'react';
import { transcribeFile } from '../services/transcriptionService';

interface UseTranscriptionReturn {
    file: File | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    isTranscribing: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    handleTranscriptionSubmit: () => Promise<void>;
}

export function useTranscription(): UseTranscriptionReturn {
    const [file, setFile] = useState<File | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTranscriptionSubmit = useCallback(async () => {
        if (!file) return;

        setIsTranscribing(true);
        setError(null);

        try {
            await transcribeFile(file);
            // Optionally reset the file input after successful transcription
            // setFile(null);
        } catch (err) {
            console.error("Transcription request failed:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during transcription.");
        } finally {
            setIsTranscribing(false);
        }
    }, [file]); // Dependency array includes file

    return {
        file,
        setFile,
        isTranscribing,
        error,
        setError,
        handleTranscriptionSubmit,
    };
} 