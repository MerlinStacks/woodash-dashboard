
import minioClient, { ensureBucket } from './minio.js';
import axios from 'axios';

const BUCKET_NAME = 'customer-assets';

export const scrapeOrderAssets = async (orderItems: any[]) => {
    // Ensure bucket exists once
    try {
        await ensureBucket(BUCKET_NAME);
    } catch (e) {
        console.error("MinIO Bucket Error:", e);
        return; // specific minio connection error
    }

    for (const order of orderItems) {
        // Robust check for meta_data
        const metadata = Array.isArray(order.meta_data) ? order.meta_data : [];

        // Detect file URLs
        const fileMetas = metadata.filter((m: any) =>
            m && m.value &&
            (typeof m.value === 'string' &&
                (m.value.startsWith('http') || m.value.startsWith('https')) &&
                (m.key.toLowerCase().includes('file') || m.key.toLowerCase().includes('upload') || m.value.match(/\.(jpg|png|pdf|ai|eps|zip)$/i)))
        );

        if (fileMetas.length > 0) {
            console.log(`[Scraper] Processing ${fileMetas.length} assets for Order #${order.id}`);

            for (const meta of fileMetas) {
                const url = meta.value;
                const safeKey = meta.key.replace(/[^a-z0-9]/gi, '_');
                const urlParts = url.split('/');
                const remoteName = urlParts[urlParts.length - 1].split('?')[0];
                const filename = `${order.id}/${safeKey}_${remoteName}`;

                try {
                    // Check if exists (statObject throws if not found)
                    try {
                        await minioClient.statObject(BUCKET_NAME, filename);
                        // console.log(`[Scraper] Asset exists: ${filename}`);
                        continue;
                    } catch {
                        // Not found, proceed to download
                    }

                    console.log(`[Scraper] Downloading ${url}...`);
                    const response = await axios({
                        url,
                        method: 'GET',
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });

                    await minioClient.putObject(BUCKET_NAME, filename, Buffer.from(response.data));
                    console.log(`[Scraper] Saved to ${BUCKET_NAME}/${filename}`);

                } catch (err: any) {
                    console.error(`[Scraper] Failed for ${url}: ${err.message}`);
                }
            }
        }
    }
};
