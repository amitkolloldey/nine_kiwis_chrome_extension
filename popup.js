document.addEventListener('DOMContentLoaded', () => {
    // Check if we have a token and are logged in
    chrome.runtime.sendMessage({ action: 'getToken' }, function (response) {
        if (response.token) {
            // We have a token, fetch products immediately
            fetchProducts();
        } else {
            // No token, show login form
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('productsList').style.display = 'none';
        }
    });
});

document.getElementById('loginBtn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (email && password) {
        chrome.runtime.sendMessage(
            { action: 'login', email: email, password: password },
            function (response) {
                if (response.success) {
                    console.log('Logged in successfully');
                    fetchProducts();
                } else {
                    console.error('Login failed');
                }
            }
        );
    }
});

function fetchProducts() {
    // First get the token through message passing
    chrome.runtime.sendMessage({ action: 'getToken' }, function (response) {
        if (response.token) {
            fetch('http://127.0.0.1:8000/api/products', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${response.token}`,
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    displayProducts(data.data);
                })
                .catch((error) => {
                    console.error('Error fetching products:', error);
                });
        } else {
            console.error('No token available');
        }
    });
}
// ... your existing code ...

function displayProducts(products) {
    console.log(products)
    const productsList = document.getElementById('productItems');
    productsList.innerHTML = '';

    products.forEach((product) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <h3>Title: ${product.name}</h3>
            <p>SKU: ${product.sku}</p>
            <p>Category: ${product.category.name}</p>
            <p>Description: ${product.description}</p>
            <p>Price: $${product.price}</p>
            <img src="${product.image_url}" alt="${product.name}" width="100">
            <button class="post-to-fb" data-product='${JSON.stringify(product)}'>Post to Facebook</button>
        `;
        productsList.appendChild(li);

        const postButton = li.querySelector('.post-to-fb');
        postButton.addEventListener('click', () => {
            postToFacebook(product);
        });
    });

    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('productsList').style.display = 'block';
}

function postToFacebook(product) {
    const cleanProduct = {
        name: product.name,
        price: parseFloat(product.price),
        description: product.description,
        category: product.category.name
    };

    console.log('Sending product to Facebook:', cleanProduct);
    
    chrome.runtime.sendMessage({
        action: 'postToFacebook',
        product: cleanProduct
    }, response => {
        if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
        } else {
            console.log('Successfully initiated Facebook posting');
        }
    });
}