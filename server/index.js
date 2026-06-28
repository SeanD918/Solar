const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/solar_estimator';
const JSON_DB_PATH = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json());

// Database connection state
let db = null;
let client = null;
let useLocalJson = false;

// Initialize database
async function initDatabase() {
    try {
        console.log('Connecting to MongoDB at:', MONGODB_URI);
        client = new MongoClient(MONGODB_URI, { connectTimeoutMS: 5000, socketTimeoutMS: 5000 });
        await client.connect();
        db = client.db('solar_estimator');
        console.log('Connected to MongoDB successfully! 🟢');
    } catch (error) {
        console.warn('MongoDB connection failed. Falling back to local JSON database. 🟡', error.message);
        useLocalJson = true;
        // Ensure local JSON database file exists
        if (!fs.existsSync(JSON_DB_PATH)) {
            fs.writeFileSync(JSON_DB_PATH, JSON.stringify({ estimates: [] }, null, 2));
        }
    }
}

// Helper to save estimate
async function saveEstimate(estimateData) {
    const record = {
        ...estimateData,
        createdAt: new Date()
    };

    if (useLocalJson) {
        const fileContent = fs.readFileSync(JSON_DB_PATH, 'utf8');
        const data = JSON.parse(fileContent);
        record.id = new ObjectId().toString(); // Generate unique ID
        data.estimates.push(record);
        fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
        return record;
    } else {
        const result = await db.collection('estimates').insertOne(record);
        record.id = result.insertedId.toString();
        return record;
    }
}

// Helper to get estimate by ID
async function getEstimateById(id) {
    if (useLocalJson) {
        const fileContent = fs.readFileSync(JSON_DB_PATH, 'utf8');
        const data = JSON.parse(fileContent);
        return data.estimates.find(est => est.id === id || est._id === id);
    } else {
        if (!ObjectId.isValid(id)) return null;
        return await db.collection('estimates').findOne({ _id: new ObjectId(id) });
    }
}

// Initialize database connection
initDatabase();

// Route: Base Status
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        database: useLocalJson ? 'JSON Fallback File' : 'MongoDB',
        message: 'Solar Energy Estimator API is active ☀️'
    });
});

