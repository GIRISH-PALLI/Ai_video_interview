import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import * as faceapi from 'face-api.js';

export default function Recorder({ sessionId, onStatusChange, onProctorEvent, onReady }) {
  const mediaRef = useRef(null);
  const socketRef = useRef(null);
  const recorderRef = useRef(null);
  const seqRef = useRef(0);

  const emitStatus = (status, extra = {}) => {
    if (onStatusChange) onStatusChange({ status, ...extra });
  };

  useEffect(() => {
    let detectInterval;
    let visibilityHandler;
    let faceModelReady = false;

    async function init() {
      emitStatus('requesting-media');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      mediaRef.current.srcObject = stream;
      mediaRef.current.play();

      if (onReady) onReady({ stream });

      const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000');
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('init', { sessionId, role: 'candidate' }));
      socket.on('ack', ({ seq }) => console.log('ack', seq));
      socket.on('nack', (e) => console.error('nack', e));
      socket.on('recording:queued', () => emitStatus('processing'));
      socket.on('proctor:server', (evt) => {
        if (onProctorEvent) onProctorEvent(evt);
      });

      // load face-api models (ensure public/models contains models)
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        faceModelReady = true;
      } catch (e) {
        console.warn('face-api model load failed', e);
        faceModelReady = false;
      }

      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;
      emitStatus('ready');

      recorder.ondataavailable = (e) => {
        if (!e.data || e.data.size === 0) return;
        const reader = new FileReader();
        const seq = seqRef.current++;
        reader.onload = () => {
          const arrayBuffer = reader.result;
          socket.emit('chunk', { sessionId, seq, contentType: e.data.type }, arrayBuffer);
        };
        reader.readAsArrayBuffer(e.data);
      };

      recorder.start(1000); // emit every second
      emitStatus('recording');

      // Proctoring: visibility (tab switch)
      visibilityHandler = () => {
        const payload = { type: 'visibility', visible: !document.hidden, ts: Date.now() };
        socket.emit('proctor:event', payload);
        if (onProctorEvent) onProctorEvent(payload);
      };
      document.addEventListener('visibilitychange', visibilityHandler);

      // Proctoring: face presence detection
      if (faceModelReady) {
        detectInterval = setInterval(async () => {
          try {
            if (!mediaRef.current) return;
            const detections = await faceapi.detectAllFaces(mediaRef.current, new faceapi.TinyFaceDetectorOptions());
            const facePresent = detections && detections.length > 0;
            const payload = { type: 'face', present: facePresent, ts: Date.now() };
            socket.emit('proctor:event', payload);
            if (onProctorEvent) onProctorEvent(payload);
          } catch (e) { /* ignore detection errors */ }
        }, 1500);
      } else {
        console.warn('Face detection disabled because the TinyFaceDetector model is not loaded.');
      }
    }
    init();

    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
      if (socketRef.current) {
        try { socketRef.current.emit('recording:complete', { sessionId }); } catch(e){}
        socketRef.current.disconnect();
      }
      if (mediaRef.current && mediaRef.current.srcObject) mediaRef.current.srcObject.getTracks().forEach(t => t.stop());
      if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
      try { clearInterval(detectInterval); } catch(e){}
      emitStatus('stopped');
    };
  }, [sessionId]);

  return (
    <div>
      <video ref={mediaRef} width={320} height={240} autoPlay muted playsInline style={{ width: '100%', borderRadius: 16, background: '#111', objectFit: 'cover' }} />
    </div>
  );
}
