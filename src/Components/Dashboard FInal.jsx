import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase.js";
import { getDatabase, ref, onValue, remove } from "firebase/database";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Define translations object (unchanged)
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
    guideConfirmed: "View your confirmed orders here.",
    guideCancelled: "See canceled orders in this section.",
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
};

// Updated audio files with your 6 files
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

// Updated guide steps with your specified order and audio mapping
const getGuideSteps = (language) => {
  return [
    { id: "orders", target: ".confirmed", textKey: "guideConfirmed" },
    { id: "orders", target: ".dispatched", textKey: "guideDispatched" },
    { id: "orders", target: ".cancelled", textKey: "guideCancelled" },
    { id: "earnings", target: ".total-earnings", textKey: "guideTotalEarnings" },
    { id: "earnings", target: ".current-orders", textKey: "guideCurrentOrders" },
    { id: "earnings", target: ".previous-orders", textKey: "guidePreviousOrders" },
    { id: "recommendations", target: ".view-market-trends", textKey: "guideSellSurplus" },
    { id: "recommendations", target: ".crop-recommendation", textKey: "guideCropRecommendation" },
    { id: "farmingNews", target: ".farming-news", textKey: "guideFarmingNews" },
    { id: "graph", target: ".orders-graph", textKey: "guideOrdersGraph" },
    { id: "weather", target: ".weather", textKey: "guideWeather" },
    { id: "newMessage", target: ".new-message", textKey: "guideNewMessage" },
    { id: "feedback", target: ".feedback", textKey: "guideFeedback" },
    { id: "products", target: ".add-product", textKey: "guideAddProduct" },
    { id: "products", target: ".your-products", textKey: "guideYourProducts" },
  ];
};

