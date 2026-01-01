
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true, baseURL: 'http://localhost:4000' }));

async function test() {
    try {
        console.log('1. Health Check');
        const h = await client.get('/health');
        console.log('Status:', h.status, h.data);

        console.log('2. Register / Login');
        const email = `test_${Date.now()}@example.com`;
        const password = 'password123';

        try {
            const reg = await client.post('/api/auth/register', {
                email, password, fullName: 'Test User', storeName: 'Test Store'
            });
            console.log('Register Success:', reg.status, reg.data);
            console.log('Cookies after Register:', jar.toJSON());
        } catch (e) {
            console.log('Register Failed (User might exist, trying login):', e.message);
            const login = await client.post('/api/auth/login', { email, password });
            console.log('Login Success:', login.status, login.data);
            console.log('Cookies after Login:', jar.toJSON());
        }

        console.log('3. Check /me');
        const me = await client.get('/api/auth/me');
        console.log('Me Success:', me.status, me.data);

    } catch (e) {
        if (e.response) {
            console.error('FAILED:', e.response.status, e.response.data);
        } else {
            console.error('FAILED:', e.message);
        }
    }
}

test();
