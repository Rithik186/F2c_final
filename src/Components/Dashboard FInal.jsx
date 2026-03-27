import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase.js";
import { getDatabase, ref, onValue, remove, update, set } from "firebase/database";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler);

// --- Translations & Config ---
const translations = {
    "en-IN": {
        helloFarmer: "Hello, Farmer!",
        settings: "Settings",
        help: "Help",
        weather: "Weather",
        confirmed: "Confirmed Orders",
        dispatched: "Dispatched Orders",
        cancelled: "Cancelled Orders",
        previousOrders: "Previous Orders",
        currentOrders: "Current Orders",
        totalEarnings: "Total Earnings",
        marketPrices: "Market Prices",
        viewMarketTrends: "View Market Trends",
        addProduct: "Add Product",
        cropRecommendation: "Crop Recommendation",
        ordersGraph: "Orders Graph",
        yourProducts: "Your Products",
        logout: "Logout",
        withdrawProduct: "Withdraw Product",
        feedback: "Feedback",
        newMessage: "New Message",
        lightMode: "Light Mode",
        darkMode: "Dark Mode",
        farmingNews: "Farming News",
        newToDashboard: "New to this dashboard?",
        yes: "Yes",
        no: "No",
        next: "Next",
        finish: "Finish",
        send: "Send",
        cancel: "Cancel",
        messagePlaceholder: "Type your message here...",
        feedbackPlaceholder: "Type your feedback here...",
        guideConfirmed: "View your confirmed orders here.",
        guideCancelled: "See cancelled orders in this section.",
        guideDispatched: "Track dispatched orders here.",
        guideTotalEarnings: "Check your total earnings from all orders.",
        guideCurrentOrders: "Monitor your ongoing orders here.",
        guidePreviousOrders: "View your past completed orders.",
        guideSellSurplus: "View market trends here.",
        guideCropRecommendation: "Get crop suggestions based on market trends.",
        guideFarmingNews: "Stay updated with the latest farming news.",
        guideOrdersGraph: "Analyze your order trends with this graph.",
        guideYourProducts: "See all your listed products here.",
        guideWeather: "Check real-time weather updates for your area.",
        guideNewMessage: "Send or view messages and notifications.",
        guideFeedback: "Submit your feedback about the platform.",
        guideWithdrawProduct: "Remove products from your listings here.",
        guideAddProduct: "Add new products to sell in this section.",
    },
    "ta-IN": {
        helloFarmer: "வணக்கம், விவசாயி!",
        settings: "அமைப்புகள்",
        help: "உதவி",
        weather: "வானிலை",
        confirmed: "உறுதிப்படுத்தப்பட்ட ஆர்டர்கள்",
        dispatched: "அனுப்பப்பட்ட ஆர்டர்கள்",
        cancelled: "ரத்து செய்யப்பட்ட ஆர்டர்கள்",
        previousOrders: "முந்தைய ஆர்டர்கள்",
        currentOrders: "தற்போதைய ஆர்டர்கள்",
        totalEarnings: "மொத்த வருவாய்",
        marketPrices: "சந்தை விலைகள்",
        viewMarketTrends: "சந்தை போக்குகளைப் பார்",
        addProduct: "பொருளை சேர்",
        cropRecommendation: "பயிர் பரிந்துரை",
        ordersGraph: "ஆர்டர் வரைபடம்",
        yourProducts: "உங்கள் பொருட்கள்",
        logout: "வெளியேறு",
        withdrawProduct: "பொருளை திரும்பப் பெறு",
        feedback: "கருத்து",
        newMessage: "புதிய செய்தி",
        lightMode: "லைட் மோட்",
        darkMode: "டார்க் மோட்",
        farmingNews: "விவசாய செய்திகள்",
        newToDashboard: "இந்த டாஷ்போர்டுக்கு புதியவரா?",
        yes: "ஆம்",
        no: "இல்லை",
        next: "அடுத்து",
        finish: "முடி",
        send: "அனுப்பு",
        cancel: "ரத்து",
        messagePlaceholder: "உங்கள் செய்தியை இங்கே தட்டச்சு செய்யவும்...",
        feedbackPlaceholder: "உங்கள் கருத்தை இங்கே தட்டச்சு செய்யவும்...",
        guideConfirmed: "இங்கே உங்கள் உறுதிப்படுத்தப்பட்ட ஆர்டர்களைப் பார்க்கவும்。",
        guideCancelled: "இந்த பகுதியில் ரத்து செய்யப்பட்ட ஆர்டர்களைப் பார்க்கவும்。",
        guideDispatched: "இங்கே அனுப்பப்பட்ட ஆர்டர்களைக் கண்காணிக்கவும்。",
        guideTotalEarnings: "அனைத்து ஆர்டர்களிலிருந்து உங்கள் மொத்த வருவாயை சரிபார்க்கவும்。",
        guideCurrentOrders: "இங்கே உங்கள் தற்போதைய ஆர்டர்களைக் கண்காணிக்கவும்。",
        guidePreviousOrders: "உங்கள் முந்தைய முடிந்த ஆர்டர்களைப் பார்க்கவும்。",
        guideSellSurplus: "இங்கே சந்தை போக்குகளைப் பார்க்கவும்。",
        guideCropRecommendation: "சந்தை போக்குகளின் அடிப்படையில் பயிர் பரிந்துரைகளைப் பெறவும்。",
        guideFarmingNews: "சமீபத்திய விவசாய செய்திகளுடன் புதுப்பித்த நிலையில் இருக்கவும்。",
        guideOrdersGraph: "இந்த வரைபடத்துடன் உங்கள் ஆர்டர் போக்குகளை பகுப்பாய்வு செய்யவும்。",
        guideYourProducts: "இங்கே உங்கள் பட்டியலிடப்பட்ட அனைத்து பொருட்களையும் பார்க்கவும்。",
        guideWeather: "உங்கள் பகுதிக்கான நிகழ்நேர வானிலை புதுப்பிப்புகளை சரிபார்க்கவும்。",
        guideNewMessage: "செய்திகளை அனுப்பவும் அல்லது பார்க்கவும் மற்றும் அறிவிப்புகளைப் பார்க்கவும்。",
        guideFeedback: "பிளாட்ஃபார்ம் பற்றிய உங்கள் கருத்தை சமர்ப்பிக்கவும்。",
        guideWithdrawProduct: "இங்கே உங்கள் பட்டியல்களிலிருந்து பொருட்களை அகற்றவும்。",
        guideAddProduct: "இந்த பகுதியில் புதிய பொருட்களை விற்க சேர்க்கவும்。",
    },
    "hi-IN": {
        helloFarmer: "नमस्ते, किसान!",
        settings: "सेटिंग्स",
        help: "सहायता",
        weather: "मौसम",
        confirmed: "पुष्टि किए गए ऑर्डर",
        dispatched: "भेजे गए ऑर्डर",
        cancelled: "रद्द किए गए ऑर्डर",
        previousOrders: "पिछले ऑर्डर",
        currentOrders: "वर्तमान ऑर्डर",
        totalEarnings: "कुल आय",
        marketPrices: "बाजार मूल्य",
        viewMarketTrends: "बाजार रुझान देखें",
        addProduct: "उत्पाद जोड़ें",
        cropRecommendation: "फसल सिफारिश",
        ordersGraph: "ऑर्डर ग्राफ",
        yourProducts: "आपके उत्पाद",
        logout: "लॉगआउट",
        withdrawProduct: "उत्पाद वापस लें",
        feedback: "प्रतिक्रिया",
        newMessage: "नया संदेश",
        lightMode: "लाइट मोड",
        darkMode: "डार्क मोड",
        farmingNews: "कृषि समाचार",
        newToDashboard: "क्या आप इस डैशबोर्ड में नए हैं?",
        yes: "हाँ",
        no: "नहीं",
        next: "अगला",
        finish: "समाप्त",
        send: "भेजें",
        cancel: "रद्द करें",
        messagePlaceholder: "अपना संदेश यहाँ टाइप करें...",
        feedbackPlaceholder: "अपनी प्रतिक्रिया यहाँ टाइप करें...",
        guideConfirmed: "यहाँ अपने पुष्टि किए गए ऑर्डर देखें।",
        guideCancelled: "इस खंड में रद्द किए गए ऑर्डर देखें।",
        guideDispatched: "यहाँ भेजे गए ऑर्डर ट्रैक करें।",
        guideTotalEarnings: "सभी ऑर्डर से अपनी कुल आय जांचें।",
        guideCurrentOrders: "यहाँ अपने चल रहे ऑर्डर की निगरानी करें।",
        guidePreviousOrders: "अपने पिछले पूर्ण किए गए ऑर्डर देखें।",
        guideSellSurplus: "यहाँ बाजार रुझान देखें।",
        guideCropRecommendation: "बाजार के रुझानों के आधार पर फसल सुझाव प्राप्त करें।",
        guideFarmingNews: "नवीनतम कृषि समाचारों के साथ अपडेट रहें।",
        guideOrdersGraph: "इस ग्राफ के साथ अपने ऑर्डर रुझानों का विश्लेषण करें।",
        guideYourProducts: "यहाँ अपने सभी सूचीबद्ध उत्पाद देखें।",
        guideWeather: "अपने क्षेत्र के लिए वास्तविक समय मौसम अपडेट जांचें।",
        guideNewMessage: "संदेश भेजें या देखें और सूचनाएँ देखें।",
        guideFeedback: "प्लेटफॉर्म के बारे में अपनी प्रतिक्रिया सबमिट करें।",
        guideWithdrawProduct: "यहाँ अपनी लिस्टिंग से उत्पाद हटाएँ।",
        guideAddProduct: "इस खंड में बिक्री के लिए नए उत्पाद जोड़ें।",
    },
    "en-US": {
        helloFarmer: "Hello, Farmer!",
        settings: "Settings",
        help: "Help",
        weather: "Weather",
        confirmed: "Confirmed Orders",
        dispatched: "Dispatched Orders",
        cancelled: "Canceled Orders",
        previousOrders: "Previous Orders",
        currentOrders: "Current Orders",
        totalEarnings: "Total Earnings",
        marketPrices: "Market Prices",
        viewMarketTrends: "View Market Trends",
        addProduct: "Add Product",
        cropRecommendation: "Crop Recommendation",
        ordersGraph: "Orders Graph",
        yourProducts: "Your Products",
        logout: "Logout",
        withdrawProduct: "Withdraw Product",
        feedback: "Feedback",
        newMessage: "New Message",
        lightMode: "Light Mode",
        darkMode: "Dark Mode",
        farmingNews: "Farming News",
        newToDashboard: "New to this dashboard?",
        yes: "Yes",
        no: "No",
        next: "Next",
        finish: "Finish",
        send: "Send",
        cancel: "Cancel",
        messagePlaceholder: "Type your message here...",
        feedbackPlaceholder: "Type your feedback here...",
        guideProfile: "Click your profile image to access settings, edit personal details, or manage payment methods - essential for receiving your earnings from sales.",
        guideLanguage: "Tap here to switch the dashboard language between English, Tamil, and Hindi. This helps you navigate the platform in your preferred language.",
        guideTheme: "Toggle between Light and Dark mode. Use Dark mode for low-light environments to reduce eye strain, or Light mode for bright conditions.",
        guideConfirmed: "These are your 'Confirmed' orders. The buyer has placed the order, and it is waiting for you to pack and ship. Review details here.",
        guideDispatched: "Track orders that have been 'Dispatched'. Use this section to monitor deliveries that are currently en route to the customer.",
        guideCancelled: "View 'Cancelled' orders here. Analyze the reasons for cancellation to improve your product quality or delivery service.",
        guideWeather: "Check real-time weather updates for your farm's location. Accurate forecasts help you plan pivotal harvesting and watering schedules.",
        guideTotalEarnings: "This card shows your total accumulated revenue from all successfully completed orders. It is a key indicator of your financial performance.",
        guideCurrentOrders: "A live feed of all your active orders. Click on any individual order item to view full details like customer name, items, and amount.",
        guideSellSurplus: "Analyze current market prices and trends for various crops. Use this data-driven insight to decide which crops to plant for maximum profit.",
        guideCropRecommendation: "Get AI-powered recommendations for what to grow next. These suggestions are based on real-time market demand and your local season.",
        guideFarmingNews: "Stay informed with curated video news. Watch detailed clips about modern farming techniques, government schemes, and agricultural best practices.",
        guideOrdersGraph: " A visual bar chart of your sales performance. Use the dropdown filter to view data for 'Today', 'Last 6 Months', or 'This Year'.",
        guideAddProduct: "Example: 'Tomato, 50kg, ₹40'. Click this button to list a new crop or product for sale. You will need to provide photos and stock details.",
        guideYourProducts: "Manage your active listings here. You can update stock quantities, change prices, or withdraw products if they are no longer available.",
        guideNewMessage: "Access your inbox for messages from buyers or platform support. Stay connected to resolve queries and build customer trust.",
        guideFeedback: "We value your input! Use this form to send us suggestions, report bugs, or share your general experience with the dashboard.",
        guideWithdrawProduct: "Quickly remove a specific product from the marketplace. Use this if you have run out of stock or want to stop selling an item temporarily.",
    },
};