// Crop recommendations array (unchanged)
const cropRecommendations = [
  { name: "Onions", image: "https://images.unsplash.com/photo-1618512496248-a07fe4613e8e?q=80&w=1000&auto=format&fit=crop" },
  { name: "Tomatoes", image: "https://images.unsplash.com/photo-1599819810277-2320b4e1e3ed?q=80&w=1000&auto=format&fit=crop" },
  { name: "Potatoes", image: "https://images.unsplash.com/photo-1518977829002-6a9d13e7a1e5?q=80&w=1000&auto=format&fit=crop" },
  { name: "Wheat", image: "https://images.unsplash.com/photo-1600005994501-2f3e2b67a60f?q=80&w=1000&auto=format&fit=crop" },
  { name: "Rice", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop" },
];

// Predefined farming news videos for fallback (unchanged)
const fallbackFarmingNews = [
  {
    id: "1",
    title: "Innovative Farming Techniques 2025",
    thumbnail: "https://via.placeholder.com/150?text=Video1",
    url: "https://www.youtube.com/watch?v=example1",
  },
  {
    id: "2",
    title: "Sustainable Agriculture Trends",
    thumbnail: "https://via.placeholder.com/150?text=Video2",
    url: "https://www.youtube.com/watch?v=example2",
  },
  {
    id: "3",
    title: "Modern Irrigation Systems",
    thumbnail: "https://via.placeholder.com/150?text=Video3",
    url: "https://www.youtube.com/watch?v=example3",
  },
];

// Error Boundary Component (unchanged)
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center text-red-600">
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message || "Unknown error"}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [farmerName, setFarmerName] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [profilePic, setProfilePic] = useState("https://via.placeholder.com/150");
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const [earnings, setEarnings] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [farmingNews, setFarmingNews] = useState(null);
  const [marketTrends, setMarketTrends] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(null);
  const [recommendedCrop, setRecommendedCrop] = useState(null);
  const audioRef = useRef(null);

  const navigate = useNavigate();
  const db = getDatabase();
  const guideSteps = getGuideSteps(language);

  useEffect(() => {
    const randomCrop = cropRecommendations[Math.floor(Math.random() * cropRecommendations.length)];
    setRecommendedCrop(randomCrop);
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
      setFarmerId(user.uid);

      const userRef = ref(db, `users/${user.uid}`);
      onValue(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setFarmerName(userData.name || user.displayName || "Farmer");
            setProfilePic(userData.photoURL || user.photoURL || "https://via.placeholder.com/150");
          } else {
            setFarmerName(user.displayName || "Farmer");
            setProfilePic(user.photoURL || "https://via.placeholder.com/150");
          }
        },
        (err) => {
          console.error("User fetch error:", err);
          setError("Failed to fetch user data.");
        }
      );

      const farmerProductRef = ref(db, `products/farmer_${user.uid}`);
      onValue(
        farmerProductRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const productsData = snapshot.val();
            const farmerProducts = Object.entries(productsData).map(([id, product]) => ({
              id,
              name: product.name || "Unknown Product",
              price: product.price || 0,
              stock: product.quantity || product.stock || 0,
              image: product.image || "https://via.placeholder.com/150",
            }));
            setProducts(farmerProducts);
          } else {
            setProducts([]);
          }
          setLoading(false);
        },
        (err) => {
          console.error("Products fetch error:", err);
          setError("Failed to fetch products.");
          setLoading(false);
        }
      );

      const ordersRef = ref(db, "orders");
      onValue(
        ordersRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const ordersData = snapshot.val();
            const farmerOrders = Object.entries(ordersData)
              .filter(([_, order]) => {
                return order.products && Array.isArray(order.products) && order.products.some((p) => p.farmerId === `farmer_${user.uid}`);
              })
              .map(([id, order]) => {
                const farmerProducts = order.products.filter((p) => p.farmerId === `farmer_${user.uid}`);
                const farmerTotal = farmerProducts.reduce((sum, p) => sum + (parseFloat(p.totalPrice) || 0), 0);
                const status = order.status === "Confirmed" ? "Dispatched" : order.status || "Unknown";
                return {
                  id: order.orderId || id,
                  status: status,
                  totalAmount: farmerTotal,
                  date: order.orderDateTime || order.date || new Date().toISOString(),
                  products: farmerProducts,
                  customerName: order.customerName || "Unknown Customer",
                };
              });

            setOrders(farmerOrders);
            const totalEarnings = farmerOrders
              .filter((order) => order.status === "Dispatched")
              .reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
            setEarnings(totalEarnings);
          } else {
            setOrders([]);
            setEarnings(0);
          }
        },
        (err) => {
          console.error("Orders fetch error:", err);
          setError("Failed to fetch orders.");
          setOrders([]);
          setEarnings(0);
        }
      );

      const fetchWeather = async (lat, lon) => {
        const apiKey = "ccd8b058961d7fefa87f1c29421d8bdf";
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data.cod === 200) {
            setWeather({
              main: { temp: data.main.temp, humidity: data.main.humidity },
              weather: [{ description: data.weather[0].description }],
              name: data.name,
              country: data.sys.country,
            });
          } else {
            throw new Error(data.message || "Failed to fetch weather data");
          }
        } catch (err) {
          console.error("Weather fetch error:", err);
          setWeather({
            main: { temp: 34.81, humidity: 24 },
            weather: [{ description: "broken clouds" }],
            name: "Sulur",
            country: "IN",
          });
        }
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
          (err) => {
            console.error("Geolocation error:", err);
            setWeather({
              main: { temp: 34.81, humidity: 24 },
              weather: [{ description: "broken clouds" }],
              name: "Sulur",
              country: "IN",
            });
          }
        );
      } else {
        setWeather({
          main: { temp: 34.81, humidity: 24 },
          weather: [{ description: "broken clouds" }],
          name: "Sulur",
          country: "IN",
        });
      }

      const fetchFarmingNews = async () => {
        const apiKey = "AIzaSyDZ5Pzwp89A-AOr9KSVKWfuRSQazB_4lIk";
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=farming+technology+news&type=video&maxResults=5&key=${apiKey}`;
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.items.length);
            const item = data.items[randomIndex];
            setFarmingNews({
              id: item.id.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails.medium.url,
              url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            });
          } else {
            const randomFallback = fallbackFarmingNews[Math.floor(Math.random() * fallbackFarmingNews.length)];
            setFarmingNews(randomFallback);
          }
        } catch (err) {
          console.error("YouTube fetch error:", err.message);
          const randomFallback = fallbackFarmingNews[Math.floor(Math.random() * fallbackFarmingNews.length)];
          setFarmingNews(randomFallback);
        }
      };

      fetchFarmingNews();
      const interval = setInterval(fetchFarmingNews, 300000);

      const fetchMarketTrends = async () => {
        try {
          const response = await fetch("https://api.agromonitoring.com/agro/1.0/market/prices?appid=YOUR_AGRO_API_KEY");
          const data = await response.json();
          if (data && data.length > 0) {
            setMarketTrends(data.slice(0, 5));
          } else {
            throw new Error("No market trends data available");
          }
        } catch (err) {
          console.error("Market trends fetch error:", err);
          setMarketTrends([
            { id: 1, crop: "Wheat", price: 300, description: "High demand this season" },
            { id: 2, crop: "Rice", price: 250, description: "Stable prices" },
            { id: 3, crop: "Corn", price: 200, description: "Rising demand" },
            { id: 4, crop: "Tomato", price: 150, description: "Seasonal surplus" },
            { id: 5, crop: "Potato", price: 180, description: "Moderate demand" },
          ]);
        }
      };

      fetchMarketTrends();

      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    });
  }, [navigate, db]);

  const ordersByMonth = orders.reduce((acc, order) => {
    if (order.status === "Dispatched" && order.date) {
      const date = new Date(order.date);
      if (!isNaN(date.getTime())) {
        const month = date.toLocaleString("default", { month: "short", year: "numeric" });
        acc[month] = (acc[month] || 0) + (parseFloat(order.totalAmount) || 0);
      }
    }
    return acc;
  }, {});

  const ordersData = {
    labels: Object.keys(ordersByMonth).length ? Object.keys(ordersByMonth) : ["No Data"],
    datasets: [
      {
        label: translations[language]?.ordersGraph || "Orders Graph",
        data: Object.keys(ordersByMonth).length ? Object.values(ordersByMonth) : [0],
        backgroundColor: "rgba(34, 197, 94, 0.6)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: darkMode ? "#e5e7eb" : "#000000", font: { size: 10 } } },
      title: {
        display: true,
        text: translations[language]?.ordersGraph || "Orders Graph",
        color: darkMode ? "#e5e7eb" : "#000000",
        font: { size: 14 },
      },
    },
    scales: {
      x: { ticks: { color: darkMode ? "#e5e7eb" : "#000000", font: { size: 8 } } },
      y: {
        ticks: {
          color: darkMode ? "#e5e7eb" : "#000000",
          font: { size: 8 },
          callback: (value) => `₹${value}`,
        },
        beginAtZero: true,
      },
    },
  };

  useEffect(() => {
    if (showGuide && audioRef.current) {
      const currentStep = guideSteps[guideStep];
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      const audioPath = audioFiles[language][currentStep.id];
      if (audioPath) {
        const audio = new Audio(audioPath);
        audioRef.current = audio;

        audio.play().catch((error) => console.error("Audio playback failed:", error));

        audio.onended = () => {
          if (guideStep < guideSteps.length - 1) {
            setGuideStep((prev) => prev + 1);
          } else {
            setShowGuide(false);
            setGuideStep(0);
          }
        };

        return () => {
          audio.pause();
          audio.onended = null;
        };
      } else {
        console.warn(`No audio file for ${currentStep.id} in language ${language}`);
        const timeout = setTimeout(() => {
          if (guideStep < guideSteps.length - 1) {
            setGuideStep((prev) => prev + 1);
          } else {
            setShowGuide(false);
            setGuideStep(0);
          }
        }, 2000);

        return () => clearTimeout(timeout);
      }
    }
  }, [showGuide, guideStep, language, guideSteps]);

  useEffect(() => {
    if (showGuide) {
      const targetElement = document.querySelector(guideSteps[guideStep].target);
      if (targetElement) targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [guideStep, showGuide]);

  const getWeatherEmoji = (description) => {
    const weatherMap = {
      "clear sky": "☀️",
      "few clouds": "⛅",
      "scattered clouds": "🌥️",
      "broken clouds": "🌦️",
      "shower rain": "🌧️",
      "rain": "🌧️",
      "thunderstorm": "⛈️",
      "snow": "❄️",
      "mist": "🌫️",
    };
    return weatherMap[description?.toLowerCase()] || "🌤️";
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err.message);
      setError("Failed to log out.");
    }
  };

  const handleWithdrawClick = (product) => {
    setSelectedProduct(product);
    setShowWithdrawModal(true);
  };

  const withdrawProduct = async (productId) => {
    try {
      const productRef = ref(db, `products/farmer_${farmerId}/${productId}`);
      await remove(productRef);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setShowWithdrawModal(false);
      setSelectedProduct(null);
      alert("Product withdrawn successfully!");
    } catch (err) {
      console.error("Error withdrawing product:", err);
      setError("Failed to withdraw product.");
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      alert(`Message sent: ${message}`);
      setMessage("");
      setShowMessageModal(false);
    }
  };

  const handleSubmitFeedback = () => {
    if (feedback.trim()) {
      alert(`Feedback submitted: ${feedback}`);
      setFeedback("");
      setShowFeedbackModal(false);
    }
  };

  const handleViewMarketTrends = () => {
    fetchMarketTrends();
  };

  const toggleOrderDetails = (orderId) => {
    setDetailsOpen(detailsOpen === orderId ? null : orderId);
  };

  const pageVariants = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <motion.div
      className={`min-h-screen p-8 font-sans ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-800"} ${showGuide ? "backdrop-blur-sm" : ""}`}
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start mb-12 space-y-8 lg:space-y-0 lg:space-x-12">
        <motion.div className="flex items-center space-x-6 w-full lg:w-auto">
          <div className="relative">
            <img
              src={profilePic}
              alt="Farmer Profile"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-green-100 dark:ring-gray-700"
              onError={(e) => (e.target.src = "https://via.placeholder.com/150")}
            />
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          </div>
          <div className="relative">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              {translations[language].helloFarmer.replace("Farmer", farmerName)}
            </h2>
            <motion.button
              className="mt-4 px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg"
              onClick={() => setShowSettings(!showSettings)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {translations[language].settings}
            </motion.button>
            {showSettings && (
              <motion.div
                className={`absolute left-0 mt-2 w-64 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-xl border p-4 z-20`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </button>
                <select
                  className="w-full px-4 py-2 text-sm bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mt-1"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en-IN">🇮🇳 English (India)</option>
                  <option value="ta-IN">🇮🇳 தமிழ் (Tamil)</option>
                  <option value="hi-IN">🇮🇳 हिन्दी (Hindi)</option>
                  <option value="en-US">🇺🇸 English (US)</option>
                </select>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mt-1 flex items-center gap-2">
                  ℹ️ {translations[language].help}
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mt-1 flex items-center gap-2"
                  onClick={handleLogout}
                >
                  🚪 {translations[language].logout}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full lg:w-2/3">
          {["confirmed", "dispatched", "cancelled"].map((status) => (
            <motion.div
              key={status}
              className={`p-6 rounded-2xl shadow-md border ${status} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} transform transition-all duration-300`}
              whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
            >
              <h3 className={`font-semibold text-xl mb-4 ${status === "confirmed" ? "text-green-500" : status === "dispatched" ? "text-yellow-500" : "text-red-500"}`}>
                {translations[language][status]}
              </h3>
              {orders
                .filter((o) => o.status.toLowerCase() === status.toLowerCase())
                .slice(0, 2)
                .map((order, idx) => (
                  <p key={idx} className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} mb-2`}>
                    <span className="font-medium">#{order.id.split("_")[1] || order.id}</span> - ₹{order.totalAmount.toFixed(2)}
                    <span className="text-xs"> (To: {order.customerName})</span>
                  </p>
                ))}
              {orders.filter((o) => o.status.toLowerCase() === status.toLowerCase()).length === 0 && (
                <p className={`text-sm italic ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No {status} orders</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Weather Card */}
        <motion.div
          className={`p-6 rounded-2xl shadow-md border weather ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} w-full lg:w-80`}
          whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
        >
          <h3 className="font-semibold text-xl text-blue-500 mb-4">{translations[language].weather}</h3>
          {weather ? (
            <div className="text-center">
              <span className="text-5xl block mb-2">{getWeatherEmoji(weather.weather[0].description)}</span>
              <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"} capitalize`}>{weather.weather[0].description}</p>
              <p className="text-3xl font-bold text-blue-500 my-2">{weather.main.temp}°C</p>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{weather.name}, {weather.country}</p>
            </div>
          ) : (
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} flex items-center justify-center gap-2`}>
              <span className="animate-spin">⏳</span> Fetching weather...
            </p>
          )}
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-8">
          <motion.div
            className={`p-6 rounded-2xl shadow-md border total-earnings ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
            whileHover={{ scale: 1.03 }}
          >
            <h3 className="font-semibold text-xl text-green-500 mb-4">{translations[language].totalEarnings}</h3>
            <p className={`text-4xl font-bold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>₹{earnings.toFixed(2)}</p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mt-2`}>All-time earnings</p>
          </motion.div>

          <motion.div
            className={`p-6 rounded-2xl shadow-md border current-orders ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
            whileHover={{ scale: 1.03 }}
          >
            <h3 className="font-semibold text-xl text-green-500 mb-4">{translations[language].currentOrders}</h3>
            {orders
              .filter((o) => ["Pending", "Confirmed", "Processing", "Dispatched"].includes(o.status))
              .slice(0, 2)
              .map((order, idx) => (
                <p key={idx} className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} mb-2`}>
                  <span className="font-medium">#{order.id.split("_")[1] || order.id}</span> - ₹{order.totalAmount.toFixed(2)} ({order.status})
                </p>
              ))}
            {orders.filter((o) => ["Pending", "Confirmed", "Processing", "Dispatched"].includes(o.status)).length === 0 && (
              <p className={`text-sm italic ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No current orders</p>
            )}
          </motion.div>

          <motion.div
            className={`p-6 rounded-2xl shadow-md border previous-orders ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
            whileHover={{ scale: 1.03 }}
          >
            <h3 className="font-semibold text-xl text-yellow-500 mb-4">{translations[language].previousOrders}</h3>
            {orders.filter((o) => ["Completed", "Cancelled"].includes(o.status)).length === 0 ? (
              <p className={`text-sm italic ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No previous orders</p>
            ) : (
              <div className="mt-4 space-y-3">
                {orders
                  .filter((o) => ["Completed", "Cancelled"].includes(o.status))
                  .map((order) => (
                    <motion.div
                      key={order.id}
                      className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} cursor-pointer hover:bg-gray-600 dark:hover:bg-gray-600 transition-colors`}
                      onClick={() => toggleOrderDetails(order.id)}
                      initial={{ height: "auto" }}
                      animate={{ height: detailsOpen === order.id ? "auto" : "auto" }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-center">
                        <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                          Order #{order.id.split("_")[1] || order.id} - ₹{order.totalAmount.toFixed(2)} ({order.status})
                        </p>
                        <span className={`text-gray-400`}>{detailsOpen === order.id ? "▲" : "▼"}</span>
                      </div>
                      {detailsOpen === order.id && (
                        <motion.div
                          className={`mt-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p>Customer: {order.customerName}</p>
                          <p>Date: {new Date(order.date).toLocaleDateString()}</p>
                          <p className="mt-2 font-semibold">Products:</p>
                          {order.products.map((product, idx) => (
                            <div key={idx} className="ml-2">
                              <p>- {product.productName || product.name}</p>
                              <p className="ml-4">Price: ₹{product.price || "N/A"}/kg</p>
                              <p className="ml-4">Quantity: {product.quantity || "N/A"} kg</p>
                              <p className="ml-4">Total: ₹{product.totalPrice || "N/A"}</p>
                            </div>
                          ))}
                          <p className="mt-2 font-semibold">Total Amount: ₹{order.totalAmount.toFixed(2)}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Middle Columns */}
        <div className="lg:col-span-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              className={`p-6 rounded-2xl shadow-md border view-market-trends ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
              whileHover={{ scale: 1.03 }}
            >
              <h3 className="font-semibold text-xl text-blue-500 mb-4">{translations[language].viewMarketTrends}</h3>
              <motion.button
                className="w-full px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium shadow-md"
                onClick={handleViewMarketTrends}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {translations[language].viewMarketTrends}
              </motion.button>
              {marketTrends && (
                <div className="mt-4 space-y-2">
                  {marketTrends.map((trend) => (
                    <p key={trend.id} className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {trend.crop}: ₹{trend.price}/kg - {trend.description}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              className={`p-6 rounded-2xl shadow-md border crop-recommendation ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
              whileHover={{ scale: 1.03 }}
            >
              <h3 className="font-semibold text-xl text-orange-500 mb-4">{translations[language].cropRecommendation}</h3>
              {recommendedCrop ? (
                <div className="mt-4 flex items-center space-x-4">
                  <img
                    src={recommendedCrop.image}
                    alt={recommendedCrop.name}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => (e.target.src = "https://via.placeholder.com/150")}
                  />
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Recommended Crop: {recommendedCrop.name}</p>
                </div>
              ) : (
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Loading recommendation...</p>
              )}
            </motion.div>
          </div>

          <motion.div
            className={`p-6 rounded-2xl shadow-md border farming-news ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
            whileHover={{ scale: 1.03 }}
          >
            <h3 className="font-semibold text-xl text-green-500 mb-4">{translations[language].farmingNews}</h3>
            <div className="mt-4">
              {farmingNews ? (
                <a href={farmingNews.url} target="_blank" rel="noopener noreferrer" className="block">
                  <motion.div
                    className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} hover:bg-gray-600 dark:hover:bg-gray-600 transition-colors`}
                    whileHover={{ scale: 1.02 }}
                    key={farmingNews.id}
                  >
                    <img
                      src={farmingNews.thumbnail}
                      alt={farmingNews.title}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                      onError={(e) => (e.target.src = "https://via.placeholder.com/150")}
                    />
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{farmingNews.title}</p>
                  </motion.div>
                </a>
              ) : (
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Fetching farming news...</p>
              )}
            </div>
          </motion.div>

          <motion.div
            className={`p-6 rounded-2xl shadow-md border orders-graph ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} h-96`}
            whileHover={{ scale: 1.03 }}
          >
            <h3 className="font-semibold text-xl text-red-500 mb-4">{translations[language].ordersGraph}</h3>
            <div className="h-72">
              <Bar data={ordersData} options={chartOptions} />
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 space-y-8">
          <div className="space-y-4">
            <motion.button
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg new-message"
              onClick={() => setShowMessageModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {translations[language].newMessage}
            </motion.button>

            <motion.button
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg feedback"
              onClick={() => setShowFeedbackModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {translations[language].feedback}
            </motion.button>

            <Link to="/addproducts" className="block">
              <motion.button
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg add-product"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {translations[language].addProduct}
              </motion.button>
            </Link>
          </div>

          <motion.div
            className={`p-6 rounded-2xl shadow-md border your-products ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
            whileHover={{ scale: 1.03 }}
          >
            <h3 className="font-semibold text-xl text-teal-500 mb-4">{translations[language].yourProducts}</h3>
            {products.length === 0 ? (
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No products available.{" "}
                <Link to="/addproducts" className="text-teal-500 font-medium hover:underline">
                  {translations[language].addProduct}
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    className={`p-4 rounded-lg ${darkMode ? "bg-teal-900/30" : "bg-teal-50/50"}`}
                    whileHover={{ scale: 1.03 }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg mx-auto mb-2"
                      onError={(e) => (e.target.src = "https://via.placeholder.com/150")}
                    />
                    <p className={`text-sm font-medium text-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{product.name}</p>
                    <p className={`text-xs text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>₹{product.price}/kg</p>
                    <p className={`text-xs text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{product.stock} kg</p>
                    <button
                      className="mt-2 w-full px-3 py-1 bg-orange-500 text-white rounded-md text-xs hover:bg-orange-600 withdraw-product"
                      onClick={() => handleWithdrawClick(product)}
                    >
                      {translations[language].withdrawProduct}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      {showWithdrawModal && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className={`${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"} p-8 rounded-2xl shadow-2xl w-96`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-center">{translations[language].withdrawProduct}</h3>
            <p className="mb-6 text-center">Are you sure you want to withdraw {selectedProduct?.name}?</p>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                onClick={() => withdrawProduct(selectedProduct.id)}
              >
                Yes
              </button>
              <button
                className="px-6 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600"
                onClick={() => setShowWithdrawModal(false)}
              >
                No
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showMessageModal && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className={`${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"} p-8 rounded-2xl shadow-2xl w-96`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <h3 className="text-xl font-semibold mb-4">{translations[language].newMessage}</h3>
            <textarea
              className={`w-full p-3 border rounded-lg ${darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-gray-100 text-gray-800 border-gray-300"} text-sm focus:ring-2 focus:ring-blue-500`}
              rows="4"
              placeholder={translations[language].messagePlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex space-x-4 mt-4">
              <button
                className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                onClick={handleSendMessage}
              >
                {translations[language].send}
              </button>
              <button
                className="px-6 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600"
                onClick={() => setShowMessageModal(false)}
              >
                {translations[language].cancel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showFeedbackModal && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className={`${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"} p-8 rounded-2xl shadow-2xl w-96`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <h3 className="text-xl font-semibold mb-4">{translations[language].feedback}</h3>
            <textarea
              className={`w-full p-3 border rounded-lg ${darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-gray-100 text-gray-800 border-gray-300"} text-sm focus:ring-2 focus:ring-purple-500`}
              rows="4"
              placeholder={translations[language].feedbackPlaceholder}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <div className="flex space-x-4 mt-4">
              <button
                className="px-6 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600"
                onClick={handleSubmitFeedback}
              >
                {translations[language].send}
              </button>
              <button
                className="px-6 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600"
                onClick={() => setShowFeedbackModal(false)}
              >
                {translations[language].cancel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Guide Prompt */}
      {!showGuide && (
        <motion.div
          className={`fixed bottom-6 right-6 p-4 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-800 border-gray-200"} rounded-xl shadow-xl border`}
        >
          <p className="text-base font-medium">{translations[language].newToDashboard}</p>
          <div className="flex space-x-3 mt-3">
            <button
              className="px-5 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 text-sm font-medium"
              onClick={() => {
                setShowGuide(true);
                setGuideStep(0);
              }}
            >
              {translations[language].yes}
            </button>
            <button
              className="px-5 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 text-sm font-medium"
              onClick={() => setShowGuide(false)}
            >
              {translations[language].no}
            </button>
          </div>
        </motion.div>
      )}

      {/* Guide Overlay */}
      {showGuide && (
        <motion.div className="fixed inset-0 z-20 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="relative pointer-events-auto">
            <motion.div
              className={`absolute p-4 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-800 border-gray-200"} rounded-xl shadow-xl border z-40`}
              style={{
                top: (document.querySelector(guideSteps[guideStep].target)?.getBoundingClientRect().top || 0) - 140 + window.scrollY,
                left: "50%",
                transform: "translateX(-50%)",
                width: "320px",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-base mb-3">{translations[language][guideSteps[guideStep].textKey]}</p>
              <div className="flex space-x-3">
                <button
                  className="px-5 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 text-sm font-medium"
                  onClick={() => (guideStep < guideSteps.length - 1 ? setGuideStep((prev) => prev + 1) : setShowGuide(false))}
                >
                  {guideStep < guideSteps.length - 1 ? translations[language].next : translations[language].finish}
                </button>
                {guideStep > 0 && (
                  <button
                    className="px-5 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 text-sm font-medium"
                    onClick={() => setGuideStep((prev) => prev - 1)}
                  >
                    Back
                  </button>
                )}
                <button
                  className="px-5 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 text-sm font-medium"
                  onClick={() => setShowGuide(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
            <motion.div
              className="absolute border-4 border-green-500 rounded-xl shadow-lg pointer-events-none z-20"
              style={{
                top: (document.querySelector(guideSteps[guideStep].target)?.getBoundingClientRect().top || 0) - 8 + window.scrollY,
                left: (document.querySelector(guideSteps[guideStep].target)?.getBoundingClientRect().left || 0) - 8,
                width: (document.querySelector(guideSteps[guideStep].target)?.offsetWidth || 0) + 16,
                height: (document.querySelector(guideSteps[guideStep].target)?.offsetHeight || 0) + 16,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const DashboardWithErrorBoundary = () => (
  <ErrorBoundary>
    <Dashboard />
  </ErrorBoundary>
);

export default DashboardWithErrorBoundary;