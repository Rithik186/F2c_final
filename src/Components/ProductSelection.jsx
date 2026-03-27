import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mic, Settings, LogOut, Plus, Check } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from "../firebase.js"; // Firebase Auth
import { getDatabase, ref, onValue, push, set, update } from "firebase/database"; // Firebase Realtime Database

const ProductSelection = () => {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]); // All products from Goods
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [billList, setBillList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [disputes, setDisputes] = useState([]);
  const [newDispute, setNewDispute] = useState("");
  const [language, setLanguage] = useState("English");
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [farmerInfo, setFarmerInfo] = useState({ name: "John Doe", email: "john@example.com", id: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const db = getDatabase();
  const billRef = useRef(null);

  const translations = {
    English: {
      farmersMarket: "Farmer's Market",
      searchProducts: "Search products...",
      addToBill: "Add to Bill",
      yourBill: "Your Bill",
      subtotal: "Subtotal",
      total: "Total",
      saveToProducts: "Save to Products",
      saving: "Saving...",
      disputeSection: "Dispute Section",
      replyToQuery: "Reply to query...",
      submit: "Submit",
      addSelectedProducts: "Add Selected Products",
      vegetables: "Vegetables",
      fruits: "Fruits",
      seeds: "Seeds",
      dairyProducts: "Dairy Products",
      fertilizers: "Fertilizers",
      herbs: "Herbs",
    },
    தமிழ்: {
      farmersMarket: "விவசாய சந்தை",
      searchProducts: "தயாரிப்புகளைத் தேடு...",
      addToBill: "பில் சேர்",
      yourBill: "உங்கள் பில்",
      subtotal: "துணை மொத்தம்",
      total: "மொத்தம்",
      saveToProducts: "தயாரிப்புகளாக சேமி",
      saving: "சேமிக்கிறது...",
      disputeSection: "புகார் பிரிவு",
      replyToQuery: "வாடிக்கையாளர்களின் கேள்விக்கு பதில்...",
      submit: "சமர்ப்பி",
      addSelectedProducts: "தேர்ந்தெடுத்த பொருட்களை சேர்",
      vegetables: "காய்கறிகள்",
      fruits: "பழங்கள்",
      seeds: "விதைகள்",
      dairyProducts: "பால் பொருட்கள்",
      fertilizers: "உரங்கள்",
      herbs: "மூலிகைகள்",
    },
    हिन्दी: {
      farmersMarket: "किसान बाजार",
      searchProducts: "उत्पाद खोजें...",
      addToBill: "बिल में जोड़ें",
      yourBill: "आपका बिल",
      subtotal: "उप-योग",
      total: "कुल",
      saveToProducts: "उत्पादों में सहेजें",
      saving: "सहेजा जा रहा है...",
      disputeSection: "विवाद अनुभाग",
      replyToQuery: "प्रश्न का जवाब दें...",
      submit: "जमा करें",
      addSelectedProducts: "चयनित उत्पाद जोड़ें",
      vegetables: "सब्जियाँ",
      fruits: "फल",
      seeds: "बीज",
      dairyProducts: "डेयरी उत्पाद",
      fertilizers: "उर्वरक",
      herbs: "जड़ी-बूटियाँ",
    },
  };

  // Fetch farmer info
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setFarmerInfo({
        name: user.displayName || "Farmer",
        email: user.email || "No email",
        id: user.uid,
      });
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch products from Goods node
  useEffect(() => {
    setLoading(true);
    const goodsRef = ref(db, "goods");
    const unsubscribe = onValue(
      goodsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const productsArray = Object.entries(data).map(([key, value]) => ({
            id: key,
            name: value.name || "Unnamed Product",
            tamilName: value.tamilName || value.name,
            hindiName: value.hindiName || value.name,
            weight: value.weight || "N/A",
            category: value.category || "Uncategorized",
            image: value.image || "https://via.placeholder.com/150",
          }));
          setAllProducts(productsArray);
        } else {
          setAllProducts([]);
          toast.warn("No products found in Goods", { position: "top-right", autoClose: 3000 });
        }
        setLoading(false);
      },
      (error) => {
        setError(`Failed to load products: ${error.message}`);
        toast.error("Failed to load products", { position: "top-right", autoClose: 3000 });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db]);

  // Voice recognition setup
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.warn("Speech recognition is not supported in your browser", { position: "top-right", autoClose: 3000 });
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === "English" ? "en-US" : language === "தமிழ்" ? "ta-IN" : "hi-IN";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      const product = allProducts.find((p) =>
        language === "English"
          ? p.name.toLowerCase().includes(transcript)
          : language === "தமிழ்"
            ? p.tamilName?.toLowerCase().includes(transcript)
            : p.hindiName?.toLowerCase().includes(transcript)
      );
      if (product) {
        toggleSelection(product);
        toast.success(`Selected: ${language === "English" ? product.name : language === "தமிழ்" ? product.tamilName : product.hindiName}`, {
          position: "top-right",
          autoClose: 2000,
        });
      } else {
        toast.info(`No product found for "${transcript}"`, { position: "top-right", autoClose: 2000 });
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Speech recognition error", { position: "top-right", autoClose: 2000 });
    };
    recognition.onend = () => setIsListening(false);

    if (isListening) recognition.start();
    return () => recognition.stop();
  }, [isListening, language, allProducts]);

  const toggleSelection = (product) => {
    setSelectedProducts((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, { ...product, qty: "", customPrice: "", finalPrice: 0 }]
    );
  };

  const addToBill = () => {
    if (selectedProducts.length === 0) {
      toast.warn("Please select at least one product", { position: "top-right", autoClose: 2000 });
      return;
    }
    setBillList((prev) => {
      let updatedBill = [...prev];
      selectedProducts.forEach((product) => {
        const existingIndex = updatedBill.findIndex((item) => item.id === product.id);
        const qty = Number(product.qty) || 1;
        const price = Number(product.customPrice) || 0;
        if (existingIndex !== -1) {
          updatedBill[existingIndex].qty = qty;
          updatedBill[existingIndex].customPrice = price;
          updatedBill[existingIndex].finalPrice = qty * price;
        } else {
          updatedBill.push({ ...product, qty, customPrice: price, finalPrice: qty * price });
        }
      });
      return updatedBill;
    });
    setSelectedProducts([]);
    toast.success("Products added to bill", { position: "top-right", autoClose: 2000 });
    // Auto-scroll to bill section
    setTimeout(() => {
      billRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const updateQuantity = (id, newQty) => {
    setBillList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, qty: newQty === "" ? "" : Math.max(0, Number(newQty)), finalPrice: (newQty === "" ? 0 : Math.max(0, Number(newQty))) * (Number(item.customPrice) || 0) }
          : item
      )
    );
  };

  const updateCustomPrice = (id, newPrice) => {
    setBillList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, customPrice: newPrice === "" ? "" : Math.max(0, Number(newPrice)), finalPrice: item.qty * (newPrice === "" ? 0 : Math.max(0, Number(newPrice))) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setBillList((prev) => prev.filter((item) => item.id !== id));
    toast.info("Item removed from bill", { position: "top-right", autoClose: 2000 });
  };

  const handleSaveProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError("Please log in to save products");
        navigate("/login");
        return;
      }

      const productsToSave = billList.map((item) => {
        const price = Number(item.customPrice);
        const stock = Number(item.qty); // Stock is the quantity set by the farmer
        if (isNaN(price) || price <= 0 || isNaN(stock) || stock <= 0) {
          throw new Error("All products must have a valid price and stock greater than 0.");
        }
        return {
          name: item.name,
          tamilName: item.tamilName,
          hindiName: item.hindiName || item.name,
          quantity: stock, // Initial stock set by farmer
          price,
          category: item.category,
          image: item.image,
          farmerId: user.uid,
          farmerName: farmerInfo.name,
          createdAt: new Date().toISOString(),
          availableStock: stock, // Track available stock separately
        };
      });

      const productsRef = ref(db, `products/farmer_${user.uid}`);
      for (const product of productsToSave) {
        const newProductRef = push(productsRef);
        await set(newProductRef, product);
      }

      setBillList([]);
      toast.success("Products saved successfully!", { position: "top-right", autoClose: 2000 });
    } catch (err) {
      console.error("Error saving products:", err.message);
      setError(err.message || "Failed to save products.");
      toast.error(err.message || "Failed to save products", { position: "top-right", autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const addDispute = () => {
    if (newDispute.trim()) {
      setDisputes((prev) => [...prev, newDispute]);
      setNewDispute("");
      toast.success(translations[language].submit, { position: "top-right", autoClose: 2000 });
    } else {
      toast.warn("Please enter a dispute before submitting", { position: "top-right", autoClose: 2000 });
    }
  };

  const categorizedBill = {
    Vegetables: billList.filter((item) => item.category === "Vegetables"),
    Fruits: billList.filter((item) => item.category === "Fruits"),
    Seeds: billList.filter((item) => item.category === "Seeds"),
    Fertilizers: billList.filter((item) => item.category === "Fertilizers"),
    Herbs: billList.filter((item) => item.category === "Herbs"),
    "Dairy Products": billList.filter((item) => item.category === "Dairy Products"),
  };

  const totalAmount = billList.reduce((sum, item) => sum + Number(item.finalPrice), 0);

  const pageVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.1 } },
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", when: "beforeChildren", staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  if (loading && !allProducts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-teal-800 text-xl">Loading...</p>
      </div>
    );
  }

  if (error && !allProducts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      className={`min-h-screen p-6 pb-32 transition-colors duration-500 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <ToastContainer theme={darkMode ? "dark" : "light"} />
      <motion.header
        className={`sticky top-4 z-40 flex justify-between items-center mb-8 p-4 rounded-2xl shadow-xl backdrop-blur-md border border-white/20
          ${darkMode ? "bg-slate-900/80" : "bg-white/80"}`}
        variants={containerVariants}
      >
        <div className="flex items-center space-x-4">
          <motion.div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-violet-500 rounded-full blur animate-pulse opacity-70"></div>
            <motion.img
              src="https://i.pinimg.com/736x/a8/f4/6a/a8f46ad882c293af8c3fe011ce13bbb0.jpg"
              alt="Logo"
              className="relative w-12 h-12 rounded-full border-2 border-white shadow-md z-10"
              whileHover={{ scale: 1.1, rotate: 360 }}
            />
          </motion.div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">
            {translations[language].farmersMarket}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-xl transition-all ${darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
          <motion.button
            onClick={() => navigate("/dashboard")}
            className={`p-2.5 rounded-xl transition-all ${darkMode ? "bg-red-900/20 hover:bg-red-900/30 text-red-400" : "bg-red-50 hover:bg-red-100 text-red-500"}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.header>

      {showSettings && (
        <motion.div
          className={`absolute top-24 right-6 p-5 rounded-2xl shadow-2xl z-50 border w-64 backdrop-blur-xl
            ${darkMode ? "bg-slate-900/95 border-slate-700" : "bg-white/95 border-slate-200"}`}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
        >
          <div className="space-y-4">
            <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
              <p className={`font-bold text-lg ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{farmerInfo.name}</p>
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{farmerInfo.email}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`w-full p-2.5 rounded-xl border appearance-none outline-none transition-all
                  ${darkMode
                    ? "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"}`}
              >
                <option value="English">English</option>
                <option value="தமிழ்">தமிழ் (Tamil)</option>
                <option value="हिन्दी">हिन्दी (Hindi)</option>
              </select>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                ${darkMode
                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>
          </div>
        </motion.div>
      )}

      <motion.div className="max-w-7xl mx-auto" variants={containerVariants}>

        {/* Search Bar */}
        <div className="relative mb-10 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-violet-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className={`relative flex items-center p-2 rounded-2xl border shadow-lg transition-all
            ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-white"}`}>

            <input
              type="text"
              placeholder={translations[language].searchProducts}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`flex-1 p-3 bg-transparent text-lg outline-none
                ${darkMode ? "text-white placeholder-slate-500" : "text-slate-800 placeholder-slate-400"}`}
            />

            <motion.button
              onClick={() => setIsListening(!isListening)}
              className={`relative p-4 rounded-xl text-white transition-all shadow-md overflow-hidden ${isListening
                  ? "bg-rose-500 shadow-rose-500/30"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-emerald-500/30"
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Mic className={`w-6 h-6 ${isListening ? "animate-pulse" : ""}`} />
            </motion.button>
          </div>
        </div>

        {/* Product Grid */}
        <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12" variants={containerVariants}>
          {allProducts.map((product) => {
            const isSelected = selectedProducts.some((p) => p.id === product.id);
            return (
              <motion.div
                key={product.id}
                variants={itemVariants}
                onClick={() => toggleSelection(product)}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex flex-col items-center p-3 rounded-2xl transition-all cursor-pointer border shadow-sm h-full
                  ${isSelected
                    ? darkMode
                      ? "bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : "bg-emerald-50 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : darkMode
                      ? "bg-slate-900 border-slate-800 hover:border-slate-600"
                      : "bg-white border-slate-100 hover:border-emerald-200"
                  }`}
              >
                {/* Image Container */}
                <div className={`relative w-full aspect-square mb-4 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Selection Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-emerald-500/20 z-10 flex items-center justify-center backdrop-blur-[2px]">
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        type="spring"
                        className="bg-emerald-500 text-white p-2.5 rounded-full shadow-lg"
                      >
                        <Check className="w-6 h-6" strokeWidth={3} />
                      </motion.div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="text-center w-full mt-auto">
                  <h3 className={`text-sm font-bold truncate transition-colors mb-1
                    ${isSelected
                      ? "text-emerald-600 dark:text-emerald-400"
                      : darkMode ? "text-slate-200" : "text-slate-700"}`}>
                    {language === "English" ? product.name : language === "தமிழ்" ? product.tamilName : product.hindiName}
                  </h3>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                    ${darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                    {product.weight}
                  </div>
                </div>

                {/* Selection Indicator Ring (Subtle) */}
                {!isSelected && (
                  <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 transition-colors
                    ${darkMode ? "border-slate-600 group-hover:border-emerald-500" : "border-slate-300 group-hover:border-emerald-500"}`}>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {selectedProducts.length > 0 && (
          <motion.button
            onClick={addToBill}
            className={`fixed bottom-8 right-8 px-8 py-4 rounded-full shadow-2xl z-50 flex items-center gap-4 font-bold text-lg border-4 transition-transform
              bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:scale-105 active:scale-95
              ${darkMode ? "border-slate-900 shadow-emerald-900/40" : "border-white shadow-emerald-500/30"}`}
            variants={itemVariants}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="bg-white text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shadow-sm">
              {selectedProducts.length}
            </div>
            <span>{translations[language].addSelectedProducts}</span>
            <Plus className="w-6 h-6" strokeWidth={3} />
          </motion.button>
        )}

        {/* Bill Section */}
        {billList.length > 0 && (
          <motion.div
            ref={billRef}
            className={`mt-16 p-8 rounded-3xl shadow-xl relative overflow-hidden border
              ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
            variants={containerVariants}
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

            <h2 className={`text-3xl font-black mb-8 flex items-center gap-3 ${darkMode ? "text-white" : "text-slate-800"}`}>
              <span className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">🧾</span>
              {translations[language].yourBill}
            </h2>

            {["Vegetables", "Fruits", "Seeds", "Dairy Products", "Herbs", "Fertilizers"].map((category) =>
              categorizedBill[category].length > 0 && (
                <div key={category} className="mb-8">
                  <h3 className={`text-lg font-bold mb-4 uppercase tracking-widest text-xs flex items-center gap-2
                    ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                    <span className="w-1 h-1 rounded-full bg-current"></span>
                    {translations[language][category.toLowerCase()]}
                  </h3>

                  <div className="space-y-3">
                    {categorizedBill[category].map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-opacity-50
                          ${darkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md"}`}
                        variants={itemVariants}
                      >
                        <div className="flex items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover shadow-sm bg-gray-200" />
                          <div>
                            <p className={`font-bold text-lg ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                              {language === "English" ? item.name : language === "தமிழ்" ? item.tamilName : item.hindiName}
                            </p>
                            <p className={`text-xs font-medium ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{item.weight}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Qty</label>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateQuantity(item.id, e.target.value)}
                              className={`w-20 p-2 text-center rounded-lg font-bold outline-none ring-1 focus:ring-2 transition-all
                                ${darkMode
                                  ? "bg-slate-900 border-slate-700 text-white ring-slate-700 focus:ring-emerald-500"
                                  : "bg-white border-slate-200 text-slate-800 ring-slate-200 focus:ring-emerald-500"}`}
                              min="0"
                            />
                          </div>

                          <div className="flex flex-col items-end">
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Price</label>
                            <input
                              type="number"
                              value={item.customPrice}
                              onChange={(e) => updateCustomPrice(item.id, e.target.value)}
                              className={`w-24 p-2 text-center rounded-lg font-bold outline-none ring-1 focus:ring-2 transition-all
                                ${darkMode
                                  ? "bg-slate-900 border-slate-700 text-white ring-slate-700 focus:ring-violet-500"
                                  : "bg-white border-slate-200 text-slate-800 ring-slate-200 focus:ring-violet-500"}`}
                              min="0"
                            />
                          </div>

                          <div className="w-24 text-right">
                            <p className={`text-lg font-black ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                              ₹{item.finalPrice.toFixed(0)}
                            </p>
                          </div>

                          <button onClick={() => removeItem(item.id)} className="p-2 rounded-full hover:bg-red-100 text-red-400 hover:text-red-500 transition-colors">
                            <LogOut className="w-5 h-5 opacity-0" /> {/* Hack for spacing if needed, or stick to X */}
                            <span className="text-xl font-bold">×</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className={`mt-2 flex justify-end text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {translations[language].subtotal}: <span className={`ml-2 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>₹{categorizedBill[category].reduce((sum, item) => sum + Number(item.finalPrice), 0).toFixed(2)}</span>
                  </div>
                </div>
              )
            )}

            <div className={`mt-8 pt-8 border-t flex flex-col items-end gap-2 ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
              <div className="flex items-baseline gap-4">
                <span className={`text-sm font-medium uppercase tracking-widest ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{translations[language].total}</span>
                <span className={`text-4xl font-black ${darkMode ? "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400" : "text-slate-800"}`}>
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <motion.button
              onClick={handleSaveProducts}
              disabled={loading}
              className={`mt-8 w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-[0.98]
                bg-gradient-to-r from-emerald-600 to-violet-600 text-white hover:shadow-emerald-500/25
                ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
              variants={itemVariants}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {translations[language].saving}
                </span>
              ) : (
                translations[language].saveToProducts
              )}
            </motion.button>

            {error && (
              <motion.p className="text-red-500 mt-4 text-center font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {error}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Dispute Section */}
        <motion.div className={`mt-12 p-8 rounded-3xl shadow-lg border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`} variants={containerVariants}>
          <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
            <span className="text-violet-500">💬</span>
            {translations[language].disputeSection}
          </h2>

          <div className={`p-1 rounded-xl border focus-within:ring-2 focus-within:ring-violet-500 transition-all
             ${darkMode ? "bg-slate-950 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
            <input
              type="text"
              value={newDispute}
              onChange={(e) => setNewDispute(e.target.value)}
              placeholder={translations[language].replyToQuery}
              className="w-full p-3 bg-transparent outline-none"
            />
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={addDispute}
              className="px-8 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/20"
            >
              {translations[language].submit}
            </button>
          </div>

          {disputes.length > 0 && (
            <div className="mt-8 space-y-4">
              {disputes.map((dispute, index) => (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={index} className={`p-4 rounded-xl border-l-4 border-violet-500 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}>
                  <p className={`${darkMode ? "text-slate-300" : "text-slate-700"}`}>{dispute}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ProductSelection;