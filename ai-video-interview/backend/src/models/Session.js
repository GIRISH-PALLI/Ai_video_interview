const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChunkSchema = new Schema({ seq: Number, key: String, size: Number, checksum: String });

const SessionSchema = new Schema({
  sessionId: { type: String, unique: true },
  candidate: { type: Object },
  chunks: [ChunkSchema],
  mergedKey: { type: String },
  transcript: { type: Object },
  flags: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', SessionSchema);
