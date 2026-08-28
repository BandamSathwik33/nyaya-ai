import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Mic,
  Square,
  Video,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { ActType } from "../types/legal";

interface CaseUploadSectionProps {
  onSubmitCase: (formData: FormData) => void;
  isLoading: boolean;
}

export const CaseUploadSection: React.FC<CaseUploadSectionProps> = ({ onSubmitCase, isLoading }) => {
  const [caseNotes, setCaseNotes] = useState("");
  const [selectedAct, setSelectedAct] = useState<ActType | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Live Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `Voice_Statement_${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setAttachedFiles((prev) => [...prev, audioFile]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Unable to access microphone. Please check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!caseNotes.trim() && attachedFiles.length === 0) || isLoading) return;

    const formData = new FormData();
    if (caseNotes.trim()) {
      formData.append("case_notes", caseNotes.trim());
    }
    if (selectedAct) {
      formData.append("act_filter", selectedAct);
    }
    attachedFiles.forEach((file) => {
      formData.append("files", file);
    });

    onSubmitCase(formData);
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return <ImageIcon size={16} color="#38bdf8" />;
    if (type.startsWith("audio/")) return <Mic size={16} color="#ec4899" />;
    if (type.startsWith("video/")) return <Video size={16} color="#a855f7" />;
    return <FileText size={16} color="#fbbf24" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#080c14",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "20px",
        padding: "32px",
        position: "relative",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
      }}
    >
      {/* Header & Act Selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#38bdf8",
                background: "rgba(56, 189, 248, 0.1)",
                padding: "2px 8px",
                borderRadius: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Multimodal Evidence Analysis
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "26px",
              fontWeight: 400,
              color: "#ffffff",
              letterSpacing: "-0.01em",
            }}
          >
            Case File & Evidence Upload
          </h2>
          <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", marginTop: "2px" }}>
            Upload legal case files, FIRs, evidence photos, voice recordings, or videos for statutory analysis
          </p>
        </div>

        {/* Act Filter Tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {(["BNS", "BNSS", "BSA"] as const).map((act) => (
            <button
              key={act}
              type="button"
              onClick={() => setSelectedAct(selectedAct === act ? null : act)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: "1px solid",
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: selectedAct === act ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.03)",
                borderColor: selectedAct === act ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.06)",
                color: selectedAct === act ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              {act}
            </button>
          ))}
        </div>
      </div>

      {/* Case Notes Textarea */}
      <div style={{ marginBottom: "16px" }}>
        <textarea
          value={caseNotes}
          onChange={(e) => setCaseNotes(e.target.value)}
          placeholder="Describe the case scenario, factual background, key dates, or specific legal questions you need answered..."
          rows={3}
          style={{
            width: "100%",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "16px",
            color: "#ffffff",
            fontSize: "14px",
            lineHeight: 1.6,
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(56, 189, 248, 0.4)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.08)")}
        />
      </div>

      {/* Multimodal Upload Dropzone & Actions */}
      <div
        style={{
          border: "2px dashed rgba(255, 255, 255, 0.1)",
          borderRadius: "14px",
          padding: "20px",
          background: "rgba(255, 255, 255, 0.015)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.csv,.jpg,.jpeg,.png,.webp,.mp3,.wav,.m4a,.ogg,.webm,.mp4,.mov"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          {/* File Picker Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <UploadCloud size={16} color="#38bdf8" />
            <span>Upload Case Files (PDF / Docs)</span>
          </button>

          {/* Photos & Media Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <ImageIcon size={16} color="#34d399" />
            <span>Photos / Evidence Media</span>
          </button>

          {/* Voice Record Button */}
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "10px",
                background: "rgba(236, 72, 153, 0.1)",
                border: "1px solid rgba(236, 72, 153, 0.3)",
                color: "#ec4899",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Mic size={16} />
              <span>Record Voice Statement</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid #ef4444",
                color: "#ef4444",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                animation: "pulse 1.5s infinite",
              }}
            >
              <Square size={16} />
              <span>Stop Recording ({recordingDuration}s)</span>
            </button>
          )}
        </div>

        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
          Supported: Case Briefs (PDF/DOCX), Crime Scene / FIR Photos, Audio/Voice Recordings, CCTV Videos
        </p>
      </div>

      {/* Attached Files List */}
      {attachedFiles.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: 500 }}>
            Attached Evidence ({attachedFiles.length} item{attachedFiles.length > 1 ? "s" : ""}):
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#ffffff",
                }}
              >
                {getFileIcon(file)}
                <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.name}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>({formatFileSize(file.size)})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Remove file"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={isLoading || (!caseNotes.trim() && attachedFiles.length === 0)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "14px 28px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            cursor: isLoading || (!caseNotes.trim() && attachedFiles.length === 0) ? "not-allowed" : "pointer",
            opacity: isLoading || (!caseNotes.trim() && attachedFiles.length === 0) ? 0.6 : 1,
            boxShadow: "0 10px 25px rgba(37, 99, 235, 0.35)",
            transition: "all 0.2s ease",
          }}
        >
          <Sparkles size={16} />
          <span>{isLoading ? "Analyzing Case Evidence..." : "Analyze Case & Research Statutes"}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
};
