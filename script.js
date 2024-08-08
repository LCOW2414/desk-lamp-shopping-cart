const exchangeRates = { CAD: 1, INR: 61.11 }; // Example conversion rates
const taxRates = { CAD: 0.13, INR: 0.18 }; // Example tax rates

// Helper function to format prices based on currency
function formatPrice(amount, currencyCode) {
    if (currencyCode === 'INR') {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD`;
    }
}

// Update product prices and cart totals based on the selected country
function updatePrices() {
    const selectedCountry = localStorage.getItem('selectedCountry') || 'CAD';
    const conversionRate = exchangeRates[selectedCountry] || 1;

    // Update product prices
    if (document.getElementById('productList')) {
        displayProducts(window.products);
    }

    // Update cart totals
    if (document.getElementById('cartItems')) {
        updateCart();
    }
}

document.addEventListener("DOMContentLoaded", function () {

    const countrySelect = document.getElementById('countrySelect');
    if (countrySelect) {
        // Set initial value
        const storedCountry = localStorage.getItem('selectedCountry') || 'CAD';
        countrySelect.value = storedCountry;

        // Listen for changes
        countrySelect.addEventListener('change', function () {
            const selectedCountry = countrySelect.value;
            localStorage.setItem('selectedCountry', selectedCountry);
            updatePrices(); // Update prices and cart totals on country change
        });
    }

    navigateTo('home'); // Load the home view by default
});

function navigateTo(view) {
    const mainContent = document.getElementById('main-content');
    switch (view) {
        case 'home':
            fetch('pages/home.html')
                .then(response => response.text())
                .then(html => {
                    mainContent.innerHTML = html;
                    updateCartItemCount();
                })
                .catch(error => console.error('Error loading home:', error));
            break;
        case 'products':
            fetch('pages/products.html')
                .then(response => response.text())
                .then(html => {
                    mainContent.innerHTML = html;
                    updateCartItemCount();
                    if (document.getElementById('productList')) {
                        fetch('products.json')
                            .then(response => response.json())
                            .then(data => {
                                window.products = data;
                                updatePrices(); // Initialize prices based on default country
                            })
                            .catch(error => {
                                console.error('Error fetching products:', error);
                            });
                    }

                    if (document.getElementById('cartItems')) {
                        updateCart();
                    }
                })
                .catch(error => console.error('Error loading products:', error));
            break;
        case 'cart':
            fetch('pages/cart.html')
                .then(response => response.text())
                .then(html => {
                    mainContent.innerHTML = html;
                    updateCartItemCount();
                    if (document.getElementById('cartItems')) {
                        updateCart();
                    }
                })
                .catch(error => console.error('Error loading cart:', error));
            break;
        default:
            mainContent.innerHTML = '<p>Page not found.</p>';
    }
}

function displayProducts(products) {
    const selectedCountry = localStorage.getItem('selectedCountry') || 'CAD';
    const conversionRate = exchangeRates[selectedCountry] || 1;

    const productList = document.getElementById('productList');
    productList.innerHTML = products.map(product => {
        const convertedPrice = product.price * conversionRate;

        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const isInCart = cart.find(p => p.id === product.id);
        const addButton = isInCart ? 'Add More Items' : 'Add to Cart';
        const deleteButton = isInCart ? `<button onclick="removeFromCart(${product.id})" class="delete-from-cart-btn">Delete</button>` : '';
        // <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Add to Cart</button>
        // <div class="added-to-cart" id="added-${product.id}">Added to Cart!</div>
        return `
            <div class="product" data-id="${product.id}">
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${formatPrice(convertedPrice, selectedCountry)}</p>

                <div class="cart-actions">
                    <button onclick="addToCart(${product.id})" class="${isInCart ? 'add-more-items-btn' : 'add-to-cart-btn'}">${addButton}</button>
                    ${deleteButton}
                    <span class="added-to-cart" id="added-${product.id}">Added!</span>
                </div>
            </div>
        `;
    }).join('');
}

function addToCart(productId) {
    const product = window.products.find(p => p.id === productId);
    if (product) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingProduct = cart.find(p => p.id === productId);
        if (existingProduct) {
            existingProduct.quantity = (existingProduct.quantity || 1) + 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(cart));


        updateCartItemCount(); // Update item count when adding to cart
        updateCart(); // Update cart on item addition
        displayProducts(window.products); // Refresh product display

        document.getElementById(`added-${productId}`).classList.add('show');
        setTimeout(() => {
            document.getElementById(`added-${productId}`).classList.remove('show');
        }, 2000);

        // Trigger jQuery animation
        triggerAddToCartAnimation(productId);
    }
}

function updateCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItems = $('#cartItems');
    const cartTotal = $('#cartTotal');
    const selectedCountry = localStorage.getItem('selectedCountry') || 'CAD';
    const conversionRate = exchangeRates[selectedCountry] || 1;
    const taxRate = taxRates[selectedCountry] || 0;

    if (cartItems) {

        if (cart.length === 0) {
            // Display an animated empty cart message
            cartItems.html(`
            <div id="emptyCartMessage" class="empty-cart-message">
                <p>Your cart is empty.</p>
                <a href="#products" class="shop-now-button" onclick="navigateTo('products')">Go Shopping</a>
            </div>
            `);

            $('#emptyCartMessage').hide().fadeIn(500).animate({
                marginTop: '20px',
                opacity: 1
            }, 500);

            cartTotal.removeClass('cart-total')

            cartTotal.html(''); // Clear the cart total if empty
            return;
        }

        const cartHTML = cart.map(item => {
            const convertedPrice = item.price * conversionRate;
            return `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}">
                <p>${item.name} - ${formatPrice(convertedPrice, selectedCountry)} x ${item.quantity}</p>
                <button onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
        }).join('');

        cartItems.html(cartHTML);
    }
    // Calculate and display totals
    calculateCartTotals(selectedCountry);
}

