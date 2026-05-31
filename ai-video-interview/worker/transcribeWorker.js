require('dotenv').config();

/**
 * After merge, upload file to Deepgram and save transcript (simplified)
 * Message: { sessionId, mergedKey }
 */
const AWS = require('aws-sdk');
const axios = require('axios');
const fs = require('fs');

function buildAwsConfig() {
  const config = { region: process.env.AWS_REGION };
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = new AWS.Credentials({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN
    });
  } else if (process.env.AWS_PROFILE) {
    config.credentials = new AWS.SharedIniFileCredentials({ profile: process.env.AWS_PROFILE });
  }
  return config;
}

const awsConfig = buildAwsConfig();
const s3 = new AWS.S3(awsConfig);
const sqs = new AWS.SQS(awsConfig);
const TRANSCRIBE_QUEUE = process.env.TRANSCRIBE_QUEUE_URL;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

function assertConfig() {
  const missing = [];
  if (!process.env.AWS_REGION) missing.push('AWS_REGION');
  if (!process.env.S3_BUCKET) missing.push('S3_BUCKET');
  if (!process.env.DEEPGRAM_API_KEY) missing.push('DEEPGRAM_API_KEY');
  if (!TRANSCRIBE_QUEUE) missing.push('TRANSCRIBE_QUEUE_URL');
  const hasKeyPair = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
  const hasProfile = process.env.AWS_PROFILE;
  if (!hasKeyPair && !hasProfile) {
    missing.push('AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or AWS_PROFILE');
  }

  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Create worker/.env from worker/.env.example before starting this worker.');
    process.exit(1);
  }
}

assertConfig();

async function transcribe(sessionId, mergedKey) {
  const tmp = `/tmp/${sessionId}_merged.webm`;
  const res = await s3.getObject({ Bucket: process.env.S3_BUCKET, Key: mergedKey }).promise();
  fs.writeFileSync(tmp, res.Body);

  const resp = await axios.post('https://api.deepgram.com/v1/listen', fs.createReadStream(tmp), {
    headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`, 'Content-Type': 'audio/webm' }
  });
  console.log('Deepgram response', resp.data);

  // Send transcript to backend
  try {
    await axios.post(`${BACKEND_URL}/sessions/${sessionId}/transcript`, { transcript: resp.data });
    console.log('Saved transcript to backend');
  } catch (e) { console.error('save transcript failed', e.message); }
}

async function poll() {
  if (!TRANSCRIBE_QUEUE) { console.error('No TRANSCRIBE_QUEUE_URL configured'); return; }
  const params = { QueueUrl: TRANSCRIBE_QUEUE, MaxNumberOfMessages: 1, WaitTimeSeconds: 20 };
  const res = await sqs.receiveMessage(params).promise();
  if (!res.Messages) return;
  const msg = res.Messages[0];
  const body = JSON.parse(msg.Body);
  const sessionId = body.sessionId;
  const mergedKey = body.mergedKey;
  try {
    await transcribe(sessionId, mergedKey);
    await sqs.deleteMessage({ QueueUrl: TRANSCRIBE_QUEUE, ReceiptHandle: msg.ReceiptHandle }).promise();
  } catch (e) { console.error('transcribe error', e); }
}

(async function main(){
  while(true) {
    try{ await poll(); } catch(e){ console.error(e); }
  }
})();