const audioFiles = {
    "en-IN": {
        earnings: "/Audio/Indiaenglish/earnings.mp3",
        orders: "/Audio/Indiaenglish/orders.mp3",
        products: "/Audio/Indiaenglish/products.mp3",
        graph: "/Audio/Indiaenglish/graph.mp3",
        recommendations: "/Audio/Indiaenglish/recommendations.mp3",
        weather: "/Audio/Indiaenglish/weather.mp3",
    },
    "ta-IN": {
        earnings: "/Audio/TAMIL/earnings.mp3",
        orders: "/Audio/TAMIL/orders.mp3",
        products: "/Audio/TAMIL/products.mp3",
        graph: "/Audio/TAMIL/graph.mp3",
        recommendations: "/Audio/TAMIL/recommendations.mp3",
        weather: "/Audio/TAMIL/weather.mp3",
    },
    "hi-IN": {
        earnings: "/Audio/Hindhi/earnings.mp3",
        orders: "/Audio/hi-IN/orders.mp3",
        products: "/Audio/hi-IN/products.mp3",
        graph: "/Audio/hi-IN/graph.mp3",
        recommendations: "/Audio/hi-IN/recommendations.mp3",
        weather: "/Audio/hi-IN/weather.mp3",
    },
};

const getGuideSteps = (language) => [
    { id: "orders", target: ".confirmed", textKey: "guideConfirmed" },
    { id: "orders", target: ".dispatched", textKey: "guideDispatched" },
    { id: "orders", target: ".cancelled", textKey: "guideCancelled" },
    { id: "weather", target: ".weather", textKey: "guideWeather" },
    { id: "earnings", target: ".total-earnings", textKey: "guideTotalEarnings" },
    { id: "earnings", target: ".current-orders", textKey: "guideCurrentOrders" },
    { id: "recommendations", target: ".view-market-trends", textKey: "guideSellSurplus" },
    { id: "recommendations", target: ".crop-recommendation", textKey: "guideCropRecommendation" },
    { id: "farmingNews", target: ".farming-news", textKey: "guideFarmingNews" },
    { id: "graph", target: ".orders-graph", textKey: "guideOrdersGraph" },
    { id: "products", target: ".add-product", textKey: "guideAddProduct" },
    { id: "products", target: ".your-products", textKey: "guideYourProducts" },
    // Profile features removed from tour start as per request
];

