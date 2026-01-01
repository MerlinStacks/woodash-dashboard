
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Minio = require('minio');

// Minio package exports the Client constuctor directly or as a property property depending on version/bundling
// Usually const Minio = require('minio'); var minioClient = new Minio.Client(..);

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER || 'admin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'password'
});

export const bucketExists = async (bucket: string) => {
    try {
        return await minioClient.bucketExists(bucket);
    } catch (e) {
        return false;
    }
}

export const ensureBucket = async (bucket: string) => {
    const exists = await bucketExists(bucket);
    if (!exists) {
        try {
            await minioClient.makeBucket(bucket, 'us-east-1');
        } catch (e: any) {
            console.error(`Failed to create bucket ${bucket}:`, e.message);
        }
    }
}

export default minioClient;
