const express = require('express');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request body
app.use(express.json());

// Authorization token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzEyMTQ5ODU1LCJpYXQiOjE3MTIxNDk1NTUsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImFlZThjNjQyLTVkYjYtNDg5Zi04NDY3LWU5MzE4MzE1NGVmYyIsInN1YiI6InZ2NTM4MkBzcm1pc3QuZWR1LmluIn0sImNvbXBhbnlOYW1lIjoiZ29NYXJ0IiwiY2xpZW50SUQiOiJhZWU4YzY0Mi01ZGI2LTQ4OWYtODQ2Ny1lOTMxODMxNTRlZmMiLCJjbGllbnRTZWNyZXQiOiJCS3hyaVpLQ2pvUE1BY2ZCIiwib3duZXJOYW1lIjoiSnlvdGhpIFN3YXJvb3AiLCJvd25lckVtYWlsIjoidnY1MzgyQHNybWlzdC5lZHUuaW4iLCJyb2xsTm8iOiJSQTIxMTEwMjcwMTAwNzYifQ.dTIf-YPMitzrjzvumJpJASLABlyj98iU-5wlx0spY1E';

// Function to fetch top products from the e-commerce server
const fetchTopProducts = (companyName, categoryName, top, minPrice, maxPrice, sortBy) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '20.244.56.144',
            port: 80,
            path: `/test/companies/${companyName}/categories/${categoryName}/products?top=${top}&minPrice=${minPrice}&maxPrice=${maxPrice}&sortBy=${sortBy}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = http.request(options, res => {
            let data = '';

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const products = JSON.parse(data);
                    resolve(products);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', error => {
            reject(error);
        });

        req.end();
    });
};

// GET /categories/:categoryname/products
// GET /categories/:categoryname/products
app.get('/categories/:categoryname/products', async (req, res) => {
    const { categoryname } = req.params;
    const { top, minPrice, maxPrice, sortBy, page } = req.query;

    try {
        const products = await fetchTopProducts('AMZ', categoryname, top, minPrice, maxPrice, sortBy);
        
        // Check if products is an array
        if (!Array.isArray(products)) {
            throw new Error('Invalid products data: response is not an array');
        }

        // Pagination
        const perPage = parseInt(top);
        const currentPage = parseInt(page) || 1;
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = Math.min(startIndex + perPage, products.length);

        const paginatedProducts = products.slice(startIndex, endIndex);

        res.json({
            currentPage,
            totalPages: Math.ceil(products.length / perPage),
            totalItems: products.length,
            products: paginatedProducts
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: error.message });
    }
});


// GET /categories/:categoryname/products/:productid
app.get('/categories/:categoryname/products/:productid', async (req, res) => {
    const { categoryname, productid } = req.params;

    try {
        const products = await fetchTopProducts('AMZ', categoryname, 10, 0, 10000, '');
        const product = products.find(product => product.productName === productid);
        
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