function removeFromCart(productId) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const updatedCart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    updateCartItemCount(); // Update item count when adding to cart

    // Animate the cart item removal
    const cartItem = $(`.cart-item[data-id="${productId}"]`);
    if (cartItem.length > 0) {
        cartItem.slideUp(300, function () {
            cartItem.remove();
            updateCart(); // Update cart after animation completes
        });
    } else {
        updateCart(); // If item is not found, update cart immediately
    }

    displayProducts(window.products); // Refresh product display
}

function updateCartItemCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
    const cartItemCount = document.getElementById('cartItemCount');
    if (cartItemCount) {
        cartItemCount.textContent = itemCount > 0 ? itemCount : '';
        if (itemCount > 0) cartItemCount.classList.add('cart-item-count')
        else cartItemCount.classList.remove('cart-item-count')
    }
}

function calculateCartTotals(countryCode) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    const conversionRate = exchangeRates[countryCode] || 1;
    const taxRate = taxRates[countryCode] || 0;

    // Convert all prices to the selected currency
    const convertedCart = cart.map(item => ({
        ...item,
        convertedPrice: item.price * conversionRate,
    }));

    // Calculate subtotal, tax, and total in the selected currency
    const subtotal = convertedCart.reduce((sum, item) => sum + (item.convertedPrice * item.quantity), 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const cartTotal = document.getElementById('cartTotal');
    if (cartTotal) {
        cartTotal.innerHTML = `
            <p>Subtotal: ${formatPrice(subtotal, countryCode)}</p>
            <p>Tax: ${formatPrice(tax, countryCode)}</p>
            <p>Total: ${formatPrice(total, countryCode)}</p>
        `;
    }
}

function triggerAddToCartAnimation(productId) {
    var cart = $('.cart-main');
    var imgtodrag = $(`.product[data-id="${productId}"]`).find("img").eq(0);
    if (imgtodrag.length) {
        var imgclone = imgtodrag.clone()
            .offset({
                top: imgtodrag.offset().top,
                left: imgtodrag.offset().left
            })
            .css({
                'opacity': '0.5',
                'position': 'absolute',
                'height': '150px',
                'width': '150px',
                'z-index': '100'
            })
            .appendTo($('body'))
            .animate({
                'top': cart.offset().top + 10,
                'left': cart.offset().left + 10,
                'width': 75,
                'height': 75
            }, 1000, 'easeInOutExpo');

        setTimeout(function () {
            cart.effect("shake", {
                times: 2
            }, 200);
        }, 1500);

        imgclone.animate({
            'width': 0,
            'height': 0
        }, function () {
            $(this).detach();
        });
    }
}