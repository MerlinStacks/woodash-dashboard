export const MOCK_PRODUCTS = [
    {
        id: 101,
        name: "Premium Wireless Headphones",
        sku: "AUDIO-001",
        price: "249.99",
        status: "instock",
        permalink: "https://demo.overseek.com/product/headphones",
        images: [{ src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500" }],
        date_created: new Date().toISOString(),
        date_modified: new Date().toISOString()
    },
    {
        id: 102,
        name: "Ergonomic Office Chair",
        sku: "FURN-002",
        price: "399.00",
        status: "instock",
        permalink: "https://demo.overseek.com/product/chair",
        images: [{ src: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500" }],
        date_created: new Date().toISOString(),
        date_modified: new Date().toISOString()
    },
    {
        id: 103,
        name: "Mechanical Keyboard",
        sku: "TECH-003",
        price: "129.50",
        status: "instock",
        permalink: "https://demo.overseek.com/product/keyboard",
        images: [{ src: "https://images.unsplash.com/photo-1587829741301-dc798b91a602?w=500" }],
        date_created: new Date().toISOString(),
        date_modified: new Date().toISOString()
    }
];

export const MOCK_CUSTOMERS = [
    {
        id: 1,
        email: "john.doe@example.com",
        first_name: "John",
        last_name: "Doe",
        role: "customer",
        billing: { city: "New York", country: "US" },
        orders_count: 5,
        total_spent: "1250.00",
        date_created: new Date().toISOString()
    },
    {
        id: 2,
        email: "sarah.smith@test.com",
        first_name: "Sarah",
        last_name: "Smith",
        role: "customer",
        billing: { city: "London", country: "UK" },
        orders_count: 2,
        total_spent: "450.00",
        date_created: new Date().toISOString()
    }
];

export const MOCK_ORDERS = [
    {
        id: 5001,
        number: "5001",
        status: "completed",
        currency: "USD",
        total: "649.99",
        date_created: new Date().toISOString(),
        date_modified: new Date().toISOString(),
        billing: {
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@example.com"
        },
        line_items: [
            { name: "Premium Wireless Headphones", quantity: 1, total: "249.99" },
            { name: "Ergonomic Office Chair", quantity: 1, total: "399.00" }
        ]
    },
    {
        id: 5002,
        number: "5002",
        status: "processing",
        currency: "USD",
        total: "129.50",
        date_created: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        date_modified: new Date().toISOString(),
        billing: {
            first_name: "Sarah",
            last_name: "Smith",
            email: "sarah.smith@test.com"
        },
        line_items: [
            { name: "Mechanical Keyboard", quantity: 1, total: "129.50" }
        ]
    }
];

export const MOCK_REVIEWS = [
    {
        id: 1,
        date_created: new Date().toISOString(),
        product_id: 101,
        product_name: "Premium Wireless Headphones",
        reviewer: "John Doe",
        review: "Amazing sound quality!",
        rating: 5,
        status: "approved"
    }
];
