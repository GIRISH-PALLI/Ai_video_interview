# AI Video Interview System

**Problem Understanding**
- **Problem:** First-round manual interviews are slow and hard to scale.
- **Need:** Recruiters need an asynchronous screening step that captures high-fidelity audio/video, produces transcripts, and flags suspicious behavior.

**Architecture Overview**
- **Frontend:** Next.js app with MediaRecorder API and Socket.io client ([frontend](frontend)).
- **Backend:** Node.js + Express + Socket.io handling chunk ingestion, session orchestration, and API endpoints ([backend](backend)).
- **DB:** MongoDB stores session metadata and transcripts.
- **Storage:** AWS S3 stores chunks and merged media.
- **Queue/Workers:** AWS SQS queues drive FFmpeg merge and Deepgram transcription workers ([worker](worker)).

**Media Flow (frontend → backend → storage → transcription)**
- Capture: Browser `MediaRecorder` emits short blobs (configurable, e.g. 1s).
- Transport: Blobs are sent via Socket.io `chunk` events with `{sessionId, seq, contentType}`.
- Persist: Backend writes each chunk to S3 at `sessions/<sessionId>/chunk_<seq>.part` and records chunk metadata in MongoDB `Session`.
- Merge: Client emits `recording:complete` which enqueues an SQS merge job; a worker downloads ordered chunks, concatenates them with `ffmpeg`, uploads `sessions/<sessionId>/merged.webm`.
- Transcribe: Merge worker enqueues a transcribe job; a transcribe worker downloads merged file and sends to Deepgram, then POSTs transcript to backend.

**WebSocket / Event Flow**
- Client connects to Socket.io and emits `init` with `sessionId` and role.
- Client sends `chunk` (binary) events; server responds with `ack(seq)` on successful persist.
- Client sends `proctor:event` with `{type: 'visibility'|'face', ...}` for real-time proctoring.
- Client emits `recording:complete` on finish — server enqueues merge job to SQS.

**Technical Decisions & Tradeoffs**
- **Streaming over full upload:** Streaming ensures partial persistence on disconnect, reduces memory spikes, and enables real-time proctoring at the cost of ordering/idempotency complexity.
- **Serverless workers + SQS:** Keeps API responsive and auto-scales workers for CPU-bound FFmpeg tasks and transcription jobs.
- **FFmpeg for merge:** Deterministic, fast, and works with containerized workers.

**Failure Scenarios & Edge Cases**
- Network interruptions: some chunks may be lost; client retries and server-side resume using last ACK.
- Duplicate chunks: clients may retransmit; server treats same `seq` as idempotent (compare checksum).
- Camera/mic disconnects: frontend detects and emits proctor events; session records gaps.
- Partial upload failures: SQS-driven retry and DLQ for failed jobs.
- WebSocket reconnects: client resends from last acked sequence.
- Empty/corrupted chunks: backend validates checksums; corrupted chunks quarantined and requested for reupload.

**Recovery Mechanisms**
- **Reconnects:** Client requests `resume_point` by querying last ACK; server resumes ingest.
- **Retries:** Exponential backoff on client resend; server uses SQS retries and DLQ.
- **Chunk recovery:** Deterministic keys (`chunk_000001.part`) allow assembler to re-order; missing chunks cause pause and re-request or produce partial transcript.
- **Failure handling:** Worker failures write errors to DLQ and backend exposes retry endpoints.

**Product Thinking**
- **Recruiter experience:** Dashboard lists candidates, shows quick flags, and provides drill-down with video + aligned transcript.
- **Candidate experience:** Mandatory hardware check, clear progress, and explicit consent for recording.
- **Suspicious activity:** Tab-switch, face-absent, and mute durations are aggregated into `session.flags` for recruiter review.

**Scalability Considerations**
- WebSocket connection limits require managed WS gateways at high concurrency.
- Large numbers of small writes to S3 can be mitigated by chunk bundling or an ingestion gateway.
- FFmpeg merging is CPU-bound — use autoscaled workers, GPU or optimized instances for cost.

**Observability & Debugging**
- Structured JSON logs with `trace_id` and `session_id` for end-to-end tracing.
- Metrics: chunk persist latency, merge time, transcription latency, and proctor flag rates.
- Alerts for DLQ growth, repeated corrupted chunks, and slow merges.

**AI Usage Documentation**
- AI assisted architecture sketches, merge strategy, and prompt iterations saved in `docs/ai_prompts.md`.
- Human reviewed and validated all production-critical code, retry/backoff parameters, and security choices.

**Run Locally (quick)**
Prereqs: Node 16+, ffmpeg, MongoDB, AWS credentials with S3 + SQS access, Deepgram API key.

Backend
```bash
cd backend
npm install
cp .env.example .env
# update .env values
npm run dev
```

Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# update env vars
npm run dev
```

Workers
```bash
cd worker
npm install
# set AWS env vars and TRANSCRIBE_QUEUE_URL
node mergeWorker.js &
node transcribeWorker.js &
```

**Files of Interest**
- Backend socket handler: `backend/src/wsHandler.js` ([open](backend/src/wsHandler.js))
- Session model: `backend/src/models/Session.js` ([open](backend/src/models/Session.js))
- Merge worker: `worker/mergeWorker.js` ([open](worker/mergeWorker.js))
- Transcribe worker: `worker/transcribeWorker.js` ([open](worker/transcribeWorker.js))
- Frontend recorder/proctoring: `frontend/components/Recorder.jsx` ([open](frontend/components/Recorder.jsx))
- Recruiter UI: `frontend/pages/recruiter` ([open](frontend/pages/recruiter.js))

**Demo & Walkthrough**
- Include a recorded walkthrough showing hardware-check → interview → merge → transcription → recruiter review. Save the video alongside the repo and reference it here.

---
If you want, I will now implement the recruiter drill-down UI improvements (search, filters, resume upload) and polish the README diagram. Which should I do next?
