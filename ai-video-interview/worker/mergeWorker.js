require('dotenv').config();

/**
 * Worker that polls SQS for merge jobs (simplified) and runs ffmpeg to concatenate chunks
 * Message body expected: { sessionId }
 */
const AWS = require('aws-sdk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
const BUCKET = process.env.S3_BUCKET;
const QUEUE_URL = process.env.SQS_URL;

function assertConfig() {
  const missing = [];
  if (!process.env.AWS_REGION) missing.push('AWS_REGION');
  if (!BUCKET) missing.push('S3_BUCKET');
  if (!QUEUE_URL) missing.push('SQS_URL');
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

async function poll() {
  const params = { QueueUrl: QUEUE_URL, MaxNumberOfMessages: 1, WaitTimeSeconds: 20 };
  const res = await sqs.receiveMessage(params).promise();
  if (!res.Messages) return;
  const msg = res.Messages[0];
  const body = JSON.parse(msg.Body);
  const sessionId = body.sessionId;
  console.log('Merge job for', sessionId);

  const list = await s3.listObjectsV2({ Bucket: BUCKET, Prefix: `sessions/${sessionId}/` }).promise();
  const parts = list.Contents.sort((a,b)=>a.Key.localeCompare(b.Key));
  const tmpDir = path.join('/tmp', sessionId);
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const concatFile = path.join(tmpDir, 'files.txt');
  const streams = [];
  for (let i=0;i<parts.length;i++){
    const key = parts[i].Key;
    const local = path.join(tmpDir, `chunk_${i}.webm`);
    const out = fs.createWriteStream(local);
    await new Promise((res2, rej)=>{
      s3.getObject({ Bucket: BUCKET, Key: key }).createReadStream().pipe(out).on('finish', res2).on('error', rej);
    });
    fs.appendFileSync(concatFile, `file '${local}'\n`);
  }

  const output = path.join(tmpDir, 'merged.webm');
  // Run ffmpeg concat
  execSync(`ffmpeg -y -f concat -safe 0 -i ${concatFile} -c copy ${output}`);

  // Upload merged
  const mergedKey = `sessions/${sessionId}/merged.webm`;
  await s3.putObject({ Bucket: BUCKET, Key: mergedKey, Body: fs.readFileSync(output), ContentType: 'video/webm' }).promise();
  console.log('Uploaded merged', mergedKey);

  // Notify backend (optional) and/or enqueue transcription
  try {
    // send message to transcription queue if configured
    const transcribeQueue = process.env.TRANSCRIBE_QUEUE_URL;
    if (transcribeQueue) {
      const payload = { sessionId, mergedKey };
      await sqs.sendMessage({ QueueUrl: transcribeQueue, MessageBody: JSON.stringify(payload) }).promise();
      console.log('enqueued transcribe job');
    }
  } catch (e) { console.error('enqueue transcribe failed', e); }

  // Delete message
  await sqs.deleteMessage({ QueueUrl: QUEUE_URL, ReceiptHandle: msg.ReceiptHandle }).promise();
}

(async function main(){
  while(true) {
    try{ await poll(); } catch(e){ console.error(e); }
  }
})();
