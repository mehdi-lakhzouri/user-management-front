"use client";
import { useDropzone } from "react-dropzone";
import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AvatarDropzoneProps {
  onFileSelect: (file: File) => void;
  previewUrl?: string;
  error?: string;
}

export function AvatarDropzone({ onFileSelect, previewUrl, error }: AvatarDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isFocused, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center p-4 gap-2",
        isDragActive ? "border-primary/80 bg-primary/10 scale-105" : "",
        isFocused ? "ring-2 ring-primary" : "",
        isDragReject || error ? "border-destructive bg-destructive/10" : ""
      )}
      style={{ minHeight: 120 }}
    >
      <input {...getInputProps()} />
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Aperçu de l'avatar"
          className="w-20 h-20 rounded-full object-cover shadow-lg transition-transform duration-300 hover:scale-110"
        />
      ) : (
        <div className="text-center text-muted-foreground select-none">
          {isDragActive ? (
            <p>Déposez votre avatar ici...</p>
          ) : (
            <p>Glissez-déposez ou cliquez pour sélectionner un avatar (JPG, PNG, max 5MB)</p>
          )}
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </Card>
  );
}
