import { useState } from "react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/kibo-ui/dropzone";
import { Spinner } from "@/components/kibo-ui/spinner";
import { uploadContract } from "@/utils/contracts";

type ContractUploadProps = {
  onUploaded: (contractId: string) => void;
};

export function ContractUpload({ onUploaded }: ContractUploadProps) {
  const [files, setFiles] = useState<File[] | undefined>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDrop(accepted: File[]) {
    const file = accepted[0];
    if (!file) {
      return;
    }

    setFiles(accepted);
    setError(null);
    setUploading(true);

    try {
      const result = await uploadContract(file);
      onUploaded(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setFiles(undefined);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Dropzone
        accept={{ "application/pdf": [".pdf"] }}
        disabled={uploading}
        maxFiles={1}
        maxSize={20 * 1024 * 1024}
        onDrop={handleDrop}
        onError={(err) => setError(err.message)}
        src={files}
      >
        <DropzoneEmptyState>
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Spinner variant="throbber" />
              <p className="text-sm text-muted-foreground">Uploading…</p>
            </div>
          ) : undefined}
        </DropzoneEmptyState>
        <DropzoneContent />
      </Dropzone>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Upload a PDF contract. Analysis starts automatically in the
          background.
        </p>
      )}
    </div>
  );
}
