
import * as Minio from 'minio';

// Helper to handle both CommonJS and ESM usage of minio if needed, 
// but 'minio' package exports Client class.
// Note: new Minio.Client if wildcard import works, or new Client if named.
// The wildcard import `import * as Minio` results in Minio.Client.

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
        // console.error(e); 
        return false;
    }
}

export const ensureBucket = async (bucket: string) => {
    const exists = await bucketExists(bucket);
    if (!exists) {
        try {
            await minioClient.makeBucket(bucket, 'us-east-1');
        } catch (e) {
            console.error(`Failed to create bucket ${bucket}:`, e);
        }
    }
}

export default minioClient;
