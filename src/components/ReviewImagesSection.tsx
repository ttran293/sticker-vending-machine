"use client";

import Image from "next/image";
import { startTransition, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReviewImage } from "@/lib/reviewImages";
import styles from "./ReviewImagesSection.module.css";

type Props = {
  initialImages: ReviewImage[];
};

export default function ReviewImagesSection({ initialImages }: Props) {
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearPreview() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setSelectedFile(null);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    setSuccess(null);
    setSelectedFile(file ?? null);

    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (replaceExisting) formData.append("replace", "true");

    setUploading(true);

    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        body: formData,
      });

      let data: { error?: string; image?: ReviewImage } = {};
      try {
        const raw = await response.text();
        if (raw.trim()) data = JSON.parse(raw) as typeof data;
      } catch {
        if (response.ok) {
          throw new Error("Server returned an invalid response.");
        }
      }

      if (!response.ok) {
        setError(data.error ?? `Upload failed (${response.status}).`);
        return;
      }

      setSuccess("Review image uploaded.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      clearPreview();
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imagePath: string) {
    if (!window.confirm("Delete this review image from S3?")) return;

    setDeletingPath(imagePath);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_path: imagePath }),
      });

      let data: { error?: string } = {};
      try {
        const raw = await response.text();
        if (raw.trim()) data = JSON.parse(raw) as typeof data;
      } catch {
        if (response.ok) {
          throw new Error("Server returned an invalid response.");
        }
      }

      if (!response.ok) {
        setError(data.error ?? `Delete failed (${response.status}).`);
        return;
      }

      setSuccess("Review image deleted.");
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingPath(null);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="review-images-title">
      <header className={styles.head}>
        <h2 id="review-images-title" className={styles.title}>
          Review images
        </h2>
        <p className={styles.note}>
          Shown in OFF THE RACK · stored in S3 under <code>reviews/</code>
        </p>
      </header>

      <div className={styles.split}>
        <div className={styles.formCol}>
          <h3 className={styles.colTitle}>Upload</h3>

          <form className={styles.form} onSubmit={handleUpload}>
            <div className={styles.field}>
              <span className={styles.label}>Image file</span>
              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className={styles.fileInput}
                disabled={uploading}
                onChange={handleFileChange}
              />
              <label htmlFor={fileInputId} className={styles.fileBtn}>
                Browse files
              </label>
              <p className={styles.fileName}>{selectedFile?.name ?? "No file selected"}</p>
            </div>

            <label className={styles.replace}>
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(event) => setReplaceExisting(event.target.checked)}
                disabled={uploading}
              />
              <span>Replace if same name exists</span>
            </label>

            {error && <p className={`${styles.feedback} ${styles.feedbackError}`}>{error}</p>}
            {success && <p className={`${styles.feedback} ${styles.feedbackSuccess}`}>{success}</p>}

            <button type="submit" className={`btn-primary ${styles.submit}`} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload review image"}
            </button>
          </form>
        </div>

        <aside className={styles.previewCol} aria-live="polite">
          <h3 className={styles.colTitle}>Preview</h3>
          <div className={styles.previewCard}>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={selectedFile?.name ?? "Review preview"} />
            ) : (
              <p className={styles.previewEmpty}>Select an image to preview before upload</p>
            )}
          </div>
        </aside>
      </div>

      <div className={styles.gridSection}>
        <div className={styles.gridHead}>
          <h3 className={styles.gridTitle}>Current gallery</h3>
          <p className={styles.gridCount}>{images.length} image{images.length === 1 ? "" : "s"}</p>
        </div>

        {images.length === 0 ? (
          <p className={styles.empty}>No review images yet. Upload one to populate OFF THE RACK.</p>
        ) : (
          <div className={styles.grid}>
            {images.map((entry) => (
              <article key={entry.path} className={styles.card}>
                <div className={styles.cardArt}>
                  <Image
                    src={entry.image}
                    alt={entry.alt}
                    fill
                    sizes="140px"
                    className={styles.cardImg}
                  />
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardName}>{entry.path.replace(/^\/reviews\//, "")}</p>
                </div>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(entry.path)}
                  disabled={deletingPath === entry.path}
                >
                  {deletingPath === entry.path ? "Deleting…" : "Delete"}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
