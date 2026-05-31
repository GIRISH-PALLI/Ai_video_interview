const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const S3 = new AWS.S3({ region: process.env.AWS_REGION });
const SQS = new AWS.SQS({ region: process.env.AWS_REGION });
const Session = require('./models/Session');

function s3Key(sessionId, seq) {
  return `sessions/${sessionId}/chunk_${String(seq).padStart(6,'0')}.part`;
}

exports.handleSocket = (socket, io) => {
  console.log('WS connected', socket.id);
  socket.on('init', ({ sessionId, role }) => {
    socket.join(sessionId);
    socket.data.sessionId = sessionId;
    socket.data.role = role;
  });

  // Expect binary chunks with metadata
  socket.on('chunk', async (meta, dataBuffer) => {
    // meta: { seq, contentType }
    try {
      const sessionId = socket.data.sessionId || meta.sessionId || uuidv4();
      const seq = meta.seq;
      const key = s3Key(sessionId, seq);
      await S3.putObject({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: Buffer.from(dataBuffer),
        ContentType: meta.contentType || 'application/octet-stream'
      }).promise();
      // persist chunk metadata to DB
      await Session.findOneAndUpdate(
        { sessionId },
        { $setOnInsert: { sessionId }, $push: { chunks: { seq, key, size: meta.size || null, checksum: meta.checksum || null } } },
        { upsert: true }
      );
      socket.emit('ack', { seq });
    } catch (err) {
      console.error('chunk upload error', err);
      socket.emit('nack', { error: err.message, seq: meta.seq });
    }
  });

  socket.on('proctor:event', (evt) => {
    const sessionId = socket.data.sessionId;
    if (sessionId) io.to(sessionId).emit('proctor:server', evt);
  });

  socket.on('recording:complete', async (meta) => {
    // meta: { sessionId }
    const sessionId = socket.data.sessionId || (meta && meta.sessionId);
    if (!sessionId) return socket.emit('error', { message: 'no sessionId' });
    const queueUrl = process.env.SQS_URL;
    if (!queueUrl) return socket.emit('error', { message: 'no merge queue configured' });
    try {
      await SQS.sendMessage({ QueueUrl: queueUrl, MessageBody: JSON.stringify({ sessionId }) }).promise();
      socket.emit('recording:queued', { sessionId });
    } catch (e) {
      console.error('enqueue merge failed', e);
      socket.emit('error', { message: 'enqueue failed' });
    }
  });

  socket.on('disconnect', () => console.log('WS disconnected', socket.id));
};
