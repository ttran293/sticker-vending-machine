"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useId, useRef, useState } from "react";
import { STICKER_FOLDER_OPTIONS } from "@/lib/stickerMetadata";
import styles from "./StickerUploadPanel.module.css";

type Props = {
  folderOptions?: typeof STICKER_FOLDER_OPTIONS;
};

export default function StickerUploadPanel({ folderOptions = STICKER_FOLDER_OPTIONS }: Props) {
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState(folderOptions[0]?.id ?? "hat-dog");
  const [customFolder, setCustomFolder] = useState("");
  const [useCustomFolder, setUseCustomFolder] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<{ w: number; h: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearSelection() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setSelectedFile(null);
    setPreviewSize(null);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    setSuccess(null);
    setPreviewSize(null);
    setSelectedFile(file ?? null);

    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      if (!file) return null;

      const url = URL.createObjectURL(file);
      const probe = new window.Image();
      probe.onload = () => {
        setPreviewSize({ w: probe.naturalWidth, h: probe.naturalHeight });
      };
      probe.src = url;
      return url;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image file to upload.");
      return;
    }

    const targetFolder = useCustomFolder ? customFolder.trim() : folder;
    if (!targetFolder) {
      setError("Choose or enter a folder name.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", targetFolder);
    if (replaceExisting) formData.append("replace", "true");

    setUploading(true);

    try {
      const response = await fetch("/api/admin/stickers", {
        method: "POST",
        body: formData,
      });

      let data: { error?: string; entry?: { name?: string } } = {};
      try {
        const raw = await response.text();
        if (raw.trim()) data = JSON.parse(raw) as typeof data;
      } catch {
        if (response.ok) {
          throw new Error("Server returned an invalid response.");
        }
      }

      if (!response.ok) {
        setError(
          data.error ??
            (response.status === 401
              ? "You are not logged in. Refresh and sign in again."
              : `Upload failed (${response.status}).`),
        );
        return;
      }

      setSuccess(data.entry?.name ? `${data.entry.name} uploaded.` : "Sticker uploaded.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      clearSelection();
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const targetFolderLabel = useCustomFolder
    ? customFolder.trim() || "new folder"
    : folderOptions.find((option) => option.id === folder)?.label ?? folder;

  return (
    <section className={styles.panel} aria-labelledby="sticker-upload-title">
      <header className={styles.head}>
        <h2 id="sticker-upload-title" className={styles.title}>
          Add sticker
        </h2>
        <p className={styles.note}>PNG, JPG, WEBP, or GIF · saved to S3</p>
      </header>

      <div className={styles.split}>
        <div className={styles.formCol}>
          <h3 className={styles.colTitle}>Upload</h3>

          <form className={styles.form} onSubmit={handleSubmit}>
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

            <div className={styles.field}>
              <span className={styles.label}>Folder</span>
              <div className={styles.folderTabs} role="tablist" aria-label="Folder type">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!useCustomFolder}
                  className={`${styles.folderTab}${!useCustomFolder ? ` ${styles.folderTabActive}` : ""}`}
                  onClick={() => setUseCustomFolder(false)}
                  disabled={uploading}
                >
                  Existing
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={useCustomFolder}
                  className={`${styles.folderTab}${useCustomFolder ? ` ${styles.folderTabActive}` : ""}`}
                  onClick={() => setUseCustomFolder(true)}
                  disabled={uploading}
                >
                  New
                </button>
              </div>

              {!useCustomFolder ? (
                <select
                  value={folder}
                  onChange={(event) => setFolder(event.target.value)}
                  disabled={uploading}
                  className={styles.control}
                >
                  {folderOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={customFolder}
                  onChange={(event) => setCustomFolder(event.target.value)}
                  placeholder="folder-name"
                  disabled={uploading}
                  className={styles.control}
                />
              )}
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
            {success && (
              <p className={`${styles.feedback} ${styles.feedbackSuccess}`}>{success}</p>
            )}

            <button type="submit" className={`btn-primary ${styles.submit}`} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload sticker"}
            </button>
          </form>
        </div>

        <aside className={styles.previewCol} aria-live="polite">
          <h3 className={styles.colTitle}>Preview</h3>

          <div className={styles.previewCard}>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={selectedFile?.name ?? "Sticker preview"} />
            ) : (
              <p className={styles.previewEmpty}>Select an image to see it here</p>
            )}
          </div>

          <dl className={styles.previewMeta}>
            <div className={styles.previewMetaRow}>
              <dt>File</dt>
              <dd>{selectedFile?.name ?? "—"}</dd>
            </div>
            <div className={styles.previewMetaRow}>
              <dt>Size</dt>
              <dd>{previewSize ? `${previewSize.w} × ${previewSize.h}px` : "—"}</dd>
            </div>
            <div className={styles.previewMetaRow}>
              <dt>Folder</dt>
              <dd>{targetFolderLabel}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
