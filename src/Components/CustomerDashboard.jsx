import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaHome, FaShoppingCart, FaList, FaHeart, FaMapMarkerAlt, FaCreditCard, FaSignOutAlt, FaSearch, FaPlus, FaTrash, FaBars, FaMicrophone, FaStar } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { db, auth } from '../firebase'; // Ensure this points to your initialized Firebase config
import { ref, onValue, set, remove, update, push, get } from 'firebase/database'; // Firebase Realtime Database methods

const CustomerDashboard = () => {
    const [darkMode, setDarkMode] = useState(true);
    const [language, setLanguage] = useState('English');
    const [currentPage, setCurrentPage] = useState('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [newAddress, setNewAddress] = useState({ type: '', details: '' });
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [newPayment, setNewPayment] = useState({ type: '', value: '' });
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [sortBy, setSortBy] = useState('relevance');
    const [filterBy, setFilterBy] = useState('all');
    const [isListening, setIsListening] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [products, setProducts] = useState([]);
    const [customer, setCustomer] = useState({ name: 'Guest', email: '', phone: '', joined: '', address: 'Not set', photo: 'https://via.placeholder.com/150' });
    const [orders, setOrders] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [orderDetails, setOrderDetails] = useState({ address: '', paymentMethod: '' });

    const translations = {
        English: { home: 'Home', profile: 'Profile', orders: 'Orders', wishlist: 'Wishlist', address: 'Address', payment: 'Payment Methods', logout: 'Logout', addToCart: 'Add to Cart', placeOrder: 'Place Order', search: 'Search products...', saveToWishlist: 'Save to Wishlist', confirmOrder: 'Confirm Purchase', stock: 'Available Stock', orderStatus: { confirmed: 'Confirmed', cancelled: 'Cancelled', dispatched: 'Dispatched', current: 'Current' } },
        Tamil: { home: 'முகப்பு', profile: 'சுயவிவரம்', orders: 'ஆர்டர்கள்', wishlist: 'விருப்பப்பட்டியல்', address: 'முகவரி', payment: 'பணம் செலுத்தும் முறைகள்', logout: 'வெளியேறு', addToCart: 'கார்ட்டில் சேர்', placeOrder: 'ஆர்டர் செய்', search: 'பொருட்களைத் தேடு...', saveToWishlist: 'விருப்பப்பட்டியலில் சேமி', confirmOrder: 'வாங்குதலை உறுதிப்படுத்து', stock: 'கிடைக்கும் பங்கு', orderStatus: { confirmed: 'உறுதி செய்யப்பட்டது', cancelled: 'ரத்து செய்யப்பட்டது', dispatched: 'அனுப்பப்பட்டது', current: 'நடப்பு' } },
        Hindi: { home: 'होम', profile: 'प्रोफाइल', orders: 'ऑर्डर', wishlist: 'विशलिस्ट', address: 'पता', payment: 'भुगतान के तरीके', logout: 'लॉगआउट', addToCart: 'कार्ट में जोड़ें', placeOrder: 'ऑर्डर करें', search: 'उत्पाद खोजें...', saveToWishlist: 'विशलिस्ट में सहेजें', confirmOrder: 'खरीद की पुष्टि करें', stock: 'उपलब्ध स्टॉक', orderStatus: { confirmed: 'पुष्टि की गई', cancelled: 'रद्द की गई', dispatched: 'प्रेषित', current: 'वर्तमान' } },
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (!user) {
                toast.error('Please log in to access the dashboard.');
                return;
            }

            const uid = user.uid;

            const customerRef = ref(db, `customerDetails/${uid}/profile`);
            onValue(customerRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setCustomer({
                        name: data.name || 'Guest',
                        email: data.email || user.email,
                        phone: data.phone || '+91 98765-43210',
                        joined: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Not available',
                        address: data.address || 'Not set',
                        photo: data.photo || 'https://via.placeholder.com/150',
                    });
                } else {
                    const defaultProfile = {
                        name: user.displayName || 'Guest',
                        email: user.email,
                        phone: '+91 98765-43210',
                        createdAt: new Date().toISOString(),
                        address: 'Not set',
                        photo: user.photoURL || 'https://via.placeholder.com/150',
                    };
                    set(customerRef, defaultProfile).then(() => setCustomer(defaultProfile));
                }
            }, (error) => {
                console.error('Error fetching customer profile:', error);
                toast.error('Failed to fetch profile.');
            });

            const productsRef = ref(db, 'products');
            onValue(productsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const productsArray = [];
                    Object.keys(data).forEach((farmerId) => {
                        const farmerProducts = data[farmerId];
                        Object.keys(farmerProducts).forEach((productId) => {
                            const product = farmerProducts[productId];
                            productsArray.push({
                                id: productId,
                                farmerId,
                                name: product.name || 'Unnamed Product',
                                tamilName: product.tamilName || product.name,
                                hindiName: product.hindiName || product.name,
                                price: parseFloat(product.price) || 0,
                                stock: parseInt(product.availableStock) || 0, // Fetch from availableStock
                                category: product.category || 'Uncategorized',
                                image: product.image || 'https://via.placeholder.com/150',
                                farmerName: product.farmerName || 'Unknown Farmer',
                                createdAt: product.createdAt || new Date().toISOString(),
                                rating: product.rating || 4,
                                images: [product.image || 'https://via.placeholder.com/150'],
                            });
                        });
                    });
                    setProducts(productsArray);
                } else {
                    console.warn('No products found in the database.');
                    toast.warn('No products available.');
                    setProducts([]);
                }
            }, (error) => {
                console.error('Error fetching products:', error);
                toast.error('Failed to fetch products.');
            });

            const wishlistRef = ref(db, `customerDetails/${uid}/wishlist`);
            onValue(wishlistRef, (snapshot) => {
                const data = snapshot.val();
                setWishlist(data ? Object.values(data) : []);
            }, (error) => {
                console.error('Error fetching wishlist:', error);
                toast.error('Failed to fetch wishlist.');
            });

            const addressesRef = ref(db, `customerDetails/${uid}/addresses`);
            onValue(addressesRef, (snapshot) => {
                const data = snapshot.val();
                setAddresses(data ? Object.values(data) : []);
            }, (error) => {
                console.error('Error fetching addresses:', error);
                toast.error('Failed to fetch addresses.');
            });

            const paymentMethodsRef = ref(db, `customerDetails/${uid}/paymentMethods`);
            onValue(paymentMethodsRef, (snapshot) => {
                const data = snapshot.val();
                setPaymentMethods(data ? Object.values(data) : []);
            }, (error) => {
                console.error('Error fetching payment methods:', error);
                toast.error('Failed to fetch payment methods.');
            });

            const ordersRef = ref(db, `orders`);
            onValue(ordersRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const userOrders = Object.entries(data)
                        .filter(([key]) => key.startsWith(`order_${uid}_`))
                        .map(([_, order]) => order);
                    setOrders(userOrders);
                } else {
                    setOrders([]);
                }
            }, (error) => {
                console.error('Error fetching orders:', error);
                toast.error('Failed to fetch orders.');
            });

            const cartRef = ref(db, `customerDetails/${uid}/cart`);
            onValue(cartRef, (snapshot) => {
                const data = snapshot.val();
                setCart(data ? Object.entries(data).map(([key, value]) => ({ ...value, cartId: key })) : []);
            }, (error) => {
                console.error('Error fetching cart:', error);
                toast.error('Failed to fetch cart.');
            });
        });

        return () => unsubscribeAuth();
    }, []);

    // Voice recognition setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = language === 'English' ? 'en-US' : language === 'Tamil' ? 'ta-IN' : 'hi-IN';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase().trim();
            if (command.includes('home')) setCurrentPage('home');
            else if (command.includes('profile')) setCurrentPage('profile');
            else if (command.includes('orders')) setCurrentPage('orders');
            else if (command.includes('wishlist')) setCurrentPage('wishlist');
            else if (command.includes('address')) setCurrentPage('address');
            else if (command.includes('payment')) setCurrentPage('payment');
            else if (command.includes('cart')) setCurrentPage('cart');
            else if (command.includes('logout')) toast.info('Logged out');
            else {
                const matchedProduct = products.find((product) =>
                    [product.name, product.tamilName].some((name) => name.toLowerCase().includes(command))
                );
                if (matchedProduct) {
                    setSelectedProduct(matchedProduct);
                    setCurrentPage('productDetails');
                    toast.success(`Viewing "${matchedProduct.name}" via voice!`);
                } else {
                    setSearchQuery(command);
                    setCurrentPage('home');
                    toast.info(`Searching for: "${command}"`);
                }
            }
            setIsListening(false);
        };
        recognition.onerror = () => {
            toast.error('Voice recognition failed.');
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);

        const voiceButton = document.querySelector('.voice-btn');
        const handleVoiceButtonClick = () => recognition.start();
        if (voiceButton) voiceButton.addEventListener('click', handleVoiceButtonClick);

        return () => {
            if (voiceButton) voiceButton.removeEventListener('click', handleVoiceButtonClick);
        };
    }, [language, products]);

    const toggleDarkMode = () => setDarkMode(!darkMode);
    const toggleNav = () => setIsNavOpen(!isNavOpen);

    const toggleSelection = (product) => {
        setSelectedProducts((prev) => {
            const isSelected = prev.some((p) => p.id === product.id);
            return isSelected ? prev.filter((p) => p.id !== product.id) : [...prev, { ...product, qty: 1 }];
        });
    };

    const addToCart = (product, qty = 1) => {
        const uid = auth.currentUser?.uid;
        if (!uid) {
            toast.error("Please log in to add items to cart.");
            return;
        }

        const existingCartItem = cart.find((item) => item.id === product.id && item.farmerId === product.farmerId);
        const totalQty = (existingCartItem ? existingCartItem.qty : 0) + qty;
        const availableStock = product.stock;

        if (totalQty > availableStock) {
            toast.warn(`Total quantity (${totalQty}) exceeds available stock (${availableStock} kg) for ${product.name}!`);
            return;
        }

        if (existingCartItem) {
            const cartRef = ref(db, `customerDetails/${uid}/cart/${existingCartItem.cartId}`);
            update(cartRef, { qty: totalQty })
                .then(() => toast.success(`${product.name} quantity updated in cart!`))
                .catch((error) => toast.error('Failed to update cart: ' + error.message));
            return;
        }

        const cartRef = ref(db, `customerDetails/${uid}/cart`);
        const newCartItemRef = push(cartRef);
        const cartItem = { ...product, qty, cartId: newCartItemRef.key };
        set(newCartItemRef, cartItem)
            .then(() => toast.success(`${product.name} added to cart!`))
            .catch((error) => toast.error('Failed to add to cart: ' + error.message));
    };

    const updateCartItem = (cartId, qty) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const cartItem = cart.find((item) => item.cartId === cartId);
        if (!cartItem) return;

        // Check total quantity across all cart items for this product
        const otherItems = cart.filter((item) => item.cartId !== cartId && item.id === cartItem.id && item.farmerId === cartItem.farmerId);
        const totalQty = otherItems.reduce((sum, item) => sum + item.qty, 0) + qty;
        const availableStock = cartItem.stock;

        if (totalQty > availableStock) {
            toast.warn(`Total quantity (${totalQty}) exceeds available stock (${availableStock} kg) for ${cartItem.name}!`);
            return;
        }

        if (qty < 1) {
            removeCartItem(cartId);
            return;
        }

        const cartRef = ref(db, `customerDetails/${uid}/cart/${cartId}`);
        update(cartRef, { qty })
            .catch((error) => toast.error('Failed to update cart: ' + error.message));
    };

    const removeCartItem = (cartId) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const cartRef = ref(db, `customerDetails/${uid}/cart/${cartId}`);
        remove(cartRef)
            .then(() => toast.info('Item removed from cart.'))
            .catch((error) => toast.error('Failed to remove from cart: ' + error.message));
    };

    const addAddress = () => {
        const uid = auth.currentUser?.uid;
        if (!uid || !newAddress.type || !newAddress.details) {
            toast.warn('Please fill in all address fields');
            return;
        }

        const addressId = Date.now();
        const addressRef = ref(db, `customerDetails/${uid}/addresses/${addressId}`);
        const newAddr = { id: addressId, ...newAddress };
        set(addressRef, newAddr)
            .then(() => {
                setNewAddress({ type: '', details: '' });
                toast.success('Address added');
            })
            .catch((error) => toast.error('Failed to add address: ' + error.message));
    };

    const removeAddress = (id) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const addressRef = ref(db, `customerDetails/${uid}/addresses/${id}`);
        remove(addressRef)
            .catch((error) => toast.error('Failed to remove address: ' + error.message));
    };

    const addPaymentMethod = () => {
        const uid = auth.currentUser?.uid;
        if (!uid || !newPayment.type || !newPayment.value) {
            toast.warn('Please fill in all payment fields');
            return;
        }

        const paymentId = Date.now();
        const paymentRef = ref(db, `customerDetails/${uid}/paymentMethods/${paymentId}`);
        const newPM = { id: paymentId, ...newPayment };
        set(paymentRef, newPM)
            .then(() => {
                setNewPayment({ type: '', value: '' });
                toast.success('Payment method added');
            })
            .catch((error) => toast.error('Failed to add payment method: ' + error.message));
    };

    const removePaymentMethod = (id) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const paymentRef = ref(db, `customerDetails/${uid}/paymentMethods/${id}`);
        remove(paymentRef)
            .catch((error) => toast.error('Failed to remove payment method: ' + error.message));
    };

    const addToWishlist = (product) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const wishlistRef = ref(db, `customerDetails/${uid}/wishlist/${product.id}`);
        set(wishlistRef, product)
            .then(() => toast.success(`${product.name} saved to wishlist!`))
            .catch((error) => toast.error('Failed to add to wishlist: ' + error.message));
    };

    const removeFromWishlist = (id) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const wishlistRef = ref(db, `customerDetails/${uid}/wishlist/${id}`);
        remove(wishlistRef)
            .then(() => toast.info('Item removed from wishlist.'))
            .catch((error) => toast.error('Failed to remove from wishlist: ' + error.message));
    };

    const placeOrder = () => {
        if (cart.length === 0) {
            toast.warn('Your cart is empty.');
            return;
        }
        setCurrentPage('orderConfirmation');
    };

    const handlePaymentGatewayConfirm = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) {
            toast.error('User not authenticated. Please log in.');
            return;
        }

        if (!orderDetails.address) {
            toast.warn('Please select a shipping address.');
            return;
        }

        const res = await loadRazorpayScript();
        if (!res) {
            toast.error('Razorpay SDK failed to load. Are you online?');
            return;
        }

        const amountInPaise = Math.round(totalAmount * 100);

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: amountInPaise > 0 ? amountInPaise : 100,
            currency: 'INR',
            name: 'FarmFresh',
            description: 'Order Payment',
            image: customer.photo || 'https://via.placeholder.com/150',
            handler: function (response) {
                toast.success('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
                finalizeOrder('Razorpay', response.razorpay_payment_id);
            },
            prefill: {
                name: customer.name,
                email: customer.email,
                contact: customer.phone !== '+91 98765-43210' ? customer.phone : '9999999999'
            },
            notes: {
                address: 'FarmFresh Online'
            },
            theme: {
                color: '#14b8a6'
            }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', function (response) {
            toast.error(response.error.description);
        });
        paymentObject.open();
    };

    const sendOrderEmail = async (customerEmail, customerName, order, templateType) => {
        if (!customerEmail) return;

        const brevoApiKey = import.meta.env.VITE_BREVO_API_KEY;
        const senderMail = "farmer2consumer00@gmail.com";
        const senderName = "FarmFresh";

        let subject = '';
        let htmlContent = '';

        if (templateType === 'CONFIRMATION') {
            subject = `Order Confirmed - ${order.orderId}`;
            htmlContent = `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #f3f4f6; padding: 20px;">
                    <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e5e7eb;">
                        <div style="background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 30px; text-align: center; color: white;">
                            <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">✓ Order Confirmed!</h1>
                            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your purchase, ${customerName}</p>
                        </div>
                        
                        <div style="padding: 30px;">
                            <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 30px;">Your order <strong>${order.orderId}</strong> has been successfully placed. Here is your official colorful invoice:</p>
                            
                            <!-- Embedded Invoice -->
                            <div style="border: 1px solid #14b8a6; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                                <div style="display: table; width: 100%; border-bottom: 2px solid #14b8a6; padding: 20px; box-sizing: border-box; background-color: #f0fdfa;">
                                    <div style="display: table-cell; vertical-align: middle;">
                                        <h1 style="margin: 0; color: #14b8a6; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">FarmFresh INVOICE</h1>
                                    </div>
                                    <div style="display: table-cell; text-align: right; color: #4b5563; vertical-align: middle; font-size: 14px;">
                                        <p style="margin: 2px 0;">Order ID: ${order.orderId}</p>
                                        <p style="margin: 2px 0;">Date: ${new Date().toLocaleString()}</p>
                                    </div>
                                </div>
                                <div style="padding: 20px;">
                                    <h4 style="margin:0 0 10px 0; color: #0f766e; font-size: 16px;">Billed To:</h4>
                                    <p style="margin: 5px 0; font-size: 15px; color: #374151;"><strong>${customerName}</strong></p>
                                    <p style="margin: 5px 0; font-size: 15px; color: #374151;">${customerEmail}</p>
                                    <p style="margin: 5px 0; font-size: 15px; color: #374151;">Payment Method: <strong>${order.paymentMethod?.type || 'Online'}</strong></p>
                                </div>
                                
                                <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                                    <thead>
                                        <tr>
                                            <th style="background-color: #14b8a6; color: white; padding: 12px 15px; text-align: left; font-weight: 600;">Product Description</th>
                                            <th style="background-color: #14b8a6; color: white; padding: 12px 15px; text-align: center; font-weight: 600;">Qty</th>
                                            <th style="background-color: #14b8a6; color: white; padding: 12px 15px; text-align: right; font-weight: 600;">Unit Price</th>
                                            <th style="background-color: #14b8a6; color: white; padding: 12px 15px; text-align: right; font-weight: 600;">Total Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${order.products ? order.products.map((p, index) => `
                                            <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
                                                <td style="padding: 15px; color: #1f2937;">
                                                    <span style="font-weight: 600; font-size: 16px;">${p.productName}</span><br>
                                                    <span style="font-size: 13px; color: #6b7280; margin-top: 4px; display: inline-block;">Sold by: <strong>${p.farmerName || 'Unknown Farmer'}</strong> (ID: ${p.farmerId})</span>
                                                </td>
                                                <td style="padding: 15px; text-align: center; color: #4b5563; font-weight: 500;">${p.quantity}</td>
                                                <td style="padding: 15px; text-align: right; color: #374151;">₹${parseFloat(p.price || 0).toFixed(2)}</td>
                                                <td style="padding: 15px; text-align: right; color: #111827; font-weight: 600;">₹${parseFloat(p.totalPrice || 0).toFixed(2)}</td>
                                            </tr>
                                        `).join('') : ''}
                                    </tbody>
                                    <tfoot>
                                        <tr style="background-color: #115e59; color: white;">
                                            <td colspan="3" style="padding: 15px; font-weight: bold; text-align: right; font-size: 16px;">Grand Total Paid:</td>
                                            <td style="padding: 15px; font-weight: bold; text-align: right; font-size: 18px;">₹${parseFloat(order.totalAmount || 0).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <!-- End Embedded Invoice -->
                            
                            <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center;">Warm Regards,<br><strong style="color: #14b8a6; font-size: 18px;">FarmFresh Team</strong></p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            subject = `Order Cancelled - ${order.orderId}`;
            htmlContent = `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #f3f4f6; padding: 20px;">
                    <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e5e7eb;">
                        <div style="background: linear-gradient(135deg, #f43f5e, #be123c); padding: 30px; text-align: center; color: white;">
                            <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">✕ Order Cancelled</h1>
                            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Hi ${customerName},</p>
                        </div>
                        
                        <div style="padding: 30px;">
                            <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 20px;">We're writing to confirm that your order <strong>${order.orderId}</strong> has been successfully cancelled as requested.</p>
                            
                            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                                <h3 style="margin: 0 0 10px 0; color: #b91c1c; font-size: 16px;">Refund Details</h3>
                                <p style="margin: 0; color: #7f1d1d; font-size: 15px;">If any payment was already deducted, the full amount of <strong>₹${parseFloat(order.totalAmount || 0).toFixed(2)}</strong> will be automatically refunded to your original payment method (${order.paymentMethod?.type || 'Online'}) within 3-5 business days.</p>
                            </div>
                            
                            <!-- Embedded Cancelled Invoice -->
                            <div style="border: 1px solid #ef4444; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                                <div style="display: table; width: 100%; border-bottom: 2px solid #ef4444; padding: 20px; box-sizing: border-box; background-color: #fef2f2;">
                                    <div style="display: table-cell; vertical-align: middle;">
                                        <h1 style="margin: 0; color: #ef4444; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">CANCELLED INVOICE</h1>
                                    </div>
                                    <div style="display: table-cell; text-align: right; color: #4b5563; vertical-align: middle; font-size: 14px;">
                                        <p style="margin: 2px 0;">Order ID: ${order.orderId}</p>
                                        <p style="margin: 2px 0;">Date: ${new Date().toLocaleString()}</p>
                                    </div>
                                </div>
                                <div style="padding: 20px;">
                                    <h4 style="margin:0 0 10px 0; color: #991b1b; font-size: 16px;">Billed To:</h4>
                                    <p style="margin: 5px 0; font-size: 15px; color: #374151;"><strong>${customerName}</strong></p>
                                    <p style="margin: 5px 0; font-size: 15px; color: #374151;">${customerEmail}</p>
                                </div>
                                
                                <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                                    <thead>
                                        <tr>
                                            <th style="background-color: #ef4444; color: white; padding: 12px 15px; text-align: left; font-weight: 600;">Product Description</th>
                                            <th style="background-color: #ef4444; color: white; padding: 12px 15px; text-align: center; font-weight: 600;">Qty</th>
                                            <th style="background-color: #ef4444; color: white; padding: 12px 15px; text-align: right; font-weight: 600;">Unit Price</th>
                                            <th style="background-color: #ef4444; color: white; padding: 12px 15px; text-align: right; font-weight: 600;">Total Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${order.products ? order.products.map((p, index) => `
                                            <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
                                                <td style="padding: 15px; color: #1f2937; text-decoration: line-through;">
                                                    <span style="font-weight: 600; font-size: 16px;">${p.productName}</span><br>
                                                    <span style="font-size: 13px; color: #6b7280; margin-top: 4px; display: inline-block; text-decoration: none;">Sold by: <strong>${p.farmerName || 'Unknown Farmer'}</strong> (ID: ${p.farmerId})</span>
                                                </td>
                                                <td style="padding: 15px; text-align: center; color: #4b5563; font-weight: 500;">${p.quantity}</td>
                                                <td style="padding: 15px; text-align: right; color: #374151;">₹${parseFloat(p.price || 0).toFixed(2)}</td>
                                                <td style="padding: 15px; text-align: right; color: #111827; font-weight: 600;">₹${parseFloat(p.totalPrice || 0).toFixed(2)}</td>
                                            </tr>
                                        `).join('') : ''}
                                    </tbody>
                                    <tfoot>
                                        <tr style="background-color: #991b1b; color: white;">
                                            <td colspan="3" style="padding: 15px; font-weight: bold; text-align: right; font-size: 16px;">Refunded Total:</td>
                                            <td style="padding: 15px; font-weight: bold; text-align: right; font-size: 18px;">₹${parseFloat(order.totalAmount || 0).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            
                            <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center;">Warm Regards,<br><strong style="color: #f43f5e; font-size: 18px;">FarmFresh Team</strong></p>
                        </div>
                    </div>
                </div>
            `;
        }

        const emailData = {
            sender: { name: senderName, email: senderMail },
            to: [{ email: customerEmail, name: customerName }],
            subject: subject,
            htmlContent: htmlContent
        };

        try {
            const res = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': brevoApiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            if (res.ok) {
                console.log(`Brevo Email sent successfully: ${templateType}`);
            } else {
                const err = await res.json();
                console.error('Brevo Email sending failed:', err);
            }
        } catch (error) {
            console.error('Brevo Email sending error:', error);
        }
    };

    const finalizeOrder = (paymentType, paymentRef) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // Check total stock availability across all items in cart
        for (const item of cart) {
            const product = products.find((p) => p.id === item.id && p.farmerId === item.farmerId);
            if (!product || item.qty > product.stock) {
                toast.warn(`Insufficient stock for ${item.name}. Only ${product?.stock || 0} units available.`);
                setCurrentPage('cart'); // Redirect to cart
                return;
            }
        }

        const orderId = Date.now();
        const orderDate = new Date().toISOString();
        const ordersRef = ref(db, `orders/order_${uid}_${orderId}`);

        const selectedAddress = addresses.find((addr) => addr.id === parseInt(orderDetails.address));

        if (!selectedAddress) {
            toast.error('Invalid address selected.');
            return;
        }

        const order = {
            orderId: `order_${uid}_${orderId}`,
            orderDateTime: orderDate,
            customerId: uid,
            customerName: customer.name,
            products: cart.map((item) => {
                const productMatch = products.find(p => p.id === item.id && p.farmerId === item.farmerId);
                return {
                    productName: item.name,
                    productId: item.id,
                    farmerId: item.farmerId,
                    farmerName: productMatch ? (productMatch.farmerName || 'Unknown Farmer') : 'Unknown Farmer',
                    quantity: item.qty,
                    price: item.price,
                    totalPrice: item.qty * item.price,
                };
            }),
            totalAmount: totalAmount,
            paymentMethod: {
                type: paymentType,
                value: paymentRef,
            },
            address: {
                type: selectedAddress.type,
                details: selectedAddress.details,
            },
            status: 'Confirmed', // Initial status
        };

        // Update stock in Firebase
        const stockUpdates = cart.map((item) => {
            const productRef = ref(db, `products/${item.farmerId}/${item.id}`);
            const newStock = item.stock - item.qty;
            return update(productRef, { availableStock: newStock });
        });

        Promise.all([
            set(ordersRef, order),
            ...stockUpdates,
            remove(ref(db, `customerDetails/${uid}/cart`)),
        ])
            .then(() => {
                setCart([]);
                setOrderDetails({ address: '', paymentMethod: '' });
                setCurrentPage('orders');
                toast.success('Order placed successfully! Stock updated.');
                sendOrderEmail(customer.email, customer.name, order, 'CONFIRMATION');
            })
            .catch((error) => {
                console.error('Error placing order:', error);
                toast.error('Failed to place order: ' + error.message);
            });
    };

    const updateOrderStatus = (orderId, newStatus) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const orderRef = ref(db, `orders/${orderId}`);
        update(orderRef, { status: newStatus })
            .then(() => {
                toast.success(`Order ${orderId} status updated to ${newStatus}.`);
                if (newStatus === 'Cancelled') {
                    const orderToCancel = orders.find(o => o.orderId === orderId);
                    if (orderToCancel) {
                        sendOrderEmail(customer.email, customer.name, orderToCancel, 'CANCELLATION');
                    }
                }
            })
            .catch((error) => toast.error('Failed to update order status: ' + error.message));
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

    const sortedAndFilteredProducts = () => {
        let filteredProducts = products.filter(p => p.stock > 0);
        if (filterBy !== 'all') {
            filteredProducts = filteredProducts.filter((product) =>
                product.category && product.category.toLowerCase() === filterBy.toLowerCase()
            );
        }

        switch (sortBy) {
            case 'lowToHigh': return filteredProducts.sort((a, b) => a.price - b.price);
            case 'highToLow': return filteredProducts.sort((a, b) => b.price - a.price);
            case 'featured': return filteredProducts.sort((a, b) => a.id.localeCompare(b.id));
            case 'rating': return filteredProducts.sort((a, b) => b.rating - a.rating);
            case 'relevance':
            default: return filteredProducts;
        }
    };

    const ProductDetails = ({ product }) => {
        const [selectedImage, setSelectedImage] = useState(product.images[0]);
        const [quantity, setQuantity] = useState(1);
        const [totalPrice, setTotalPrice] = useState(product.price);

        // Update total price whenever quantity changes
        useEffect(() => {
            setTotalPrice(product.price * quantity);
        }, [quantity, product.price]);

        // Handle quantity input change
        const handleQuantityChange = (e) => {
            const value = parseInt(e.target.value) || 1;
            if (value < 1) {
                setQuantity(1);
            } else if (value > product.stock) {
                setQuantity(product.stock);
                toast.warn(`Only ${product.stock} units available in stock!`);
            } else {
                setQuantity(value);
            }
        };

        // Handle button quantity selection
        const handleButtonQuantity = (kg) => {
            if (kg > product.stock) {
                toast.warn(`Only ${product.stock} units available in stock!`);
                setQuantity(product.stock);
            } else {
                setQuantity(kg);
            }
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl mx-auto"
            >
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center">
                        <img src={selectedImage} alt={product.name} className="w-64 h-64 object-cover rounded-lg mb-4" />
                        <div className="flex space-x-2">
                            {product.images.map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt={`${product.name} ${index + 1}`}
                                    className={`w-16 h-16 object-cover rounded-md cursor-pointer ${selectedImage === img ? 'border-2 border-teal-400' : ''}`}
                                    onClick={() => setSelectedImage(img)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-teal-300">{language === 'English' ? product.name : language === 'Tamil' ? product.tamilName : product.hindiName}</h1>
                        <p className="text-xl text-teal-600 dark:text-teal-400 mt-2">₹{totalPrice.toFixed(2)}</p>
                        <p className="text-gray-600 dark:text-gray-400">Sold by: {product.farmerName} (ID: {product.farmerId})</p>
                        <p className="text-gray-600 dark:text-gray-400">{translations[language].stock}: {product.stock} kg</p>
                        <div className="flex items-center mt-2">
                            {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className={i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'} />
                            ))}
                            <span className="ml-2 text-gray-600 dark:text-gray-400">({product.rating}/5)</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-800 dark:text-gray-200 font-semibold">Quantity:</p>
                            <div className="flex space-x-2 mt-2">
                                {[1, 2, 3].map((kg) => (
                                    <button
                                        key={kg}
                                        onClick={() => handleButtonQuantity(kg)}
                                        className={`p-2 rounded-lg ${quantity === kg ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'} hover:bg-teal-400 transition-colors`}
                                        disabled={kg > product.stock}
                                    >
                                        {kg} kg
                                    </button>
                                ))}
                                <input
                                    type="number"
                                    min="1"
                                    max={product.stock}
                                    value={quantity}
                                    onChange={handleQuantityChange}
                                    className="w-16 p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-center bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex space-x-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addToCart(product, quantity)}
                                className="p-3 bg-gradient-to-r from-teal-500 to-indigo-500 text-white rounded-lg shadow-lg"
                                disabled={product.stock === 0}
                            >
                                {translations[language].addToCart}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addToWishlist(product)}
                                className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg shadow-lg"
                            >
                                {translations[language].saveToWishlist}
                            </motion.button>
                        </div>
                    </div>
                </div>
                <div className="mt-8 space-y-8">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-teal-300">About the Product</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Freshly harvested {product.name} by {product.farmerName}.</p>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-teal-300">Farmer Details</h2>
                        <ul className="text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                            <li><strong>Name:</strong> {product.farmerName}</li>
                            <li><strong>Farmer ID:</strong> {product.farmerId}</li>
                            <li><strong>Added On:</strong> {new Date(product.createdAt).toLocaleString()}</li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-teal-300">Ratings and Reviews</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Average Rating: {product.rating}/5</p>
                        <button className="mt-2 text-teal-600 dark:text-teal-400 hover:underline">Write a Review</button>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-teal-300">Similar Products</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            {sortedAndFilteredProducts()
                                .filter((p) => p.category === product.category && p.id !== product.id)
                                .slice(0, 3)
                                .map((similarProduct) => (
                                    <div
                                        key={similarProduct.id}
                                        onClick={() => setSelectedProduct(similarProduct)}
                                        className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:border-teal-400 border-2 border-transparent transition-all"
                                    >
                                        <img src={similarProduct.image} alt={similarProduct.name} className="w-full h-24 object-cover rounded-md mb-2" />
                                        <p className="text-gray-800 dark:text-teal-300">{similarProduct.name}</p>
                                        <p className="text-teal-600 dark:text-teal-400">₹{similarProduct.price.toFixed(2)}</p>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const OrderConfirmation = () => (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl bg-white dark:bg-gray-900 w-full max-w-4xl mx-auto"
        >
            <h2 className="text-2xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500 dark:from-indigo-400 dark:to-teal-300">
                Order Confirmation
            </h2>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-teal-300">Items in Cart</h3>
                    {cart.map((item) => (
                        <div key={item.cartId} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-4">
                            <div className="flex items-center space-x-4">
                                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md" />
                                <div>
                                    <p className="text-gray-800 dark:text-teal-300 font-semibold">{item.name}</p>
                                    <p className="text-gray-600 dark:text-gray-400">By: {item.farmerName}</p>
                                    <p className="text-gray-600 dark:text-gray-400">{translations[language].stock}: {item.stock} kg</p>
                                </div>
                            </div>
                            <p className="text-teal-600 dark:text-teal-400 font-medium">₹{(item.qty * item.price).toFixed(2)}</p>
                        </div>
                    ))}
                    <p className="text-xl font-bold text-gray-800 dark:text-teal-300 text-right">Total: ₹{totalAmount.toFixed(2)}</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-teal-300">Shipping Address</h3>
                    <select
                        value={orderDetails.address}
                        onChange={(e) => setOrderDetails({ ...orderDetails, address: e.target.value })}
                        className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-teal-400 mt-2"
                    >
                        <option value="">Select Address</option>
                        {addresses.map((addr) => (
                            <option key={addr.id} value={addr.id}>{`${addr.type}: ${addr.details}`}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePaymentGatewayConfirm}
                        className="w-full mt-6 p-4 bg-gradient-to-r from-teal-500 to-indigo-500 text-white rounded-lg shadow-2xl font-bold flex items-center justify-center gap-2"
                    >
                        <FaCreditCard /> Pay ₹{totalAmount.toFixed(2)} securely via Razorpay
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );


    const OrdersPage = () => {
        const [selectedOrderStatus, setSelectedOrderStatus] = useState('current');

        const filteredOrders = orders.filter((order) => {
            switch (selectedOrderStatus) {
                case 'confirmed': return order.status === 'Confirmed';
                case 'cancelled': return order.status === 'Cancelled';
                case 'dispatched': return order.status === 'Dispatched';
                case 'current': return ['Confirmed', 'Dispatched'].includes(order.status);
                default: return true;
            }
        });

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 w-full max-w-4xl mx-auto backdrop-saturate-150"
            >
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-400 dark:to-amber-300">
                        {translations[language].orders}
                    </h2>
                    <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 text-sm px-4 py-2 rounded-full font-bold">
                        <FaList className="inline mr-2" />
                        {filteredOrders.length} Records
                    </span>
                </div>

                <div className="mb-6">
                    <select
                        value={selectedOrderStatus}
                        onChange={(e) => setSelectedOrderStatus(e.target.value)}
                        className="w-full sm:w-64 p-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-md text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 shadow-sm"
                    >
                        <option value="current">{translations[language].orderStatus.current}</option>
                        <option value="confirmed">{translations[language].orderStatus.confirmed}</option>
                        <option value="dispatched">{translations[language].orderStatus.dispatched}</option>
                        <option value="cancelled">{translations[language].orderStatus.cancelled}</option>
                    </select>
                </div>
                <div className="space-y-6">
                    {filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FaList className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">No orders found.</p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <motion.div key={order.orderId} whileHover={{ scale: 1.02 }} className="p-6 bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:border-orange-300 transition-all flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-3 flex-1">
                                    <h3 className="text-lg text-gray-800 dark:text-teal-300 font-bold tracking-tight">
                                        {order.products.map((p) => p.productName).join(', ')}
                                    </h3>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                        <FaMapMarkerAlt className="text-orange-500" />
                                        <span>{order.address.type} - {order.address.details}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                        <FaCreditCard className="text-indigo-500" />
                                        <span>{order.paymentMethod.type}: {order.paymentMethod.value}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start md:items-end justify-between space-y-4">
                                    <div className="text-left md:text-right">
                                        <p className="text-2xl font-black text-teal-600 dark:text-teal-400">₹{order.totalAmount.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">{new Date(order.orderDateTime).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black shadow-sm tracking-wide ${order.status === 'Confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : order.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : order.status === 'Dispatched' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-700'}`}>
                                        {order.status.toUpperCase()}
                                    </span>
                                    {['Confirmed', 'Dispatched'].includes(order.status) && (
                                        <div className="flex space-x-2 w-full md:w-auto mt-2">
                                            {order.status === 'Confirmed' && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => updateOrderStatus(order.orderId, 'Dispatched')}
                                                    className="w-full md:w-auto px-4 py-2 bg-teal-500/10 text-teal-600 hover:bg-teal-500 hover:text-white dark:text-teal-400 rounded-xl font-bold transition-colors text-sm"
                                                >
                                                    Dispatch
                                                </motion.button>
                                            )}
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => updateOrderStatus(order.orderId, 'Cancelled')}
                                                className="w-full md:w-auto px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white dark:text-red-400 rounded-xl font-bold transition-colors text-sm"
                                            >
                                                Cancel
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>
        );
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="p-4 sm:p-6 md:p-8 rounded-2xl bg-white dark:bg-gray-900 shadow-2xl w-full max-w-7xl mx-auto"
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500 dark:from-indigo-400 dark:to-teal-300">
                            Explore Products
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center mb-8 space-y-4 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center w-full sm:w-auto">
                                <FaSearch className="text-gray-500 dark:text-gray-300 mr-2" />
                                <input
                                    type="text"
                                    placeholder={translations[language].search}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-72 p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-teal-400"
                                />
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full sm:w-48 p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 shadow-sm transition-all"
                            >
                                <option value="relevance">Relevance</option>
                                <option value="lowToHigh">Low to High Price</option>
                                <option value="highToLow">High to Low Price</option>
                                <option value="featured">Featured</option>
                                <option value="rating">Customer Rating</option>
                            </select>
                            <select
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value)}
                                className="w-full sm:w-48 p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 shadow-sm transition-all"
                            >
                                <option value="all">All Categories</option>
                                {[...new Set(products.map(p => p.category))].filter(Boolean).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`voice-btn p-3 rounded-full bg-gradient-to-r from-indigo-500 to-teal-500 text-white shadow-lg ${isListening ? 'animate-pulse' : ''}`}
                            >
                                <FaMicrophone />
                            </motion.button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full min-h-[60vh]">
                            {products.length === 0 ? (
                                <p className="text-gray-600 dark:text-gray-400">No products available.</p>
                            ) : (
                                sortedAndFilteredProducts()
                                    .filter((product) =>
                                        language === 'English'
                                            ? product.name.toLowerCase().includes(searchQuery.toLowerCase())
                                            : language === 'Tamil'
                                                ? product.tamilName.toLowerCase().includes(searchQuery.toLowerCase())
                                                : product.hindiName.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map((product) => (
                                        <motion.div
                                            whileHover={{ y: -6, scale: 1.02 }}
                                            key={product.id}
                                            className={`relative overflow-hidden p-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl cursor-pointer border-2 hover:shadow-teal-500/20 hover:border-teal-400/50 transition-all duration-300 ${selectedProducts.some((p) => p.id === product.id) ? 'border-teal-500 shadow-teal-500/30' : 'border-transparent'
                                                }`}
                                            onClick={() => setSelectedProduct(product) || setCurrentPage('productDetails')}
                                        >
                                            {product.category && (
                                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 text-xs font-semibold rounded-full z-10 shadow-lg">
                                                    {product.category}
                                                </div>
                                            )}
                                            <div className="relative group overflow-hidden rounded-xl mb-4">
                                                <img src={product.image} alt={product.name} className="w-full h-40 sm:h-48 object-cover transition-transform duration-500 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-teal-300 truncate tracking-tight">
                                                {language === 'English' ? product.name : language === 'Tamil' ? product.tamilName : product.hindiName}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">Farm: {product.farmerName}</p>

                                            <div className="flex justify-between items-end mt-5">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Price</p>
                                                    <p className="text-xl font-extrabold text-teal-600 dark:text-teal-400">₹{product.price.toFixed(2)}</p>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">{translations[language].stock}</p>
                                                    <span className="bg-teal-100 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs px-3 py-1.5 rounded-full font-bold shadow-sm">
                                                        {product.stock} kg
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                            )}
                        </div>
                        {selectedProducts.length > 0 && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    selectedProducts.forEach((p) => addToCart(p));
                                    setSelectedProducts([]);
                                }}
                                className="mt-8 w-full sm:w-72 mx-auto block p-4 bg-gradient-to-r from-teal-500 to-indigo-500 text-white rounded-lg shadow-2xl"
                            >
                                {translations[language].addToCart}
                            </motion.button>
                        )}
                    </motion.div>
                );
            case 'productDetails':
                return selectedProduct ? <ProductDetails product={selectedProduct} /> : null;
            case 'profile':
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7 }}
                        className="p-8 sm:p-10 rounded-3xl shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 max-w-lg mx-auto backdrop-saturate-150"
                    >
                        <div className="flex flex-col items-center space-y-6">
                            <div className="relative">
                                <motion.img src={customer.photo} alt="Profile" className="w-32 h-32 rounded-full shadow-2xl border-4 border-white dark:border-gray-800" whileHover={{ scale: 1.1, rotate: 5 }} />
                                <div className="absolute bottom-0 right-0 bg-teal-500 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-gray-800">
                                    <FaStar size={12} />
                                </div>
                            </div>
                            <div className="text-center w-full">
                                <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500 dark:from-indigo-400 dark:to-teal-300 mb-2">
                                    {customer.name}
                                </h2>
                                <div className="mt-6 bg-white/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 text-left">
                                    <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium"><span className="w-8 flex justify-center text-teal-500"><FaMicrophone /></span> {customer.phone}</div>
                                    <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium"><span className="w-8 flex justify-center text-indigo-500"><FaHeart /></span> {customer.email}</div>
                                    <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium"><span className="w-8 flex justify-center text-red-500"><FaMapMarkerAlt /></span> {customer.address}</div>
                                    <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium"><span className="w-8 flex justify-center text-yellow-500"><FaStar /></span> Joined: {customer.joined}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'orders':
                return <OrdersPage />;
            case 'wishlist':
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7 }}
                        className="p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 w-full max-w-4xl mx-auto backdrop-saturate-150"
                    >
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-400 dark:to-pink-300">
                                {translations[language].wishlist}
                            </h2>
                            <span className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 text-sm px-4 py-2 rounded-full font-bold">
                                <FaHeart className="inline mr-2" />
                                {wishlist.length} Saved
                            </span>
                        </div>
                        {wishlist.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <FaHeart className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">Your wishlist is empty.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {wishlist.map((item) => (
                                    <motion.div whileHover={{ y: -5 }} key={item.id} className="relative overflow-hidden p-5 bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:border-pink-300 transition-all flex flex-col justify-between">
                                        <div>
                                            {item.image && <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded-xl mb-4 shadow-sm" />}
                                            <p className="text-xl font-bold tracking-tight text-gray-800 dark:text-teal-300">{item.name}</p>
                                            <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-2">₹{item.price.toFixed(2)}</p>
                                        </div>
                                        <button onClick={() => removeFromWishlist(item.id)} className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-full text-red-500 hover:text-white hover:bg-red-500 transition-all shadow-sm">
                                            <FaTrash size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                );
            case 'address':
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7 }}
                        className="p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 max-w-xl mx-auto backdrop-saturate-150"
                    >
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-300">
                                {translations[language].address}
                            </h2>
                            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-sm px-4 py-2 rounded-full font-bold">
                                <FaMapMarkerAlt className="inline mr-2" />
                                {addresses.length} Saved
                            </span>
                        </div>
                        <div className="space-y-4 mb-8">
                            {addresses.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-6">No saved addresses.</p>
                            ) : addresses.map((addr) => (
                                <div key={addr.id} className="flex justify-between items-center p-5 bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:border-teal-300 transition-all">
                                    <div>
                                        <p className="text-lg text-gray-800 dark:text-teal-300 font-bold">{addr.type} <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full ml-2">Default</span></p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{addr.details}</p>
                                    </div>
                                    <button onClick={() => removeAddress(addr.id)} className="p-3 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm">
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700 space-y-4">
                            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Add New Location</h3>
                            <input
                                type="text"
                                placeholder="E.g. Home, Office"
                                value={newAddress.type}
                                onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                                className="w-full text-lg p-4 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 shadow-sm"
                            />
                            <textarea
                                placeholder="Full Street Address & Landmark"
                                value={newAddress.details}
                                onChange={(e) => setNewAddress({ ...newAddress, details: e.target.value })}
                                className="w-full text-lg p-4 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 shadow-sm min-h-[100px]"
                            />
                            <motion.button whileHover={{ scale: 1.02, boxShadow: "0px 10px 30px -10px rgba(20,184,166,0.6)" }} whileTap={{ scale: 0.98 }} onClick={addAddress} className="w-full py-4 bg-gradient-to-r from-teal-500 to-indigo-600 text-white rounded-xl shadow-xl font-bold transition-all">
                                <FaPlus className="mr-2 inline" /> Save Address
                            </motion.button>
                        </div>
                    </motion.div>
                );
            case 'payment':
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7 }}
                        className="p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 max-w-xl mx-auto backdrop-saturate-150"
                    >
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-500 dark:from-purple-400 dark:to-indigo-300">
                                {translations[language].payment}
                            </h2>
                            <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 text-sm px-4 py-2 rounded-full font-bold">
                                <FaCreditCard className="inline mr-2" />
                                Secure
                            </span>
                        </div>
                        <div className="space-y-4 mb-8">
                            {paymentMethods.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-6">No saved payment methods.</p>
                            ) : paymentMethods.map((pm) => (
                                <div key={pm.id} className="flex justify-between items-center p-5 bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-300 transition-all">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600">
                                            <FaCreditCard size={20} />
                                        </div>
                                        <div>
                                            <p className="text-lg text-gray-800 dark:text-teal-300 font-bold">{pm.type}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mt-1">{pm.value}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => removePaymentMethod(pm.id)} className="p-3 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm">
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700 space-y-4">
                            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Link New Method</h3>
                            <select
                                value={newPayment.type}
                                onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
                                className="w-full text-lg p-4 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 shadow-sm font-semibold"
                            >
                                <option value="">Select Method Type</option>
                                <option value="UPI">UPI ID</option>
                                <option value="Card">Credit/Debit Card</option>
                            </select>
                            <input
                                type="text"
                                placeholder="E.g. yourname@okicici, or Card Number"
                                value={newPayment.value}
                                onChange={(e) => setNewPayment({ ...newPayment, value: e.target.value })}
                                className="w-full text-lg p-4 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 shadow-sm font-mono"
                            />
                            <motion.button whileHover={{ scale: 1.02, boxShadow: "0px 10px 30px -10px rgba(99,102,241,0.6)" }} whileTap={{ scale: 0.98 }} onClick={addPaymentMethod} className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-xl font-bold transition-all">
                                <FaPlus className="mr-2 inline" /> Add Payment Profile
                            </motion.button>
                        </div>
                    </motion.div>
                );
            case 'cart':
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7 }}
                        className="p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 w-full max-w-4xl mx-auto backdrop-saturate-150"
                    >
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500 dark:from-indigo-400 dark:to-teal-300">
                                Your Premium Cart
                            </h2>
                            <span className="bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 text-sm px-4 py-2 rounded-full font-bold">
                                {cart.length} Items
                            </span>
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <FaShoppingCart className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">Your cart is feeling a bit light.</p>
                                <button onClick={() => setCurrentPage('home')} className="mt-6 px-6 py-2 bg-gradient-to-r from-teal-500 to-indigo-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all">Start Shopping</button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-6">
                                    {cart.map((item) => (
                                        <motion.div
                                            whileHover={{ scale: 1.01 }}
                                            key={item.cartId}
                                            className="flex flex-col sm:flex-row items-center justify-between p-5 bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:border-teal-300 transition-all"
                                        >
                                            <div className="flex items-center space-x-6 w-full sm:w-auto mb-4 sm:mb-0">
                                                <img src={item.image} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl shadow-md" />
                                                <div>
                                                    <p className="text-xl text-gray-800 dark:text-teal-300 font-extrabold tracking-tight">
                                                        {language === 'English' ? item.name : language === 'Tamil' ? item.tamilName : item.hindiName}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Farm: {item.farmerName}</p>
                                                    <p className="text-xs text-teal-600 dark:text-teal-500 bg-teal-50 dark:bg-teal-900/30 inline-block px-2 py-1 rounded-md mt-2 font-medium">
                                                        {translations[language].stock}: {item.stock} kg max
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between w-full sm:w-auto space-x-6 sm:space-x-8">
                                                <div className="flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
                                                    <button onClick={() => updateCartItem(item.cartId, item.qty - 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md font-bold transition-colors">-</button>
                                                    <input
                                                        type="number"
                                                        value={item.qty}
                                                        onChange={(e) => updateCartItem(item.cartId, parseInt(e.target.value) || 1)}
                                                        className="w-12 text-center bg-transparent border-none text-gray-800 dark:text-white font-bold focus:ring-0"
                                                        min="1"
                                                        max={item.stock}
                                                    />
                                                    <button onClick={() => updateCartItem(item.cartId, item.qty + 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md font-bold transition-colors">+</button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl text-teal-600 dark:text-teal-400 font-black">₹{(item.qty * item.price).toFixed(2)}</p>
                                                    <p className="text-xs text-gray-400">₹{item.price}/kg</p>
                                                </div>
                                                <button onClick={() => removeCartItem(item.cartId)} className="p-3 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm">
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="mt-10 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-lg">Order Total</p>
                                            <p className="text-sm text-gray-400 mt-1">Shipping & taxes calculated at checkout</p>
                                        </div>
                                        <p className="text-4xl font-black text-gray-800 dark:text-teal-400">₹{totalAmount.toFixed(2)}</p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02, boxShadow: "0px 10px 30px -10px rgba(20,184,166,0.6)" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={placeOrder}
                                        className="w-full py-5 bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600 text-white rounded-xl shadow-xl font-bold text-lg tracking-wide transition-all"
                                    >
                                        {translations[language].placeOrder} →
                                    </motion.button>
                                </div>
                            </>
                        )}
                    </motion.div>
                );
            case 'orderConfirmation':
                return <OrderConfirmation />;

            default:
                return <p className="text-gray-600 dark:text-gray-400">Loading...</p>;
        }
    };

    return (
        <div className={`min-h-screen font-sans flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-all duration-500`}>
            <ToastContainer />
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7 }}
                className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-700 to-teal-600 dark:from-indigo-800 dark:to-teal-700 text-white p-4 shadow-2xl"
            >
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">
                        FarmFresh - {customer.name}
                    </div>
                    <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={toggleNav} className="sm:hidden text-2xl">
                        <FaBars />
                    </motion.button>
                    <AnimatePresence>
                        {isNavOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-16 left-0 right-0 bg-gradient-to-r from-indigo-700 to-teal-600 dark:from-indigo-800 dark:to-teal-700 p-4 sm:hidden shadow-lg rounded-b-xl"
                            >
                                <div className="space-y-4">
                                    {[
                                        { icon: <FaHome />, label: translations[language].home, page: 'home' },
                                        { icon: <FaUser />, label: translations[language].profile, page: 'profile' },
                                        { icon: <FaList />, label: translations[language].orders, page: 'orders' },
                                        { icon: <FaHeart />, label: translations[language].wishlist, page: 'wishlist' },
                                        { icon: <FaMapMarkerAlt />, label: translations[language].address, page: 'address' },
                                        { icon: <FaCreditCard />, label: translations[language].payment, page: 'payment' },
                                        { icon: <FaSignOutAlt />, label: translations[language].logout, page: 'logout' },
                                    ].map((item) => (
                                        <motion.button
                                            key={item.page}
                                            whileHover={{ scale: 1.15 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="w-full text-left p-3 rounded-lg flex items-center"
                                            onClick={() => {
                                                if (item.page === 'logout') {
                                                    if (window.confirm("Are you sure you want to log out?")) {
                                                        auth.signOut().then(() => {
                                                            toast.info('Logged out successfully');
                                                            window.location.href = '/';
                                                        });
                                                    }
                                                } else {
                                                    setCurrentPage(item.page);
                                                }
                                                setIsNavOpen(false);
                                            }}
                                        >
                                            {item.icon} <span className="ml-3">{item.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                                <div className="mt-6">
                                    <select
                                        className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                    >
                                        <option value="English">English</option>
                                        <option value="Tamil">Tamil</option>
                                        <option value="Hindi">Hindi</option>
                                    </select>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={toggleDarkMode} className="w-full mt-4 p-3 rounded-lg bg-gradient-to-r from-teal-500 to-indigo-500 text-white">
                                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="hidden sm:flex items-center space-x-4">
                        {[
                            { icon: <FaHome />, label: translations[language].home, page: 'home' },
                            { icon: <FaUser />, label: translations[language].profile, page: 'profile' },
                            { icon: <FaList />, label: translations[language].orders, page: 'orders' },
                            { icon: <FaHeart />, label: translations[language].wishlist, page: 'wishlist' },
                            { icon: <FaMapMarkerAlt />, label: translations[language].address, page: 'address' },
                            { icon: <FaCreditCard />, label: translations[language].payment, page: 'payment' },
                            { icon: <FaSignOutAlt />, label: translations[language].logout, page: 'logout' },
                        ].map((item) => (
                            <motion.button
                                key={item.page}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-lg flex items-center"
                                onClick={() => {
                                    if (item.page === 'logout') {
                                        if (window.confirm("Are you sure you want to log out?")) {
                                            auth.signOut().then(() => {
                                                toast.info('Logged out successfully');
                                                window.location.href = '/';
                                            });
                                        }
                                    } else {
                                        setCurrentPage(item.page);
                                    }
                                }}
                            >
                                {item.icon} <span className="ml-2">{item.label}</span>
                            </motion.button>
                        ))}
                        <select
                            className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="English">EN</option>
                            <option value="Tamil">TA</option>
                            <option value="Hindi">HI</option>
                        </select>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={toggleDarkMode} className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-indigo-500 text-white">
                            {darkMode ? 'Light' : 'Dark'}
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            <div className="flex-1 pt-24 pb-8 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full">
                {renderPage()}
            </div>

            <motion.footer
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="bg-gradient-to-r from-indigo-700 to-teal-600 dark:from-indigo-800 dark:to-teal-700 text-white p-4 text-center shadow-2xl"
            >
                <p>© 2025 FarmFresh. All rights reserved.</p>
                <p className="text-sm mt-2">Freshness delivered from farm to table.</p>
            </motion.footer>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="fixed top-20 right-6 bg-gradient-to-r from-teal-500 to-indigo-500 text-white p-4 rounded-full shadow-2xl flex items-center z-40"
                onClick={() => setCurrentPage('cart')}
            >
                <FaShoppingCart className="text-xl" />
                {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        {cart.length}
                    </span>
                )}
            </motion.button>
        </div>
    );
};

export default CustomerDashboard;