const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const AWS = require('aws-sdk');

const S3 = new AWS.S3({ region: process.env.AWS_REGION });

router.get('/', async (req, res) => {
  const sessions = await Session.find({}, { sessionId: 1, candidate: 1, createdAt: 1, flags: 1 }).lean();
  res.json(sessions);
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const session = await Session.findOne({ sessionId: id }).lean();
  if (!session) return res.status(404).json({ error: 'not found' });

  let mergedUrl = null;
  if (session.mergedKey) {
    try {
      mergedUrl = await S3.getSignedUrlPromise('getObject', { Bucket: process.env.S3_BUCKET, Key: session.mergedKey, Expires: 3600 });
    } catch (e) { console.warn('presign failed', e); }
  }

  res.json({ ...session, mergedUrl });
});

router.post('/:id/transcript', async (req, res) => {
  const id = req.params.id;
  const { transcript } = req.body;
  const session = await Session.findOneAndUpdate({ sessionId: id }, { $set: { transcript } }, { new: true, upsert: false });
  if (!session) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

router.post('/:id/merged', async (req, res) => {
  const id = req.params.id;
  const { mergedKey } = req.body;
  await Session.findOneAndUpdate({ sessionId: id }, { $set: { mergedKey } }, { upsert: true });
  res.json({ ok: true });
});

module.exports = router;
