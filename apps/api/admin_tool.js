
import { db } from './dist/db/index.js';
import { users, stores } from './dist/db/schema.js';
import { eq } from 'drizzle-orm';

const args = process.argv.slice(2);
const command = args[0];
const targetEmail = args[1];

async function main() {
    if (command === 'list') {
        const allUsers = await db.select().from(users);
        console.log(allUsers.map(u => `${u.id}: ${u.email} (Super: ${u.isSuperAdmin}, Store: ${u.defaultStoreId})`).join('\n'));
    } else if (command === 'promote' && targetEmail) {
        console.log(`Promoting ${targetEmail} to Super Admin...`);
        const result = await db.update(users)
            .set({ isSuperAdmin: true })
            .where(eq(users.email, targetEmail))
            .returning();

        if (result.length) {
            console.log('Success:', result[0]);
        } else {
            console.error('User not found.');
        }
    } else if (command === 'fix-store' && targetEmail) {
        console.log(`Fixing store for ${targetEmail}...`);

        // 1. Get or Create Store
        let store = await db.select().from(stores).limit(1);
        let storeId;

        if (store.length === 0) {
            console.log('No stores found. Creating default store...');
            const newStore = await db.insert(stores).values({
                url: 'https://example.com',
                settings: {}
            }).returning();
            storeId = newStore[0].id;
            console.log(`Created Store ID: ${storeId}`);
        } else {
            storeId = store[0].id;
            console.log(`Found existing Store ID: ${storeId}`);
        }

        // 2. Update User
        const result = await db.update(users)
            .set({ defaultStoreId: storeId })
            .where(eq(users.email, targetEmail))
            .returning();

        if (result.length) {
            console.log('Success. User updated:', result[0]);
        } else {
            console.error('User not found.');
        }

    } else {
        console.log('Usage:');
        console.log('  node admin_tool.js list');
        console.log('  node admin_tool.js promote <email>');
        console.log('  node admin_tool.js fix-store <email>');
    }
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
