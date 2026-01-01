
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const args = process.argv.slice(2);
const command = args[0];
const targetEmail = args[1];

async function main() {
    if (command === 'list') {
        const allUsers = await db.select().from(users);
        console.table(allUsers.map(u => ({ id: u.id, email: u.email, isSuperAdmin: u.isSuperAdmin })));
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
    } else {
        console.log('Usage:');
        console.log('  npx tsx src/scripts/admin_tool.ts list');
        console.log('  npx tsx src/scripts/admin_tool.ts promote <email>');
    }
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