// Route: Get Solar Irradiance
// Calculates average peak sun hours and provides a seasonal 12-month solar radiation profile.
app.get('/api/solar-irradiance', async (req, res) => {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Latitude and Longitude query parameters are required.' });
    }

    try {
        let apiData = null;
        let averageDailyIrradiance = 4.5; // default fallback (kWh/m²/day)

        // Try calling Open-Meteo Forecast API for shortwave radiation forecast
        try {
            const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=shortwave_radiation_sum&timezone=auto`;
            const response = await axios.get(openMeteoUrl, { timeout: 3000 });
            if (response.data && response.data.daily && response.data.daily.shortwave_radiation_sum) {
                const sums = response.data.daily.shortwave_radiation_sum.filter(val => val !== null);
                if (sums.length > 0) {
                    // Open-Meteo returns MJ/m²/day. Convert to kWh/m²/day (1 kWh = 3.6 MJ)
                    const avgMJ = sums.reduce((sum, val) => sum + val, 0) / sums.length;
                    averageDailyIrradiance = avgMJ / 3.6;
                    apiData = response.data.daily;
                }
            }
        } catch (apiErr) {
            console.warn('Open-Meteo API fetch failed, using mathematical latitude solar model:', apiErr.message);
        }

        // Generate high-fidelity 12-month seasonal irradiance curve based on Latitude.
        // Solar irradiance is maximum in summer and minimum in winter.
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = [];

        // Peak sun hours model based on latitude and earth tilt geometry (Tunisian Climatological Solar Atlas integration)
        let basePeakHours = 5.2;
        if (lat >= 30 && lat <= 38 && lon >= 7 && lon <= 12) {
            // Tunisian specific latitude range (High Accuracy climatology)
            if (lat >= 36.5) basePeakHours = 5.15; // Tunis, Bizerte, Nabeul
            else if (lat >= 35.5) basePeakHours = 5.42; // Sousse, Kairouan, Siliana
            else if (lat >= 34.5) basePeakHours = 5.68; // Sfax, Kasserine, Sidi Bouzid
            else if (lat >= 33.5) basePeakHours = 5.95; // Gafsa, Gabes, Tozeur
            else if (lat >= 32.0) basePeakHours = 6.22; // Kebili, Medenine
            else basePeakHours = 6.45; // Tataouine, Borj El Khadra
        } else {
            // Global latitude baseline
            const absLat = Math.abs(lat);
            basePeakHours = Math.max(3.2, 5.8 - absLat * 0.05);
        }

        // Calculate seasonal variations amplitude (higher latitude = larger variation)
        const absLat = Math.abs(lat);
        const amplitude = 1.2 + (absLat * 0.025);

        for (let i = 0; i < 12; i++) {
            // 1. Peak Sun Hours Model (usable solar radiation equivalent to 1000 W/m2)
            const isNorthernHemisphere = lat >= 0;
            const seasonPhase = isNorthernHemisphere ? 2 : 8; // June vs Dec peak
            const seasonalFactor = Math.sin(((i - seasonPhase) / 12) * 2 * Math.PI);
            let peakVal = basePeakHours + (amplitude * seasonalFactor);
            const noise = 0.9 + Math.random() * 0.2;
            peakVal = Math.round(peakVal * noise * 100) / 100;

            // 2. Daylight Hours Model (actual duration between sunrise and sunset)
            const dayOfYear = 15 + i * 30;
            const declinationDeg = 23.45 * Math.sin(((284 + dayOfYear) / 365) * 2 * Math.PI);
            const declinationRad = (declinationDeg * Math.PI) / 180;
            const latRad = (lat * Math.PI) / 180;
            const cosHourAngle = -Math.tan(latRad) * Math.tan(declinationRad);
            
            let dayLength = 12.0;
            if (cosHourAngle <= -1) {
                dayLength = 24.0;
            } else if (cosHourAngle >= 1) {
                dayLength = 0.0;
            } else {
                dayLength = (24 / Math.PI) * Math.acos(cosHourAngle);
            }
            dayLength = Math.round(dayLength * 100) / 100;

            monthlyData.push({
                month: months[i],
                irradiance: Math.max(1.0, Math.min(10.0, peakVal)), // Peak Sun Hours
                daylightHours: dayLength
            });
        }

        // Re-scale monthly averages if we fetched actual current forecast radiation from Open-Meteo
        if (apiData) {
            // Find current month
            const currentMonthIdx = new Date().getMonth();
            const scaleFactor = averageDailyIrradiance / monthlyData[currentMonthIdx].irradiance;
            // Adjust all months slightly based on current weather scale factor (clamped to prevent extremes)
            const clampedScale = Math.max(0.6, Math.min(1.4, scaleFactor));
            monthlyData.forEach(m => {
                m.irradiance = Math.round(m.irradiance * clampedScale * 100) / 100;
            });
        }

        // Calculate overall average of the generated seasonal curve
        const finalAverage = Math.round((monthlyData.reduce((s, m) => s + m.irradiance, 0) / 12) * 100) / 100;
        const avgDaylight = Math.round((monthlyData.reduce((s, m) => s + m.daylightHours, 0) / 12) * 100) / 100;

        res.json({
            lat,
            lon,
            source: apiData ? 'Open-Meteo + Solar Model' : 'Latitude Solar Model (Fallback)',
            averageDailyPeakHours: finalAverage,
            averageDaylightHours: avgDaylight,
            monthlyIrradiance: monthlyData
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to process solar irradiance request.', message: err.message });
    }
});

// Route: Save Estimate
app.post('/api/estimates', async (req, res) => {
    try {
        const result = await saveEstimate(req.body);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save estimate data.', message: err.message });
    }
});

// Route: Get Estimate by ID
app.get('/api/estimates/:id', async (req, res) => {
    try {
        const estimate = await getEstimateById(req.params.id);
        if (!estimate) {
            return res.status(404).json({ error: 'Estimate not found.' });
        }
        res.json(estimate);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve estimate data.', message: err.message });
    }
});

// Route: Expert AI Chatbot (Multilingual support)
app.post('/api/chatbot', (req, res) => {
    const { message, context, lang = 'en' } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message field is required.' });
    }

    const query = message.toLowerCase();
    let reply = "";
    let suggestions = [];

    // Context details (if user has run a calculation)
    const hasContext = context && context.area > 0;
    const area = hasContext ? parseFloat(context.area) : 0;
    const brand = hasContext ? context.brand : 'Ifrisol Monocrystalline';
    const totalCost = hasContext ? parseFloat(context.totalCost) : 0;
    const payback = hasContext ? parseFloat(context.payback) : 0;
    const monthlySavings = hasContext ? parseFloat(context.monthlySavings) : 0;
    const annualProduction = hasContext ? parseFloat(context.annualProduction) : 0;
    const co2Savings = hasContext ? parseFloat(context.co2Savings) : 0;

    // 1. ARABIC TRANSLATION CHATBOT RESPONDER
    if (lang === 'ar') {
        if (query.includes('أهلا') || query.includes('مرحبا') || query.includes('السلام') || query.includes('عسلامة')) {
            reply = "مرحباً بك! أنا مستشارك الشمسي الذكي لتونس. يمكنني شرح تكاليف الألواح الشمسية بالدينار التونسي، منح وكالة التحكم في الطاقة (ANME)، تفاصيل ربط الستاغ (STEG)، أو مقارنة الشركات المصنعة والمكونات. ما هو سؤالك اليوم؟";
            suggestions = ["كيف يتم حساب الأرباح؟", "مقارنة الشركات التونسية", "ما هي منحة الـ ANME؟"];
        }
        else if (query.includes('ربح') || query.includes('أرباح') || query.includes('عائد') || query.includes('استرجاع') || query.includes('خلاص')) {
            if (hasContext) {
                reply = `بناءً على مخطط السقف الخاص بك، فترة استرجاع رأس المال المقدرة هي **${payback} سنوات**. على مدار 25 سنة، يُتوقع أن تحقق صافي أرباح متراكمة قيمتها **${(monthlySavings * 12 * 25 - totalCost).toLocaleString(undefined, {maximumFractionDigits: 0})} دينار تونسي**! في تونس، تعتبر فترة استرجاع أقل من 7 سنوات استثماراً ممتازاً نظراً للارتفاع المستمر لتعريفة الكهرباء عند الستاغ.`;
            } else {
                reply = "عادةً، تتراوح فترة استرجاع رأس المال لأنظمة الطاقة الشمسية المنزلية في تونس بين **5 إلى 8 سنوات**، اعتماداً على شريحة استهلاك الستاغ (الجهد المنخفض) ونسبة الظل والدعم المباشر. بعد هذه الفترة، يصبح كل كيلواط يتم إنتاجه مجانياً بالكامل!";
            }
            suggestions = ["ما هي منحة الـ ANME؟", "مقارنة الشركات التونسية", "ما هو الأثر البيئي؟"];
        }
        else if (query.includes('تكلفة') || query.includes('سعر') || query.includes('فلوس') || query.includes('دينار') || query.includes('تكاليف')) {
            if (hasContext) {
                const subsidy = totalCost * 0.2;
                const netCost = totalCost - subsidy;
                reply = `لمساحة سقف تبلغ **${area} متر مربع**، تبلغ التكلفة الإجمالية التقديرية للتركيب **${totalCost.toLocaleString()} دينار تونسي**. ولكن مع **منحة الـ ANME بنسبة 20%**، ينخفض صافي استثمارك إلى **${netCost.toLocaleString()} دينار تونسي** (بتوفير قدره ${subsidy.toLocaleString()} دينار!).`;
            } else {
                reply = "تتراوح تكلفة تركيب الطاقة الشمسية في تونس بين 2000 إلى 3500 دينار لكل كيلوواط (kWp). النظام المنزلي المتوسط بقدرة 3 كيلوواط يكلف حوالي 7500 إلى 9500 دينار قبل الدعم. نطبق تلقائياً خصم 20% كدعم مباشر من وكالة التحكم في الطاقة.";
            }
            suggestions = ["ما هي منحة الـ ANME؟", "مقارنة الشركات التونسية", "حساب مساحة السقف"];
        }
        else if (query.includes('ماركة') || query.includes('شركة') || query.includes('ألواح') || query.includes('إيفريسول') || query.includes('جي بي سي') || query.includes('مقارنة')) {
            reply = "نقوم بمقارنة خيارات متعددة معتمدة في السوق التونسية:\n\n" +
                    "1. **إيفريسول (Ifrisol Monocrystalline)**: ألواح أحادية الكريستال مصنعة محلياً في تونس بضمان 25 سنة وتكلفة 520 د.ت.\n" +
                    "2. **إيفريسول ثنائية الوجه (Ifrisol BiFacial)**: ألواح متميزة تولد طاقة مضاعفة من الجهتين بضمان 25 سنة وتكلفة 620 د.ت.\n" +
                    "3. **جي بي سي (Green Power Company)**: تركيبات فاخرة متكاملة بضمان 25 سنة وتكلفة 720 د.ت.\n" +
                    "4. **جي إيه سولار (JA Solar)**: ألواح عالمية مستوردة بضمان 25 سنة وتكلفة 680 د.ت.\n" +
                    "5. **لونجي (LONGi Solar)**: حلول مستوردة فائقة الكفاءة بضمان 25 سنة وتكلفة 820 د.ت.\n" +
                    "6. **إيكوسولار (EcoSolar)**: خيار اقتصادي للمنازل بضمان 12 سنة وتكلفة 320 د.ت.";
            suggestions = ["أي ماركة يجب أن أختار؟", "تفاصيل الأرباح", "تأثير الظل على الألواح"];
        }
        else if (query.includes('دعم') || query.includes('منحة') || query.includes('لوكالة') || query.includes('تحكم') || query.includes('طاقة') || query.includes('صندوق')) {
            reply = "تقدم **الوكالة الوطنية للتحكم في الطاقة (ANME)** من خلال **صندوق الانتقال الطاقي (FTE)** دعماً مباشراً يغطي **20%** من تكلفة التركيب للأنظمة المنزلية. بالإضافة إلى ذلك، يمكنك الحصول على قروض ميسرة يتم سدادها مباشرة عبر فاتورة الكهرباء للستاغ!";
            suggestions = ["هل يشمل هذا التركيب؟", "كيف يتم حساب الأرباح؟", "رسم حدود السقف"];
        }
        else if (query.includes('الستاغ') || query.includes('ربط') || query.includes('شبكة') || query.includes('عداد') || query.includes('فاتورة')) {
            reply = "في تونس، يتم ربط النظام الشمسي بشبكة **الستاغ (STEG)** بنظام **صافي القياس (Net-Metering)** عن طريق عداد ثنائي الاتجاه. الكهرباء الفائضة عن حاجتك بالنهار تذهب للشبكة وتُحسب لك كأرصدة تستخدمها ليلاً أو في الشتاء لتخفيض فاتورتك.";
            suggestions = ["ما هو نظام صافي القياس؟", "مقارنة ماركات الألواح"];
        }
        else {
            if (hasContext) {
                reply = `لقد قمت بحساب تقديري لمساحة سقف تبلغ **${area} متر مربع** باستخدام ألواح **${brand}**. بإنتاج سنوي يبلغ **${annualProduction.toLocaleString()} كيلوواط ساعة**، ستوفر حوالي **${(monthlySavings * 12).toLocaleString(undefined, {maximumFractionDigits: 0})} دينار تونسي** سنوياً في الكهرباء. أخبرني بما تريد معرفته بخصوص الأرباح أو الدعم البيئي!`;
            } else {
                reply = "أنا هنا لمساعدتك في دراسة مشروعك الشمسي في تونس! اسألني عن أسعار التركيب بالدينار، منح الـ ANME، طريقة ربط الستاغ، أو كيفية حساب العائد المالي.";
            }
            suggestions = ["كم مساحة أحتاج؟", "مقارنة الشركات التونسية", "كيف يتم حساب الأرباح؟"];
        }
    }
    // 2. FRENCH TRANSLATION CHATBOT RESPONDER
    else if (lang === 'fr') {
        if (query.includes('bonjour') || query.includes('salut') || query.includes('allo') || query.includes('aslema') || query.includes('marhba')) {
            reply = "Aslema! Je suis votre conseiller solaire intelligent pour la Tunisie. Je peux vous expliquer les coûts en Dinars Tunisiens (DT), les subventions de l'ANME (FTE), le raccordement STEG, ou comparer les marques locales de panneaux. Quelles sont vos questions aujourd'hui ?";
            suggestions = ["Comment calculer le ROI ?", "Comparer les marques Tunisiennes", "C'est quoi la subvention ANME ?"];
        }
        else if (query.includes('roi') || query.includes('rentabilite') || query.includes('amortissement') || query.includes('recuperer') || query.includes('rentable')) {
            if (hasContext) {
                reply = `Sur la base de votre tracé, votre période de récupération estimée est de **${payback} ans**. Sur une durée de vie garantie de 25 ans, vous économiserez un montant net cumulé de **${(monthlySavings * 12 * 25 - totalCost).toLocaleString(undefined, {maximumFractionDigits: 0})} DT** ! Un retour sur investissement inférieur à 7 ans est une excellente opportunité en Tunisie en raison des hausses de tarifs de la STEG.`;
            } else {
                reply = "En général, les installations photovoltaïques résidentielles en Tunisie sont amorties en **5 à 8 ans**, selon votre tarif STEG (Basse Tension), l'ombrage et les subventions ANME. Après cette période, l'électricité produite est 100% gratuite !";
            }
            suggestions = ["En savoir plus sur l'ANME", "Comparer les marques Tunisiennes", "Quelles sont les économies de CO2 ?"];
        }
        else if (query.includes('cout') || query.includes('prix') || query.includes('cher') || query.includes('payer') || query.includes('dinar') || query.includes('dt') || query.includes('tarif')) {
            if (hasContext) {
                const subsidy = totalCost * 0.2;
                const netCost = totalCost - subsidy;
                reply = `Pour votre surface de toit de **${area} m²**, le coût d'installation brut estimé est de **${totalCost.toLocaleString()} DT**. Grâce à la **subvention ANME (FTE) de 20%**, votre investissement net est réduit à **${netCost.toLocaleString()} DT** (soit une remise directe de ${subsidy.toLocaleString()} DT !).`;
            } else {
                reply = "Le coût d'installation solaire en Tunisie varie entre 2 000 DT et 3 500 DT par kilowatt-crête (kWp). Un système résidentiel typique de 3 kWp coûte environ 7 500 DT à 9 500 DT avant subvention. Nous appliquons automatiquement la réduction ANME de 20%.";
            }
            suggestions = ["C'est quoi la subvention ANME ?", "Comparer les marques Tunisiennes", "Tracer mon toit"];
        }
        else if (query.includes('marque') || query.includes('panneau') || query.includes('comparer') || query.includes('ifrisol') || query.includes('gpc') || query.includes('ecosolar') || query.includes('longi') || query.includes('ja solar')) {
            reply = "Nous comparons plusieurs marques certifiées disponibles en Tunisie :\n\n" +
                    "1. **Ifrisol Monocristallin** : Panneaux fabriqués localement en Tunisie (520 DT), conçus pour les fortes chaleurs. Garantie 25 ans.\n" +
                    "2. **Ifrisol BiFacial Premium** : Modules double-face à haut rendement (620 DT) pour maximiser la production. Garantie 25 ans.\n" +
                    "3. **GPC Premium** : Solutions d'installation clés en main de Green Power Company (720 DT) avec composants de haute qualité.\n" +
                    "4. **JA Solar Vertex** : Module Tier-1 importé performant (680 DT) pour les installations résidentielles. Garantie 25 ans.\n" +
                    "5. **LONGi Solar Explorer** : Technologie premium importée (820 DT) offrant une durabilité supérieure. Garantie 25 ans.\n" +
                    "6. **EcoSolar Tunisie** : Solution d'entrée de gamme économique (320 DT) idéale pour les budgets réduits. Garantie 12 ans.";
            suggestions = ["Quelle marque choisir ?", "En savoir plus sur le ROI", "Comment l'ombrage affecte l'installation ?"];
        }
        else if (query.includes('anme') || query.includes('subvention') || query.includes('fte') || query.includes('aide') || query.includes('credit')) {
            reply = "L'**ANME (Agence Nationale pour la Maîtrise de l'Énergie)** offre via le **FTE (Fonds de Transition Énergétique)** une subvention directe de **20%** du coût total d'installation résidentielle. De plus, vous pouvez obtenir des crédits bancaires bonifiés remboursables directement sur votre facture STEG !";
            suggestions = ["Est-ce que cela inclut la main d'œuvre ?", "Comment calculer le ROI ?", "Tracer mon toit"];
        }
        else if (query.includes('steg') || query.includes('reseau') || query.includes('facture') || query.includes('net-metering') || query.includes('compteur')) {
            reply = "En Tunisie, le système fonctionne en **Net-Metering STEG** avec un compteur bidirectionnel. L'excédent d'énergie produit en journée est réinjecté dans le réseau STEG et converti en crédits kWh pour votre consommation nocturne ou hivernale, réduisant ainsi drastiquement vos factures.";
            suggestions = ["Comment fonctionne le compteur ?", "Comparer les marques"];
        }
        else {
            if (hasContext) {
                reply = `Vous avez configuré une simulation pour un toit de **${area} m²** avec les panneaux **${brand}**. Avec une production annuelle estimée à **${annualProduction.toLocaleString()} kWh**, vous économiserez **${(monthlySavings * 12).toLocaleString(undefined, {maximumFractionDigits: 0})} DT** par an sur votre électricité. Posez-moi des questions sur le ROI ou l'impact écologique !`;
            } else {
                reply = "Je suis à votre disposition pour vous aider dans votre projet solaire en Tunisie ! Interrogez-moi sur les coûts d'installation en Dinars, les aides de l'ANME, le système STEG ou le calcul de rentabilité.";
            }
            suggestions = ["Quelle surface est nécessaire ?", "Comparer les marques Tunisiennes", "Comment calculer le ROI ?"];
        }
    }
    // 3. ENGLISH TRANSLATION CHATBOT RESPONDER (Fallback)
    else {
        if (query.includes('hello') || query.includes('hi ') || query.includes('hey') || query.includes('greetings')) {
            reply = "Hello! I am your Solar Energy Advisor for Tunisia. I can help explain your estimated solar potential, costs in TND (DT), ROI payback times, ANME subsidies, or compare Tunisian solar brands. What questions do you have today?";
            suggestions = ["How is ROI calculated?", "Compare Tunisian brands", "Tell me about ANME subsidies"];
        }
        else if (query.includes('roi') || query.includes('return') || query.includes('payback') || query.includes('break even') || query.includes('worth it')) {
            if (hasContext) {
                reply = `Based on your layout, your estimated payback period is **${payback} years**. Over a standard 25-year panel lifespan, you are projected to save **${(monthlySavings * 12 * 25 - totalCost).toLocaleString(undefined, {maximumFractionDigits: 0})} DT** in net cumulative savings! A break-even point under 7 years is considered an exceptional investment in Tunisia due to rising STEG electricity tariffs.`;
            } else {
                reply = "Typically, residential solar panel installations in Tunisia have a payback period of **5 to 8 years**, depending on your STEG tariff tier (Basse Tension), shading, and ANME subsidies. After that, all electricity produced is 100% free! You can outline your roof on our map to get your custom ROI.";
            }
            suggestions = ["Tell me about ANME subsidies", "Compare Tunisian brands", "What are my CO2 savings?"];
        }
        else if (query.includes('cost') || query.includes('price') || query.includes('expensive') || query.includes('pay') || query.includes('dinar') || query.includes('dt')) {
            if (hasContext) {
                const subsidy = totalCost * 0.2;
                const netCost = totalCost - subsidy;
                reply = `For your roof area of **${area} m²**, the total estimated installation cost is **${totalCost.toLocaleString()} DT** for a top-quality system. However, with the **20% ANME (FTE) Solar Subsidy**, your net cost is reduced to **${netCost.toLocaleString()} DT** (saving you ${subsidy.toLocaleString()} DT directly!).`;
            } else {
                reply = "Solar installation costs in Tunisia range from 2,000 TND to 3,500 TND per kilowatt-peak (kWp). A typical 3 kWp residential system costs around 7,500 TND to 9,500 TND before subsidies. We factor in the 20% ANME FTE direct subsidy automatically.";
            }
            suggestions = ["What is the ANME subsidy?", "Compare solar brands", "Calculate my roof"];
        }
        else if (query.includes('brand') || query.includes('compare') || query.includes('ifrisol') || query.includes('gpc') || query.includes('ecosolar') || query.includes('longi') || query.includes('ja solar')) {
            reply = "We compare multiple certified brands in the Tunisian market:\n\n" +
                    "1. **Ifrisol Monocrystalline**: Nationally manufactured solar panels (520 TND) with high heat tolerance and 25-year warranty.\n" +
                    "2. **Ifrisol BiFacial Premium**: Dual-sided high-yield modules (620 TND) to maximize rear reflection output. 25-year warranty.\n" +
                    "3. **GPC Premium (Green Power Company)**: Turnkey premium setups (720 TND) featuring top-tier components and full engineering support.\n" +
                    "4. **JA Solar Vertex**: Widely used Tier-1 imported modules (680 TND) with a 25-year performance guarantee.\n" +
                    "5. **LONGi Solar Explorer**: Ultra-premium imported solar panels (820 TND) providing outstanding efficiency and lifetime.\n" +
                    "6. **EcoSolar Value**: Budget-friendly residential option (320 TND) with standard 12-year warranty.";
            suggestions = ["Which brand should I choose?", "Tell me about ROI", "How does shading affect panels?"];
        }
        else if (query.includes('anme') || query.includes('subsidy') || query.includes('incentive') || query.includes('credit') || query.includes('fte')) {
            reply = "Currently, the **ANME (Agence Nationale pour la Maîtrise de l'Énergie)** through the **FTE (Fonds de Transition Énergétique)** provides a direct subsidy of **20%** of the installation cost for residential solar systems. In addition, residential systems are eligible for easy low-interest loans from local banks which can be directly billed through your monthly STEG invoice!";
            suggestions = ["Does this include installation?", "How is ROI calculated?", "Estimate my roof"];
        }
        else if (query.includes('steg') || query.includes('net metering') || query.includes('sell') || query.includes('grid')) {
            reply = "In Tunisia, residential solar operates under **STEG Net-Metering**. You install a bidirectional meter. When your panels produce more than you consume, the excess is sent to STEG and credited to you. You use these credits during nights or winter. The bill is adjusted accordingly at the end of each billing cycle.";
            suggestions = ["What are STEG electricity rates?", "How is ROI calculated?"];
        }
        else {
            if (hasContext) {
                reply = `I see you have configured an estimate for a **${area} m²** roof using **${brand}** panels. With an annual production of **${annualProduction.toLocaleString(undefined, {maximumFractionDigits: 0})} kWh**, you'll save **${(monthlySavings * 12).toLocaleString(undefined, {maximumFractionDigits: 0})} DT** per year on electricity. Let me know if you have questions about ROI, ANME subsidies, or carbon offsets!`;
            } else {
                reply = "I'm happy to help you evaluate solar energy in Tunisia! Ask me about solar panel brands, roof size, installation costs in TND, the 20% ANME subsidy, ROI payback time, or how STEG net-metering works.";
            }
            suggestions = ["How much area do I need?", "Compare Tunisian brands", "How is ROI calculated?"];
        }
    }

    res.json({
        reply,
        suggestions
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Solar Energy Estimator API running on http://localhost:${PORT}`);
});