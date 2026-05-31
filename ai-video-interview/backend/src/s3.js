const AWS = require('aws-sdk');
const S3 = new AWS.S3({ region: process.env.AWS_REGION });

exports.uploadBuffer = (key, buffer, contentType) => {
  return S3.putObject({ Bucket: process.env.S3_BUCKET, Key: key, Body: buffer, ContentType: contentType }).promise();
};

exports.listSessionChunks = (sessionId) => {
  const prefix = `sessions/${sessionId}/`;
  return S3.listObjectsV2({ Bucket: process.env.S3_BUCKET, Prefix: prefix }).promise();
};

exports.getObjectStream = (key) => {
  return S3.getObject({ Bucket: process.env.S3_BUCKET, Key: key }).createReadStream();
};
