import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranscription } from "./hooks/useTranscription"; // Import the custom hook

export default function App() {
  // Use the custom hook to manage state and logic
  const {
    file,
    setFile,
    isTranscribing,
    error,
    setError, // Get setError to clear errors on new file selection
    handleTranscriptionSubmit
  } = useTranscription();

  // Wrapper for form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTranscriptionSubmit(); // Call the hook's submit handler
  };

  // Handler for file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
    if (selectedFile) {
        setError(null); // Clear error when a new file is selected
    }
    // Reset the input value if the same file needs to be selectable again after processing
    // e.target.value = ''; 
  };

  return (
    <main className="container mx-auto max-w-2xl space-y-8 p-8">
      <h1 className="text-2xl font-semibold">Transcribe Audio/Video</h1>
      
      {/* Form for file upload */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="file">Media file (audio or video)</Label>
          <Input
            id="file"
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileChange} // Use dedicated handler
            disabled={isTranscribing}
            // To allow selecting the same file again after processing, 
            // manage the input's value explicitly or reset it in handleFileChange.
            // value={file ? '' : undefined} // This approach has limitations
          />
        </div>

        <Button type="submit" disabled={!file || isTranscribing}>
          {isTranscribing ? "Transcribing..." : "Transcribe and Download SRT"}
        </Button>
      </form>

      {/* Display transcription status */}
      {isTranscribing && (
        <div className="flex items-center space-x-2 text-muted-foreground">
          <p>Processing, please wait...</p>
          {/* Spinner or more sophisticated loading indicator could go here */}
        </div>
      )}

      {/* Display error message */}
      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}
    </main>
  );
}