const cropRecommendations = [
    { name: "Onions", image: "https://images.unsplash.com/photo-1618512496248-a07fe4613e8e?q=80&w=1000&auto=format&fit=crop" },
    { name: "Tomatoes", image: "https://images.unsplash.com/photo-1599819810277-2320b4e1e3ed?q=80&w=1000&auto=format&fit=crop" },
    { name: "Potatoes", image: "https://images.unsplash.com/photo-1518977829002-6a9d13e7a1e5?q=80&w=1000&auto=format&fit=crop" },
    { name: "Wheat", image: "https://images.unsplash.com/photo-1600005994501-2f3e2b67a60f?q=80&w=1000&auto=format&fit=crop" },
    { name: "Rice", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop" },
];

const fallbackFarmingNews = [
    { id: "1", title: "Innovative Farming Techniques 2025", thumbnail: "https://via.placeholder.com/150?text=Video1", url: "#" },
    { id: "2", title: "Sustainable Agriculture Trends", thumbnail: "https://via.placeholder.com/150?text=Video2", url: "#" },
    { id: "3", title: "Modern Irrigation Systems", thumbnail: "https://via.placeholder.com/150?text=Video3", url: "#" },
];

// --- Sub-Components for Organization ---

const SectionCard = ({ className = "", children, onClick, ...props }) => (
    <motion.div
        className={`p-6 rounded-2xl shadow-md border overflow-hidden relative ${className}`}
        whileHover={{ scale: 1.02, boxShadow: "0 15px 30px rgba(0,0,0,0.15)" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={onClick}
        {...props}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        {children}
    </motion.div>
);

const StatusCard = ({ title, statusKey, orders, darkMode, colorClass, translations }) => (
    <SectionCard className={`${statusKey} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <h3 className={`font-semibold text-xl mb-4 ${colorClass}`}>{title}</h3>
        <div className="space-y-3">
            {orders.length > 0 ? (
                orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                        <p className={`font-medium truncate ${darkMode ? "text-gray-300" : "text-gray-700"}`} title={order.displayId}>
                            {order.displayId}
                        </p>
                        <div className="flex justify-between items-center text-xs mt-1">
                            <span className="font-bold">₹{order.totalAmount.toFixed(2)}</span>
                            <span className={`truncate max-w-[100px] ${darkMode ? "text-gray-400" : "text-gray-500"}`} title={order.customerName}>
                                {order.customerName}
                            </span>
                        </div>
                    </div>
                ))
            ) : (
                <p className={`text-sm italic ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No {statusKey} orders</p>
            )}
        </div>
    </SectionCard>
);

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center text-red-600 bg-gray-50 p-4">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-2">Something went wrong.</h1>
                        <p className="text-sm">{this.state.error?.message || "Unknown error"}</p>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- Main Component ---

const Dashboard = () => {
    // State
    const [darkMode, setDarkMode] = useState(false);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [farmerData, setFarmerData] = useState({ name: "", id: "", pic: "https://via.placeholder.com/150" });
    const [showSettings, setShowSettings] = useState(false);
    const [language, setLanguage] = useState("en-IN");
    const [earnings, setEarnings] = useState(0);
    const [showGuide, setShowGuide] = useState(false);
    const [showGuidePrompt, setShowGuidePrompt] = useState(true);
    const [guideStep, setGuideStep] = useState(0);
    const [modals, setModals] = useState({ withdraw: false, message: false, feedback: false });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [inputs, setInputs] = useState({ message: "", feedback: "" });
    const [farmingNews, setFarmingNews] = useState(null);
    const [marketTrends, setMarketTrends] = useState(null);
    const [recommendedCrop, setRecommendedCrop] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showOrderManagement, setShowOrderManagement] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [graphFilter, setGraphFilter] = useState("This Year");
    const [orderFilter, setOrderFilter] = useState("All");
    const [orderSort, setOrderSort] = useState("Newest");
    const [selectedOrder, setSelectedOrder] = useState(null);

    // New State for Profile & Payment Features
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentTab, setPaymentTab] = useState("upi"); // 'upi' or 'bank'

    // Profile Edit State
    const [profileForm, setProfileForm] = useState({
        name: "",
        phone: "",
        address: "",
        bio: ""
    });

    // Payment Methods State
    const [paymentMethods, setPaymentMethods] = useState({
        upiQr: "", // Base64 string of the image
        bankDetails: {
            accountName: "",
            accountNumber: "",
            ifsc: "",
            bankName: ""
        }
    });

    const audioRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const db = getDatabase();
    const guideSteps = getGuideSteps(language); // Get translated steps

    // Effects
    useEffect(() => {
        setRecommendedCrop(cropRecommendations[Math.floor(Math.random() * cropRecommendations.length)]);
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                setError("Please log in.");
                setLoading(false);
                navigate("/login");
                return;
            }
            setLoading(true);
            setError(null);

            // Fetch User
            // Fetch User & Payment Data
            onValue(ref(db, `users/${user.uid}`), (snap) => {
                const data = snap.val() || {};
                setFarmerData({
                    name: data.name || user.displayName || "Farmer",
                    id: user.uid,
                    pic: data.photoURL || user.photoURL || "https://via.placeholder.com/150",
                    phone: data.phone || "",
                    address: data.address || "",
                    bio: data.bio || ""
                });

                // Initialize Profile Form
                setProfileForm({
                    name: data.name || user.displayName || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    bio: data.bio || ""
                });

                // Set Payment Methods if they exist
                if (data.paymentMethods) {
                    setPaymentMethods({
                        upiQr: data.paymentMethods.upiQr || "",
                        bankDetails: {
                            accountName: data.paymentMethods.bankDetails?.accountName || "",
                            accountNumber: data.paymentMethods.bankDetails?.accountNumber || "",
                            ifsc: data.paymentMethods.bankDetails?.ifsc || "",
                            bankName: data.paymentMethods.bankDetails?.bankName || ""
                        }
                    });
                }
            }, () => setError("Failed to fetch user data."));

            // Fetch Products
            onValue(ref(db, `products/farmer_${user.uid}`), (snap) => {
                if (snap.exists()) {
                    const pData = snap.val();
                    setProducts(Object.entries(pData).map(([id, p]) => ({
                        id,
                        name: p.name || "Unknown Product",
                        price: p.price || 0,
                        stock: p.quantity || p.stock || 0,
                        image: p.image || "https://via.placeholder.com/150",
                    })));
                } else setProducts([]);
                setLoading(false);
            });

            // Fetch Orders
            onValue(ref(db, "orders"), (snap) => {
                if (snap.exists()) {
                    const oData = snap.val();
                    const farmerOrders = Object.entries(oData)
                        .filter(([_, o]) => o.products && Array.isArray(o.products) && o.products.some(p => p.farmerId === `farmer_${user.uid}`))
                        .map(([id, o]) => {
                            const myProds = o.products
                                .filter(p => p.farmerId === `farmer_${user.uid}`)
                                .map(p => ({
                                    ...p,
                                    name: p.name || p.productName || p.title || "Unknown Product",
                                    price: parseFloat(p.price) || 0,
                                    quantity: parseInt(p.quantity) || 1,
                                    totalPrice: parseFloat(p.totalPrice) || (parseFloat(p.price || 0) * (parseInt(p.quantity) || 1))
                                }));
                            const myTotal = myProds.reduce((sum, p) => sum + (parseFloat(p.totalPrice) || 0), 0);
                            const status = o.status === "Confirmed" ? "Dispatched" : o.status || "Unknown";

                            // Simple Display ID Logic: Numeric Hash for consistency
                            let displayId = o.orderId || id;
                            if (displayId.includes('_')) {
                                displayId = displayId.split('_').pop();
                            } else if (displayId.length > 10 && isNaN(displayId)) {
                                // Generate a deterministic 6-digit number from the ID string if it's a long hash
                                const hash = displayId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                displayId = `${(hash * 123) % 1000000}`.padStart(6, '0');
                            }
                            // Ensure it looks like a clean ID
                            displayId = String(displayId).replace(/\D/g, '').slice(0, 10) || '000000';

                            return {
                                id: id, // Keep original ID for logic
                                displayId: `#${displayId}`,
                                status,
                                totalAmount: myTotal,
                                date: o.orderDateTime || o.date || new Date().toISOString(),
                                products: myProds,
                                customerName: o.customerName || "Unknown Customer",
                                paymentMethod: (typeof o.paymentMethod === 'object' && o.paymentMethod !== null)
                                    ? (o.paymentMethod.type || o.paymentMethod.value || "Online")
                                    : (o.paymentMethod || "COD"),
                                address: o.shippingAddress || "N/A"
                            };
                        });
                    setOrders(farmerOrders);
                    setEarnings(farmerOrders.filter(o => o.status === "Dispatched").reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0));
                } else {
                    setOrders([]);
                    setEarnings(0);
                }
            });

            // Weather & News logic from original code
            const fetchWeather = async (lat, lon) => {
                try {
                    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=metric`);
                    const data = await res.json();
                    if (data.cod === 200) {
                        setWeather({ main: data.main, weather: data.weather, name: data.name, country: data.sys.country });
                    } else {
                        throw new Error(data.message || "Weather API Error");
                    }
                } catch (e) {
                    console.warn("Weather fetch failed, using fallback:", e);
                    setWeatherFallback();
                }
            };

            const setWeatherFallback = () => setWeather({
                main: { temp: 28.5, humidity: 65, temp_min: 26, temp_max: 31 },
                weather: [{ description: "mostly sunny", icon: "01d", main: "Clear" }],
                name: "New Delhi",
                country: "IN"
            });

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    p => fetchWeather(p.coords.latitude, p.coords.longitude),
                    () => setWeatherFallback(),
                    { timeout: 10000 } // 10s timeout
                );
            } else {
                setWeatherFallback();
            }

            const fetchNews = async () => {
                // Pre-formatted Fallback Data (Real, working videos)
                const fallbackData = [
                    {
                        id: "IPRj3h1lPvw",
                        title: "Tamil Nadu: Fair Sugarcane sales in Tamil Nadu for Trichy Farmers | India Today News | Agriculture",
                        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3m7OTPXQV5yogXkrWGNPjIk4Z_-qt_O8IBQ&s",
                        url: "https://youtu.be/VFkpeR3wUwU?si=BU4Rca4XVUf1oYnU"
                    },
                    {
                        id: "U9t-slLl30E",
                        title: "Pruning Lower Corn Leaves Technique",
                        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIM2qP5Ks8SaWIrjM-lovCYNun-YJZ22tPyw&s",
                        url: "https://youtube.com/shorts/OahZTjpNOEA?si=ci1FkTzCM9EkR4I-"
                    },
                    {
                        id: "CalliTaXgE0",
                        title: "Harvest Fresh Onions Manually",
                        thumbnail: "https://img.freepik.com/premium-vector/agricultural-services-organic-food-youtube-video-thumbnail-design-lawn-care-garden-cover-post_691378-753.jpg",
                        url: "https://youtube.com/shorts/wH6oQkrge3g?si=yeys5fd04C04zcw7"
                    }
                ];

                try {
                    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
                    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=farming+technology+news&type=video&maxResults=5&key=${apiKey}`);

                    if (!res.ok) throw new Error(`API Error: ${res.status}`);

                    const data = await res.json();

                    if (data.items?.length) {
                        // Pick one random video from the results
                        const item = data.items[Math.floor(Math.random() * data.items.length)];
                        setFarmingNews({
                            id: item.id.videoId,
                            title: item.snippet.title,
                            thumbnail: item.snippet.thumbnails.medium.url,
                            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
                        });
                    } else {
                        throw new Error("No items found");
                    }
                } catch (error) {
                    console.warn("YouTube API failed, using fallback data.");
                    // Pick one random video from fallback
                    const randomVideo = fallbackData[Math.floor(Math.random() * fallbackData.length)];
                    setFarmingNews(randomVideo);
                }
            };

            fetchNews();
            // No need for interval if data is static, but keeping it simple to avoid larger refactors
            // const interval = setInterval(fetchNews, 300000);

            // Market Trends
            const fetchTrends = async () => {
                // Using mock data as API key was placeholder
                setMarketTrends([
                    { id: 1, crop: "Wheat", price: 300, description: "High demand this season" },
                    { id: 2, crop: "Rice", price: 250, description: "Stable prices" },
                    { id: 3, crop: "Corn", price: 200, description: "Rising demand" },
                    { id: 4, crop: "Tomato", price: 150, description: "Seasonal surplus" },
                    { id: 5, crop: "Potato", price: 180, description: "Moderate demand" },
                ]);
            };
            fetchTrends();

            return () => { unsubscribe(); clearInterval(interval); };
        });
    }, [navigate, db]);

    // Audio Guide Effect
    // Audio Guide Effect (Manual Navigation Only)
    useEffect(() => {
        if (!showGuide) return;

        const currentStep = guideSteps[guideStep];
        if (!currentStep) return;

        // Try to play audio if available, but don't block navigation
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        const audioPath = audioFiles[language]?.[currentStep.id] || audioFiles['en-IN']?.[currentStep.id];

        if (audioPath) {
            const audio = new Audio(audioPath);
            audioRef.current = audio;
            audio.play().catch(e => console.warn("Audio play failed or blocked", e));
        }

        // Scroll logic with robust centering and delay
        setTimeout(() => {
            const el = document.querySelector(currentStep.target);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
            } else {
                console.warn(`Guide target ${currentStep.target} not found, skipping.`);
                setTimeout(() => {
                    setGuideStep(prev => prev < guideSteps.length - 1 ? prev + 1 : 0);
                }, 500);
            }
        }, 500); // 500ms delay to ensure DOM is ready and transitions complete
    }, [showGuide, guideStep, language, guideSteps]);

    // Scroll to guide element


    // Logic Helpers
    const getWeatherEmoji = (desc) => {
        const map = { "clear sky": "☀️", "few clouds": "⛅", "scattered clouds": "🌥️", "broken clouds": "🌦️", "shower rain": "🌧️", "rain": "🌧️", "thunderstorm": "⛈️", "snow": "❄️", "mist": "🌫️" };
        return map[desc?.toLowerCase()] || "🌤️";
    };

    const handleWithdraw = async () => {
        if (selectedProduct) {
            try {
                await remove(ref(db, `products/farmer_${farmerData.id}/${selectedProduct.id}`));
                setProducts(p => p.filter(i => i.id !== selectedProduct.id));
                setModals(m => ({ ...m, withdraw: false }));
                setSelectedProduct(null);
            } catch (e) { console.error(e); setError("Failed to withdraw"); }
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                // Update in Realtime Database
                update(ref(db, `users/${farmerData.id}`), { photoURL: base64String })
                    .then(() => {
                        setFarmerData(prev => ({ ...prev, pic: base64String }));
                    })
                    .catch(err => console.error("Failed to update profile pic", err));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileUpdate = () => {
        const user = auth.currentUser;
        if (!user) return;
        update(ref(db, `users/${user.uid}`), {
            name: profileForm.name,
            phone: profileForm.phone,
            address: profileForm.address,
            bio: profileForm.bio
        }).then(() => {
            setShowProfileModal(false);
            setFarmerData(prev => ({ ...prev, ...profileForm })); // Optimistic update
            alert("Profile Updated Successfully!");
        }).catch(err => alert("Failed to update profile: " + err.message));
    };

    const handlePaymentSave = () => {
        const user = auth.currentUser;
        if (!user) return;

        // Save to public farmerPaymentDetails node for easier access by customers
        // Use 'set' to ensure complete overwrite/creation of the node
        const publicPaymentRef = ref(db, `farmerPaymentDetails/${user.uid}`);
        const userProfileRef = ref(db, `users/${user.uid}/paymentMethods`);

        console.log("Saving Payment Methods for:", user.uid, paymentMethods);

        Promise.all([
            set(publicPaymentRef, paymentMethods), // Changed to set
            update(userProfileRef, paymentMethods)
        ])
            .then(() => {
                setShowPaymentModal(false);
                alert("Payment Methods Saved & Published Successfully!");
            })
            .catch(err => {
                console.error("Payment Save Error:", err);
                alert("Failed to save payment methods: " + err.message);
            });
    };

    const handleQrUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPaymentMethods(prev => ({ ...prev, upiQr: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Dynamic Chart Data ---
    const chartData = React.useMemo(() => {
        const labels = [];
        const data = [];
        const now = new Date();

        if (graphFilter === "Today") {
            // Hourly breakdown for today
            for (let i = 0; i < 24; i += 4) { // 4-hour intervals for cleaner look
                labels.push(`${i}:00`);
                data.push(0);
            }

            orders.forEach(order => {
                if (order.status === "Dispatched" && order.date) {
                    const orderDate = new Date(order.date);
                    if (orderDate.toDateString() === now.toDateString()) {
                        const hour = orderDate.getHours();
                        const index = Math.floor(hour / 4);
                        if (index < data.length) data[index] += parseFloat(order.totalAmount) || 0;
                    }
                }
            });
        } else if (graphFilter === "Last 6 Months") {
            // Last 6 months
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                labels.push(d.toLocaleString("default", { month: "short" }));
                data.push(0);
            }

            orders.forEach(order => {
                if (order.status === "Dispatched" && order.date) {
                    const orderDate = new Date(order.date);
                    const monthDiff = (now.getMonth() - orderDate.getMonth()) + (12 * (now.getFullYear() - orderDate.getFullYear()));
                    if (monthDiff >= 0 && monthDiff < 6) {
                        const index = 5 - monthDiff;
                        if (index >= 0) data[index] += parseFloat(order.totalAmount) || 0;
                    }
                }
            });
        } else {
            // This Year (Monthly)
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            for (let i = 0; i < 12; i++) {
                const d = new Date(now.getFullYear(), i, 1);
                labels.push(d.toLocaleString("default", { month: "short" }));
                data.push(0);
            }

            orders.forEach(order => {
                if (order.status === "Dispatched" && order.date) {
                    const orderDate = new Date(order.date);
                    if (orderDate.getFullYear() === now.getFullYear()) {
                        data[orderDate.getMonth()] += parseFloat(order.totalAmount) || 0;
                    }
                }
            });
        }

        return {
            labels,
            datasets: [{
                label: "Revenue",
                data,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    if (darkMode) {
                        gradient.addColorStop(0, "#22c55e"); // Green 500
                        gradient.addColorStop(1, "rgba(34, 197, 94, 0.2)");
                    } else {
                        gradient.addColorStop(0, "#16a34a"); // Green 600
                        gradient.addColorStop(1, "rgba(22, 163, 74, 0.2)");
                    }
                    return gradient;
                },
                borderRadius: 8,
                barThickness: graphFilter === "Today" ? 40 : 20,
            }]
        };
    }, [orders, graphFilter, darkMode]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold text-green-600">Loading Dashboard...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold">{error}</div>;

    return (
        <motion.div
            className={`min-h-screen p-4 md:p-8 font-sans transition-colors duration-300 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-[#E5F0EA] text-slate-900"}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
            {/* --- Header Section --- */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
                <div className="flex items-center gap-5 w-full lg:w-auto">
                    <div
                        className="relative shrink-0 cursor-pointer group profile-trigger"
                        onClick={() => setShowProfileMenu(true)}
                    >
                        <img
                            src={farmerData.pic}
                            alt="Profile"
                            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover ring-4 ring-green-500/20 shadow-lg group-hover:ring-green-500/50 group-hover:scale-105 transition-all duration-300"
                        />
                        <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 group-hover:animate-pulse"></span>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                            {translations[language].helloFarmer.replace("Farmer", farmerData.name.split(" ")[0])}
                        </h2>
                        <p className={`text-sm md:text-base mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Welcome back to your dashboard
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    {/* Language Toggle */}
                    <div className="relative language-toggle">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-100'} shadow-sm border`}
                        >
                            <span className="text-sm">
                                {language === 'en-IN' ? 'English' : language === 'ta-IN' ? 'Tamil' : 'Hindi'}
                            </span>
                            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${showLangMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </motion.button>

                        <AnimatePresence>
                            {showLangMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className={`absolute top-full right-0 mt-2 w-40 rounded-xl shadow-xl overflow-hidden z-20 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                                >
                                    {[
                                        { code: 'en-IN', label: 'English' },
                                        { code: 'ta-IN', label: 'Tamil' },
                                        { code: 'hi-IN', label: 'Hindi' }
                                    ].map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'} ${language === lang.code ? (darkMode ? 'bg-gray-700/50 text-green-400' : 'bg-green-50 text-green-600') : ''}`}
                                        >
                                            {lang.label}
                                            {language === lang.code && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Animated Theme Toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`theme-toggle relative w-14 h-8 rounded-full p-1 transition-colors duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? "bg-slate-700 focus:ring-slate-600" : "bg-sky-200 focus:ring-sky-200"}`}
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        <motion.div
                            layout
                            transition={{ type: "spring", stiffness: 700, damping: 30 }}
                            className={`w-6 h-6 rounded-full shadow-md flex items-center justify-center transform ${darkMode ? "bg-slate-900 text-yellow-400 translate-x-6" : "bg-white text-orange-500 translate-x-0"}`}
                        >
                            <AnimatePresence mode="wait">
                                {darkMode ? (
                                    <motion.svg
                                        key="moon"
                                        initial={{ opacity: 0, rotate: -90 }}
                                        animate={{ opacity: 1, rotate: 0 }}
                                        exit={{ opacity: 0, rotate: 90 }}
                                        className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </motion.svg>
                                ) : (
                                    <motion.svg
                                        key="sun"
                                        initial={{ opacity: 0, rotate: 90 }}
                                        animate={{ opacity: 1, rotate: 0 }}
                                        exit={{ opacity: 0, rotate: -90 }}
                                        className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </motion.svg>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </button>
                </div>
            </header>

            {/* Profile Drawer Menu (Simple List Based) */}
            <AnimatePresence>
                {showProfileMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowProfileMenu(false)}
                            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className={`fixed top-0 left-0 h-full w-72 z-50 shadow-2xl flex flex-col ${darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"}`}
                        >
                            {/* Header */}
                            <div className="p-6 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <img src={farmerData.pic} alt="Profile" className="w-12 h-12 rounded-full object-cover ring-2 ring-green-500/50" />
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-base leading-tight">{farmerData.name}</h4>
                                    <p className="text-xs text-gray-400">ID: {farmerData.id.slice(0, 6)}</p>
                                </div>
                                <button onClick={() => setShowProfileMenu(false)} className="ml-auto p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Menu List */}
                            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
                                <motion.div
                                    onClick={() => { setShowProfileModal(true); setShowProfileMenu(false); }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
                                    whileHover={{ x: 5, backgroundColor: darkMode ? "rgba(31, 41, 55, 1)" : "rgba(249, 250, 251, 1)" }}
                                >
                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    <span className="font-medium text-sm">My Profile</span>
                                </motion.div>



                                <motion.div
                                    onClick={() => { setShowOrderManagement(true); setShowProfileMenu(false); }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
                                    whileHover={{ x: 5, backgroundColor: darkMode ? "rgba(31, 41, 55, 1)" : "rgba(249, 250, 251, 1)" }}
                                >
                                    <div className="relative">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                        {orders.filter(o => o.status === "Pending").length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
                                        )}
                                    </div>
                                    <span className="font-medium text-sm">Order Management</span>
                                </motion.div>

                                <motion.div
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
                                    whileHover={{ x: 5, backgroundColor: darkMode ? "rgba(31, 41, 55, 1)" : "rgba(249, 250, 251, 1)" }}
                                >
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                    <span className="font-medium text-sm">Market Prices</span>
                                </motion.div>

                                {/* Quick Settings Moved to Header */}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => { auth.signOut(); navigate("/login"); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${darkMode ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- Stats Overview & Weather --- */}
            {/* --- Stats Overview & Weather --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Status Cards */}
                <StatusCard title={translations[language].confirmed} statusKey="confirmed" orders={orders.filter(o => o.status === "Pending" || o.status === "Confirmed")} darkMode={darkMode} colorClass="text-green-500" translations={translations} />
                <StatusCard title={translations[language].dispatched} statusKey="dispatched" orders={orders.filter(o => o.status === "Dispatched")} darkMode={darkMode} colorClass="text-green-500" translations={translations} />
                <StatusCard title={translations[language].cancelled} statusKey="cancelled" orders={orders.filter(o => o.status === "Cancelled")} darkMode={darkMode} colorClass="text-green-500" translations={translations} />

                {/* Weather Widget */}
                <SectionCard className={`w-full weather flex flex-col items-center justify-center text-center p-0 relative overflow-hidden group ${darkMode ? "border-gray-700" : "border-gray-100"} hover:border-transparent`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${darkMode ? "from-emerald-900 via-green-900 to-teal-900" : "from-emerald-400 via-green-500 to-teal-500"} opacity-90 group-hover:opacity-100 transition-all duration-500`}></div>
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] group-hover:backdrop-blur-none transition-all duration-500"></div>

                    <div className="relative z-10 w-full h-full p-4 flex flex-col items-center justify-center">
                        <h3 className="font-semibold text-sm mb-3 text-white/90 uppercase tracking-widest text-[10px]">{translations[language].weather}</h3>
                        {weather ? (
                            <div className="flex flex-col items-center">
                                <div className="mb-3 transform group-hover:scale-110 group-hover:-translate-y-1 transition duration-500 filter drop-shadow-lg">
                                    {(() => {
                                        const desc = weather.weather[0].description.toLowerCase();
                                        if (desc.includes("clear")) return <div className="text-5xl animate-[spin_12s_linear_infinite]">☀️</div>;
                                        if (desc.includes("cloud")) return <div className="text-5xl animate-pulse">☁️</div>;
                                        if (desc.includes("rain") || desc.includes("drizzle")) return <div className="text-5xl animate-bounce">🌧️</div>;
                                        if (desc.includes("thunder")) return <div className="text-5xl animate-pulse">⚡</div>;
                                        if (desc.includes("snow")) return <div className="text-5xl animate-bounce">❄️</div>;
                                        return <div className="text-5xl animate-pulse">🌤️</div>;
                                    })()}
                                </div>
                                <div className="space-y-1 text-white">
                                    <p className="text-3xl font-bold tracking-tight">{Math.round(weather.main.temp)}°C</p>
                                    <p className="text-xs font-medium capitalize text-white/80">{weather.weather[0].description}</p>
                                    <p className="text-sm text-white/60 flex items-center justify-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {weather.name}, {weather.country}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-4 flex items-center justify-center"><div className="animate-spin h-6 w-6 border-2 border-white/30 border-t-white rounded-full"></div></div>
                        )}
                    </div>
                </SectionCard>
            </div>

            {/* --- Main Dashboard Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                {/* Left Column: Finance & Current Orders */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Total Earnings */}
                    <SectionCard className={`total-earnings relative overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                        <div className="relative z-10">
                            <h3 className="font-medium text-sm text-green-500 uppercase tracking-wider mb-2">{translations[language].totalEarnings}</h3>
                            <p className={`text-4xl font-bold truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
                                ₹{earnings.toLocaleString()}
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-xs text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                From processed orders
                            </div>
                        </div>
                        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 ${darkMode ? "bg-green-400" : "bg-green-600"}`}></div>
                    </SectionCard>

                    <SectionCard className={`current-orders h-[420px] flex flex-col ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">{translations[language].currentOrders}</h3>
                            <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg leading-none">
                                {orders.filter(o => !["Completed", "Cancelled"].includes(o.status)).length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                            {orders.filter(o => !["Completed", "Cancelled"].includes(o.status)).length > 0 ? (
                                orders.filter(o => !["Completed", "Cancelled"].includes(o.status)).map(o => (
                                    <div key={o.id} className={`p-3 rounded-xl border transition-all duration-200 group ${darkMode ? "bg-gray-700/30 border-gray-700 hover:bg-gray-700/50" : "bg-gray-50 border-gray-100 hover:border-blue-200 hover:shadow-sm"}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="min-w-0 flex-1 mr-2">
                                                <p className="font-bold text-sm truncate text-ellipsis" title={o.displayId}>
                                                    {o.displayId}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(o.date).toLocaleDateString()}</p>
                                            </div>
                                            <span className="font-mono font-bold text-sm text-green-500 shrink-0">₹{o.totalAmount}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${o.status === "Dispatched" ? "bg-yellow-400" : "bg-green-400"
                                                    }`}></span>
                                                <span className={`text-[11px] font-medium tracking-wide ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                                    {o.status}
                                                </span>
                                            </div>
                                            <button className="text-[10px] font-medium text-blue-500 hover:text-blue-600 hover:underline">
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                                    <svg className="w-12 h-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    <p className="text-sm">No active orders</p>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>

                {/* Center Column: Intelligence & Charts */}
                <div className="lg:col-span-6 space-y-6">
                    {/* Market Trends & Recommendations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Market Trends */}
                        <SectionCard className={`view-market-trends flex flex-col ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg text-green-500">{translations[language].viewMarketTrends}</h3>
                                <button onClick={() => setMarketTrends(prev => [...prev])} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                            </div>
                            <div className="space-y-2">
                                {marketTrends?.slice(0, 3).map((t, i) => (
                                    <div key={i} className={`flex justify-between items-center p-3 rounded-lg text-sm transition-colors ${darkMode ? "bg-gray-700/30 hover:bg-gray-700/50" : "bg-gray-50 hover:bg-gray-100"}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">{t.crop}</span>
                                            {t.price > 200 && (
                                                <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded border border-green-500/20">
                                                    High
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-mono font-bold">₹{t.price}</span>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Crop Recommendation */}
                        <SectionCard className={`crop-recommendation flex flex-col h-80 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                            <h3 className="font-semibold text-lg text-green-500">{translations[language].cropRecommendation}</h3>
                            {recommendedCrop ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <div className="relative mb-4 group">
                                        <img src={recommendedCrop.image} alt={recommendedCrop.name} className="w-24 h-24 rounded-2xl object-cover shadow-lg transform group-hover:scale-105 transition duration-500" />
                                        <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5"></div>
                                    </div>
                                    <h4 className="text-xl font-bold mb-1">{recommendedCrop.name}</h4>
                                    <p className="text-sm text-gray-500">Optimized for current season</p>
                                    <button className="mt-4 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium rounded-lg">
                                        View Details
                                    </button>
                                </div>
                            ) : <div className="flex-1 flex items-center justify-center"><p className="text-sm text-gray-400">Loading...</p></div>}
                        </SectionCard>
                    </div>

                    {/* Farming News */}
                    {/* Farming News */}
                    <SectionCard className={`farming-news ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-lg text-green-500">{translations[language].farmingNews}</h3>
                        </div>

                        {/* Constrained Height Container */}
                        <div className="relative h-48 rounded-xl overflow-hidden">
                            {farmingNews && !Array.isArray(farmingNews) ? (
                                <a href={farmingNews.url} target="_blank" rel="noreferrer" className="group block h-full w-full relative">
                                    <div className="absolute inset-0 bg-gray-200">
                                        <img
                                            src={farmingNews.thumbnail}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-in-out"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                                        {/* Play Button */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 z-20">
                                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 shadow-lg group-hover:scale-110 transition">
                                                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                            </div>
                                        </div>

                                        {/* Content Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                                            <span className="inline-block px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-sm mb-1.5 opacity-90">Featured</span>
                                            <h4 className="font-bold text-sm md:text-base text-white leading-tight line-clamp-2 mb-1 drop-shadow-md">
                                                {farmingNews.title}
                                            </h4>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-300/90">
                                                <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg> YouTube</span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-400">
                                    <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mb-2"></div>
                                    <p className="text-xs font-medium">Loading...</p>
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    {/* Orders Graph */}
                    {/* Orders Graph (Enhanced) */}
                    <SectionCard className={`orders-graph relative overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                        {/* Decorative background blob */}
                        <div className={`absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                                    <span className={darkMode ? "text-gray-100" : "text-gray-800"}>Revenue Analytics</span>
                                </h3>
                                <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    Overview of your earnings ({graphFilter})
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`px-4 py-2 rounded-xl flex flex-col items-end ${darkMode ? "bg-gray-700/50" : "bg-green-50"}`}>
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-green-600/70"}`}>Total</span>
                                    <span className={`font-bold font-mono text-base ${darkMode ? "text-green-400" : "text-green-700"}`}>
                                        ₹{chartData.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}
                                    </span>
                                </div>
                                <select
                                    value={graphFilter}
                                    onChange={(e) => setGraphFilter(e.target.value)}
                                    className={`text-xs px-3 py-2 rounded-xl border outline-none cursor-pointer transition-colors ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"}`}
                                >
                                    <option value="Today">Today</option>
                                    <option value="Last 6 Months">Last 6 Months</option>
                                    <option value="This Year">This Year</option>
                                </select>
                            </div>
                        </div>

                        <div className="h-72 w-full p-2">
                            <Bar
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            mode: 'index',
                                            intersect: false,
                                            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                                            titleColor: darkMode ? '#f3f4f6' : '#111827',
                                            bodyColor: darkMode ? '#d1d5db' : '#4b5563',
                                            borderColor: darkMode ? '#374151' : '#e5e7eb',
                                            borderWidth: 1,
                                            padding: 12,
                                            titleFont: { size: 13, weight: 'bold' },
                                            bodyFont: { size: 12 },
                                            displayColors: false,
                                            callbacks: {
                                                label: function (context) {
                                                    let label = context.dataset.label || '';
                                                    if (label) {
                                                        label += ': ';
                                                    }
                                                    if (context.parsed.y !== null) {
                                                        label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
                                                    }
                                                    return label;
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                color: darkMode ? '#9ca3af' : '#6b7280',
                                                font: { size: 10, family: "sans-serif" },
                                                callback: function (value) {
                                                    if (value >= 1000) return '₹' + value / 1000 + 'k';
                                                    return '₹' + value;
                                                }
                                            },
                                            grid: {
                                                color: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                                borderDash: [5, 5]
                                            },
                                            border: { display: false }
                                        },
                                        x: {
                                            ticks: {
                                                color: darkMode ? '#9ca3af' : '#6b7280',
                                                font: { size: 11, family: "sans-serif" }
                                            },
                                            grid: { display: false },
                                            border: { display: false }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </SectionCard>
                </div>

                {/* Right Column: Actions & Product Management */}
                {/* Right Column: Actions & Product Management */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Add Product Button */}
                    <div className="space-y-3">
                        <Link to="/addproducts" className="block">
                            <button className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5 transition flex items-center justify-center gap-2 add-product">
                                <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                {translations[language].addProduct}
                            </button>
                        </Link>
                    </div>

                    {/* Products List */}
                    <SectionCard className={`your-products flex flex-col h-[550px] ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-green-500">{translations[language].yourProducts}</h3>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold">{products.length} Items</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                            {products.length > 0 ? (
                                products.map(p => (
                                    <div key={p.id} className={`p-3 rounded-xl flex items-center gap-3 transition-colors ${darkMode ? "bg-gray-700/40 hover:bg-gray-700/60" : "bg-gray-50 hover:bg-gray-100"}`}>
                                        <img src={p.image} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-200" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{p.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                                <span className="font-semibold">₹{p.price}</span>
                                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                                <span>{p.stock} kg</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedProduct(p); setModals(m => ({ ...m, withdraw: true })); }}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                            title="Withdraw Product"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    </div>
                                    <p className="text-sm font-medium">No products listed</p>
                                    <p className="text-xs mt-1 opacity-70">Start selling by adding your first product.</p>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>
            </div>
            {/* Guide & Modals */}
            <AnimatePresence>
                {/* Guide Overlay */}
                {showGuide && (
                    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
                        {/* Dimmed Background */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-all duration-500"
                        />

                        {/* Target Highlight Effect (Scanner + Ring) */}
                        {(() => {
                            const target = document.querySelector(guideSteps[guideStep]?.target);
                            if (!target) return null;
                            const rect = target.getBoundingClientRect();

                            // Adjust for scroll to ensure it stays fixed relative to viewport
                            return (
                                <>
                                    {/* Glowing Border Ring */}
                                    <motion.div
                                        layoutId="guide-highlight"
                                        className="absolute border-2 border-green-500 rounded-xl shadow-[0_0_50px_rgba(34,197,94,0.6)] z-[65] pointer-events-none"
                                        style={{
                                            top: rect.top - 5,
                                            left: rect.left - 5,
                                            width: rect.width + 10,
                                            height: rect.height + 10,
                                        }}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        {/* Scanner Line Animation */}
                                        <motion.div
                                            className="w-full h-[2px] bg-green-400 opacity-80 shadow-[0_0_10px_rgba(34,197,94,1)]"
                                            initial={{ top: 0 }}
                                            animate={{ top: "100%" }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            style={{ position: 'absolute', left: 0 }}
                                        />
                                        <div className="absolute inset-0 bg-green-500/10 rounded-xl" />
                                    </motion.div>
                                </>
                            );
                        })()}

                        {/* Guide Tooltip Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={guideStep}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`pointer-events-auto absolute p-6 rounded-2xl shadow-2xl w-[360px] z-[70] flex flex-col gap-4 border-2 ${darkMode ? "bg-gray-900 border-green-500/50 text-white" : "bg-white border-green-500 text-gray-800"}`}
                            style={{
                                // Smart positioning relative to target
                                ...(() => {
                                    const target = document.querySelector(guideSteps[guideStep]?.target);
                                    if (target) {
                                        const rect = target.getBoundingClientRect();
                                        const viewportHeight = window.innerHeight;
                                        const viewportWidth = window.innerWidth;
                                        const cardWidth = 360; // Must match w-[360px]
                                        const cardHeight = 250; // Approx height
                                        const gap = 20;

                                        let top, left;

                                        // Horizontal Positioning (Clamped)
                                        // 1. Center align ideally
                                        let idealLeft = rect.left + rect.width / 2 - cardWidth / 2;
                                        // 2. Clamp within viewport [gap, viewport - width - gap]
                                        left = Math.max(gap, Math.min(idealLeft, viewportWidth - cardWidth - gap));

                                        // Vertical Positioning
                                        // Preference: Bottom -> Top -> Center
                                        if (rect.bottom + cardHeight + gap < viewportHeight) {
                                            top = rect.bottom + gap;
                                        } else if (rect.top - cardHeight - gap > 0) {
                                            top = rect.top - cardHeight - gap;
                                        } else {
                                            top = viewportHeight / 2 - cardHeight / 2;
                                        }

                                        return { top, left };
                                    }
                                    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
                                })()
                            }}
                        >
                            <div className="flex items-start gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg transform rotate-12">
                                        <span className="text-white font-bold text-lg">{guideStep + 1}</span>
                                    </div>
                                    <div className="absolute -inset-1 bg-green-500/30 rounded-full blur-md animate-pulse"></div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl mb-2 bg-gradient-to-r from-green-500 to-emerald-700 bg-clip-text text-transparent">
                                        {translations[language][guideSteps[guideStep]?.id] ? translations[language][guideSteps[guideStep].id] : "Feature Usage"}
                                    </h4>
                                    <p className={`text-sm leading-relaxed font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                        {translations[language][guideSteps[guideStep]?.textKey] || translations['en-IN'][guideSteps[guideStep]?.textKey]}
                                    </p>
                                </div>
                            </div>

                            {/* Divider with fancy gradient */}
                            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-1"></div>

                            {/* Controls */}
                            <div className="flex justify-between items-center pt-2">
                                <button
                                    onClick={() => { setShowGuide(false); setGuideStep(0); }}
                                    className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 uppercase tracking-wider px-2 hover:underline transition-all"
                                >
                                    End Tour
                                </button>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setGuideStep(p => Math.max(0, p - 1))}
                                        className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${guideStep === 0 ? "opacity-30 cursor-not-allowed" : ""}`}
                                        disabled={guideStep === 0}
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    </button>

                                    <button
                                        onClick={() => setGuideStep(p => p < guideSteps.length - 1 ? p + 1 : (setShowGuide(false), 0))}
                                        className="relative group px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 active:scale-95 transition-all overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        <span className="relative z-10 flex items-center gap-2">
                                            {guideStep === guideSteps.length - 1 ? translations[language].finish : translations[language].next}
                                            {guideStep !== guideSteps.length - 1 && (
                                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* New to Dashboard Prompt */}
                {!showGuide && showGuidePrompt && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`fixed bottom-6 right-6 p-5 rounded-2xl shadow-2xl border z-40 max-w-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-blue-100"}`}>
                        <div className="flex gap-3 items-start">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold mb-1">{translations[language].newToDashboard}</p>
                                <p className="text-xs text-gray-500 mb-3">Take a quick tour to learn the features.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => { setShowGuide(true); setShowGuidePrompt(false); }} className="px-4 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold shadow-green-500/30 shadow-lg hover:bg-green-600 transition">{translations[language].yes}</button>
                                    <button onClick={() => setShowGuidePrompt(false)} className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs transition">{translations[language].no}</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Modals */}
                {Object.entries(modals).map(([key, isOpen]) => isOpen && (
                    <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
                            <h3 className="text-xl font-bold mb-4 capitalize">{key === 'withdraw' ? translations[language].withdrawProduct : translations[language][key === 'message' ? 'newMessage' : 'feedback']}</h3>

                            {key === 'withdraw' ? (
                                <>
                                    <p className="mb-6 opacity-80">Are you sure you want to withdraw <b>{selectedProduct?.name}</b>?</p>
                                    <div className="flex gap-3 justify-end">
                                        <button onClick={() => setModals(m => ({ ...m, [key]: false }))} className="px-4 py-2 rounded-lg text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">Cancel</button>
                                        <button onClick={handleWithdraw} className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transition">Yes, Withdraw</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <textarea
                                        rows={4}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 ring-blue-500 outline-none transition"
                                        placeholder={translations[language][`${key}Placeholder`]}
                                    />
                                    <div className="flex gap-3 justify-end mt-4">
                                        <button onClick={() => setModals(m => ({ ...m, [key]: false }))} className="px-4 py-2 rounded-lg text-sm bg-gray-200 dark:bg-gray-700 transition">Cancel</button>
                                        <button onClick={() => { alert(`${key} sent!`); setModals(m => ({ ...m, [key]: false })); }} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition">Send</button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Profile Edit Modal */}
            <AnimatePresence>
                {showProfileModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`w-full max-w-lg p-6 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Edit Profile</h3>
                                <button onClick={() => setShowProfileModal(false)} className="text-gray-500 hover:text-gray-700"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Full Name</label>
                                    <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className={`w-full p-3 rounded-xl outline-none border transition-colors ${darkMode ? "bg-gray-700/50 border-gray-600 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"}`} placeholder="Your Name" />
                                </div>
                                <div>
                                    <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Phone Number</label>
                                    <input type="text" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className={`w-full p-3 rounded-xl outline-none border transition-colors ${darkMode ? "bg-gray-700/50 border-gray-600 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"}`} placeholder="+91 9876543210" />
                                </div>
                                <div>
                                    <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Address</label>
                                    <textarea rows={2} value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} className={`w-full p-3 rounded-xl outline-none border transition-colors ${darkMode ? "bg-gray-700/50 border-gray-600 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"}`} placeholder="Your Farm Address" />
                                </div>
                                <div>
                                    <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Bio / Description</label>
                                    <textarea rows={3} value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} className={`w-full p-3 rounded-xl outline-none border transition-colors ${darkMode ? "bg-gray-700/50 border-gray-600 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"}`} placeholder="Tell us about your farm..." />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowProfileModal(false)} className={`flex-1 py-3 rounded-xl font-medium transition-colors ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Cancel</button>
                                <button onClick={handleProfileUpdate} className="flex-1 py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">Save Profile</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment Methods Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`w-full max-w-2xl p-0 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                            {/* Header */}
                            <div className={`p-6 border-b flex justify-between items-center ${darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50"}`}>
                                <div>
                                    <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Payment Settings</h3>
                                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Manage how you receive payments</p>
                                </div>
                                <button onClick={() => setShowPaymentModal(false)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"><svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>

                            {/* Tabs */}
                            <div className={`flex border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                                <button onClick={() => setPaymentTab("upi")} className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${paymentTab === "upi" ? "border-blue-500 text-blue-500" : "border-transparent text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"}`}>UPI QR Code</button>
                                <button onClick={() => setPaymentTab("bank")} className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${paymentTab === "bank" ? "border-blue-500 text-blue-500" : "border-transparent text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"}`}>Net Banking Details</button>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 overflow-y-auto max-h-[60vh]">
                                {paymentTab === "upi" ? (
                                    <div className="flex flex-col items-center text-center space-y-6">
                                        <div className={`w-64 h-64 rounded-xl border-2 border-dashed flex items-center justify-center relative overflow-hidden group ${darkMode ? "border-gray-600 bg-gray-700/30" : "border-gray-300 bg-gray-50"}`}>
                                            {paymentMethods.upiQr ? (
                                                <img src={paymentMethods.upiQr} alt="UPI QR" className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="text-gray-400">
                                                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                                                    <p className="text-sm">Upload QR Code</p>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleQrUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <p className="text-white font-medium text-sm">Click to Change</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Upload your UPI QR Code image</p>
                                            <p className="text-xs text-gray-500 mt-1">This will be shown to customers during payment.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Account Holder Name</label>
                                                <input type="text" value={paymentMethods.bankDetails.accountName} onChange={e => setPaymentMethods({ ...paymentMethods, bankDetails: { ...paymentMethods.bankDetails, accountName: e.target.value } })} className={`w-full p-3 rounded-xl outline-none border transition-colors ${darkMode ? "bg-gray-700/50 border-gray-600 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"}`} placeholder="e.g. Rithik Kannaa" />
                                            </div>
                                            <div>
                                                <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Bank Name</label>
                                                <input type="text" value={paymentMethods.bankDetails.bankName} onChange={e => setPaymentMethods({ ...paymentMethods, bankDetails: { ...paymentMethods.bankDetails, bankName: e.target.value } })} className={`w-full p-3 rounded-xl outline-none border transition-colors ${darkMode ? "bg-gray-700/50 border-gray-600 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"}`} placeholder="e.g. HDFC Bank" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Account Number</label>
                                            <input type="text" value={paymentMethods.bankDetails.accountNumber} onChange={e => setPaymentMethods({ ...paymentMethods, bankDetails: { ...paymentMethods.bankDetails, accountNumber: e.target.value } })} className={`w-full p-3 rounded-xl outline-none border transition-colors ${darkMode ? "bg-gray-700/50 border-gray-600 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"}`} placeholder="XXXXXXXXXXXX" />
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>IFSC Code</label>
                                            <input type="text" value={paymentMethods.bankDetails.ifsc} onChange={e => setPaymentMethods({ ...paymentMethods, bankDetails: { ...paymentMethods.bankDetails, ifsc: e.target.value } })} className={`w-full p-3 rounded-xl outline-none border transition-colors ${darkMode ? "bg-gray-700/50 border-gray-600 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"}`} placeholder="HDFC0001234" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className={`p-6 border-t flex justify-end gap-3 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                                <button onClick={() => setShowPaymentModal(false)} className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}>Cancel</button>
                                <button onClick={handlePaymentSave} className="px-6 py-2.5 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all">Save Changes</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Order Management Full-Screen View */}
            <AnimatePresence>
                {showOrderManagement && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 z-[60] flex flex-col ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
                    >
                        {/* Professional Header */}
                        <div className={`px-6 md:px-12 py-5 border-b flex flex-col md:flex-row justify-between items-center gap-4 ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowOrderManagement(false)}
                                    className={`p-2.5 rounded-xl transition-all ${darkMode ? "hover:bg-gray-800 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                </button>
                                <div>
                                    <h2 className={`text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-1`}>Order Management</h2>
                                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Track and manage all your orders</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center">
                                {/* Search/Filter Controls */}
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                    {['All', 'Pending', 'Dispatched', 'Cancelled'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setOrderFilter(status)}
                                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${orderFilter === status
                                                ? (darkMode ? "bg-gray-700 text-white shadow" : "bg-white text-gray-900 shadow")
                                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>

                                <select
                                    value={orderSort}
                                    onChange={(e) => setOrderSort(e.target.value)}
                                    className={`px-4 py-2 rounded-lg text-sm border outline-none cursor-pointer ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-gray-700"}`}
                                >
                                    <option value="Newest">Newest First</option>
                                    <option value="Oldest">Oldest First</option>
                                    <option value="High Amount">Highest Amount</option>
                                    <option value="Low Amount">Lowest Amount</option>
                                </select>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 overflow-auto p-6 md:p-12 scrollbar-none">
                            <div className={`w-full rounded-2xl shadow-sm border overflow-hidden ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}>
                                <table className="w-full text-left border-collapse">
                                    <thead className={`${darkMode ? "bg-gray-800" : "bg-gray-50/50"}`}>
                                        <tr className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            <th className="px-8 py-5">Order ID</th>
                                            <th className="px-6 py-5">Customer</th>
                                            <th className="px-6 py-5">Date</th>
                                            <th className="px-6 py-5">Total</th>
                                            <th className="px-6 py-5 text-center">Status</th>
                                            <th className="px-6 py-5 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {orders
                                            .filter(o => orderFilter === 'All' || o.status === orderFilter)
                                            .sort((a, b) => {
                                                if (orderSort === 'Newest') return new Date(b.date) - new Date(a.date);
                                                if (orderSort === 'Oldest') return new Date(a.date) - new Date(b.date);
                                                if (orderSort === 'High Amount') return b.totalAmount - a.totalAmount;
                                                return a.totalAmount - b.totalAmount;
                                            })
                                            .map((order) => (
                                                <tr key={order.id} className={`group transition-all duration-200 ${darkMode ? "hover:bg-gray-700/30" : "hover:bg-blue-50/30"}`}>
                                                    <td className="px-8 py-5 align-top">
                                                        <span className={`font-mono text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                            {order.displayId}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-5 align-top">
                                                        <div>
                                                            <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{order.customerName}</p>
                                                            <p className="text-xs opacity-50 mt-0.5">{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online"}</p>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5 align-top text-sm opacity-70">
                                                        {new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>

                                                    <td className="px-6 py-5 align-top">
                                                        <span className={`font-bold font-mono ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                                                            ₹{order.totalAmount.toLocaleString()}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-5 align-top text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold
                                                            ${order.status === "Dispatched" ? "bg-emerald-500/10 text-emerald-500" :
                                                                order.status === "Pending" ? "bg-amber-500/10 text-amber-500" :
                                                                    order.status === "Cancelled" ? "bg-red-500/10 text-red-500" :
                                                                        "bg-gray-500/10 text-gray-500"}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-5 align-top text-right">
                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${darkMode ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                                                        >
                                                            View Bill
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                                {orders.length === 0 && (
                                    <div className="p-12 text-center text-gray-500">No orders found matching your criteria.</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bill / Invoice Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedOrder(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 30, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`w-full max-w-lg p-0 rounded-2xl overflow-hidden shadow-2xl ${darkMode ? "bg-gray-900 border border-gray-700" : "bg-white"}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-dashed border-gray-700 relative bg-gradient-to-br from-indigo-600 to-violet-700">
                                <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 p-1 rounded-lg hover:bg-white/20"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Order Invoice
                                </h3>
                                <p className="text-white/80 text-sm mt-1 ml-8">Order ID: #{selectedOrder.displayId}</p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Customer Info */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Billed To</p>
                                        <p className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedOrder.customerName}</p>
                                        <p className="text-sm text-gray-400">{selectedOrder.address}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date Issued</p>
                                        <p className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                            {new Date(selectedOrder.date).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{new Date(selectedOrder.date).toLocaleTimeString()}</p>
                                        <div className="mt-3">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment Method</p>
                                            <p className={`font-medium text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                {selectedOrder.paymentMethod === "COD" ? "Cash on Delivery" : selectedOrder.paymentMethod}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Status */}
                                <div className={`p-3 rounded-lg flex justify-between items-center ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                                    <span className="text-sm font-medium text-gray-500">Status</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                        ${selectedOrder.status === "Dispatched" ? "bg-green-100 text-green-600" :
                                            selectedOrder.status === "Cancelled" ? "bg-red-100 text-red-600" :
                                                "bg-yellow-100 text-yellow-600"}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>

                                {/* Products Table */}
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Order Items</p>
                                    <div className={`border rounded-xl overflow-hidden ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                                        <table className="w-full text-sm">
                                            <thead className={`${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Item</th>
                                                    <th className="px-4 py-3 text-center font-medium text-gray-500">Qty</th>
                                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-100"}`}>
                                                {selectedOrder.products.map((p, i) => (
                                                    <tr key={i}>
                                                        <td className={`px-4 py-3 ${darkMode ? "text-gray-300" : "text-gray-800"}`}>{p.name}</td>
                                                        <td className="px-4 py-3 text-center text-gray-500">x{p.quantity}</td>
                                                        <td className={`px-4 py-3 text-right font-mono ${darkMode ? "text-gray-300" : "text-gray-800"}`}>₹{p.totalPrice || (p.price * p.quantity)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className={`px-4 py-3 flex justify-between items-center border-t ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                                            <span className="font-bold text-base">Grand Total</span>
                                            <span className="font-bold text-xl text-emerald-500">₹{selectedOrder.totalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-4 border-t flex justify-center ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                    Print Invoice
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default function DashboardWithErrorBoundary() {
    return (
        <ErrorBoundary>
            <Dashboard />
        </ErrorBoundary>
    );
}
