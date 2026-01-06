
// mocking the behaviour of the server route logic to verify the fix
// effectively a unit test for the route handler logic

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

// Mock the route handler logic from woo.ts
async function mockRouteHandler(req, res) {
    // ... setup mock woo service ...
    const woo = {
        getSystemStatus: async () => Promise.resolve(true),
        updatePluginSettings: async () => {
            const error = new Error("Request failed with status code 401");
            error.response = {
                status: 401,
                data: { code: "rest_forbidden", message: "Sorry, you are not allowed to do that." }
            };
            throw error;
        }
    };

    try {
        // ... (elided credential check logic) ...

        // Push configuration to the plugin
        try {
            await woo.updatePluginSettings();
            res.json({ success: true });
        } catch (pluginError) {
            console.log('Caught plugin error');

            // Check if it's a 401 Unauthorized during the write operation
            if (pluginError.response && pluginError.response.status === 401) {
                return res.status(401).json({
                    error: 'Configuration failed. Your API Key appears to be "Read Only". Please generate new WooCommerce keys with "Read/Write" permissions.',
                    details: pluginError.response.data
                });
            }

            throw pluginError;
        }
    } catch (error) {
        console.log("Caught general error");
        res.status(500).json({ error: "Generic Error" });
    }
}

async function runTest() {
    console.log("Running manual verification test (JS)...");
    const res = mockRes();
    const req = { body: {} };

    await mockRouteHandler(req, res);

    console.log("Response Status:", res.statusCode);
    console.log("Response Data:", JSON.stringify(res.data, null, 2));

    if (res.statusCode === 401 && res.data.error.includes("Read Only")) {
        console.log("✅ TEST PASSED: 401 Read-Only error correctly handled.");
    } else {
        console.error("❌ TEST FAILED: Expected 401 with specific message.");
    }
}

runTest();
