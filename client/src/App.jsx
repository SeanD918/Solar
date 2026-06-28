import { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  MapPin, 
  TrendingUp, 
  Leaf, 
  FileText, 
  Sparkles, 
  Trash2, 
  Layers, 
  Maximize2, 
  DollarSign, 
  Percent, 
  Zap, 
  Calendar,
  Layers2,
  Download,
  Send,
  MessageSquare,
  HelpCircle,
  X,
  ChevronRight,
  ShieldCheck,
  Award,
  CircleDollarSign,
  Compass,
  Undo
} from 'lucide-react';
import confetti from 'canvas-confetti';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { jsPDF } from 'jspdf';

// Register ChartJS Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Solar Panel Brands Database (Tunisia)
const BRANDS = {
  sunpower: {
    key: 'sunpower',
    name: 'Ifrisol Monocrystalline',
    efficiency: 21.8,
    degradation: 0.45, // % per year
    warranty: 25, // years
    costPerPanel: 520, // DT
    power: 410, // Watts (0.41 kW)
    quality: 'Tunisian PV Manufacturer',
    color: '#f59e0b'
  },
  canadian: {
    key: 'canadian',
    name: 'Green Power Company (GPC)',
    efficiency: 22.5,
    degradation: 0.30, // % per year
    warranty: 25, // years
    costPerPanel: 720, // DT
    power: 420, // Watts (0.42 kW)
    quality: 'Premium Installer Solution',
    color: '#3b82f6'
  },
  jinko: {
    key: 'jinko',
    name: 'EcoSolar Tunisie',
    efficiency: 19.5,
    degradation: 0.60, // % per year
    warranty: 12, // years
    costPerPanel: 320, // DT
    power: 380, // Watts (0.38 kW)
    quality: 'Value Monocrystalline',
    color: '#10b981'
  },
  ifrisol_bifacial: {
    key: 'ifrisol_bifacial',
    name: 'Ifrisol BiFacial Premium',
    efficiency: 22.4,
    degradation: 0.40, // % per year
    warranty: 25, // years
    costPerPanel: 620, // DT
    power: 460, // Watts (0.46 kW)
    quality: 'High-Yield BiFacial (Tunisian)',
    color: '#8b5cf6'
  },
  ja_solar: {
    key: 'ja_solar',
    name: 'JA Solar Vertex Import',
    efficiency: 22.0,
    degradation: 0.45, // % per year
    warranty: 25, // years
    costPerPanel: 680, // DT
    power: 450, // Watts (0.45 kW)
    quality: 'Tier-1 Imported Module',
    color: '#ec4899'
  },
  longi_solar: {
    key: 'longi_solar',
    name: 'LONGi Solar Explorer',
    efficiency: 22.5,
    degradation: 0.35, // % per year
    warranty: 25, // years
    costPerPanel: 820, // DT
    power: 455, // Watts (0.455 kW)
    quality: 'Ultra-Premium Tier-1 Import',
    color: '#06b6d4'
  }
};

// Multilingual Localizations (English, French, Arabic)
const LOCALIZATION = {
  en: {
    title: "Outline Roof & Estimate Solar",
    subtitle: "Locate your building and trace your roof to project energy savings.",
    searchPlaceholder: "Enter address, city, or coordinates (e.g. Tunis)...",
    searchBtn: "Search Location",
    area: "Outlined Area",
    maxPanels: "Max Panels Count",
    avgPeak: "Avg Daily Sun Hours",
    step1Name: "Roof Outline",
    step1Desc: "Locate & trace area",
    step2Name: "Solar Brands",
    step2Desc: "Compare systems",
    step3Name: "ROI Config",
    step3Desc: "Shading & bills",
    step4Name: "ROI Dashboard",
    step4Desc: "View final metrics",
    brandTitle: "Compare Panel Brands",
    brandSubtitle: "Select between local manufacturers, premium installers, and economic setups.",
    brandSelectTitle: "Select Brand Option",
    brandSpecsTitle: "Active Brand Specs Summary",
    powerTitle: "Rated Module Power",
    qtyProposed: "Quantity Proposed",
    capacitySize: "Array Capacity Size",
    warrantyTitle: "Materials Warranty",
    performanceYr25: "Performance at Year 25",
    btnBack: "Back",
    btnNext: "Next",
    btnAdjustROI: "Adjust Custom Economics",
    siteTitle: "Site Conditions",
    siteTilt: "Installation Tilt",
    siteAzimuth: "Orientation (Azimuth)",
    siteShading: "Shading Obstructions",
    utilityBill: "Average Monthly STEG Bill",
    utilityRate: "STEG Grid Rate",
    anmeSubNotice: "We automatically apply the standard 20% ANME FTE Solar Subsidy.",
    btnCalculate: "Calculate ROI & Build Dashboard",
    kpiPayback: "Payback Period",
    kpiCost: "Initial Net Cost",
    kpiProduction: "Annual Production",
    kpiSavings: "25-Yr Net Savings",
    kpiSavingsDesc: "Lifetime pure pocket profits",
    chartROI: "25-Year Cumulative Savings",
    chartMonthly: "Monthly Energy Projections",
    chartMonthlyDesc: "Solar Output vs House Demand",
    ecoTitle: "Environmental Impact Summary",
    ecoCO2: "Annual CO2 Prevented",
    ecoTrees: "Trees Equivalent",
    ecoMiles: "Gas Driving Avoided",
    pdfBtn: "Download PDF Report",
    saveBtn: "Save Report",
    botPlaceholder: "Ask about ROI, STEG rates, ANME subsidies...",
    botActiveExpert: "Active Expert",
    botTitle: "Solar Advisor Assistant",
    resetBtn: "Reset Draw",
    undoBtn: "Undo Point",
    locateBtn: "Locate Me",
    vpnError: "VPN connection detected! Please disable VPN to fetch real location.",
    instClick: "Click on your roof corners to outline target panel area.",
    units: "Units",
    hrsDay: "hrs/day",
    siteConfigTitle: "Site Configuration",
    stegProfileTitle: "STEG Utility & Consumption Profile",
    tiltHint: "Optimal angle matches your latitude (~30°–35°).",
    azimuthSouth: "South",
    azimuthEast: "East",
    azimuthWest: "West",
    azimuthHint: "180° is South (optimal). 90° is East, 270° is West.",
    shadingVal: "Shaded",
    shadingHint: "Accounts for surrounding trees, structures, or chimneys.",
    billUnit: "DT / month",
    billHint: "Helps size system capacity to your consumption load.",
    rateUnit: "DT",
    rateHint: "Typical Basse Tension residential tariff tiers in Tunisia.",
    warrantyYears: "Years (Guaranteed)",
    breakEvenLabel: "System break-even point",
    anmeLabel: "After 20% ANME Subsidy",
    yearlyOutputLabel: "Estimated yearly output",
    chartInflationNote: "Compared against utility costs with 3.5% inflation",
    dashboardTitle: "Solar ROI Analysis Dashboard",
    locationLabel: "Location",
    savingLabel: "Saving...",
    savedLabel: "Saved! ✓",
    tons: "Tons",
    trees: "Trees",
    miles: "Miles",
    peakLabel: "Peak Sun Hours (Energy):",
    sunriseSunsetLabel: "Daylight Hours (Sunrise - Sunset):",
    summerLabel: "Summer",
    winterLabel: "Winter"
  },
  fr: {
    title: "Tracer le Toit & Estimer le Solaire",
    subtitle: "Localisez votre bâtiment et tracez votre toit pour projeter vos économies.",
    searchPlaceholder: "Entrez l'adresse, la ville ou les coordonnées (ex: Tunis)...",
    searchBtn: "Rechercher",
    area: "Surface Tracée",
    maxPanels: "Panneaux Max",
    avgPeak: "Heures d'Ensoleillement",
    step1Name: "Tracé du Toit",
    step1Desc: "Localiser & mesurer",
    step2Name: "Marques Solaires",
    step2Desc: "Comparer les systèmes",
    step3Name: "Config ROI",
    step3Desc: "Ombrage & factures",
    step4Name: "Tableau de Bord",
    step4Desc: "Consulter les résultats",
    brandTitle: "Comparer les Marques de Panneaux",
    brandSubtitle: "Choisissez entre fabricants locaux, installateurs premium et solutions économiques.",
    brandSelectTitle: "Sélectionnez une Option",
    brandSpecsTitle: "Résumé des Spécifications Actives",
    powerTitle: "Puissance du Module",
    qtyProposed: "Quantité Proposée",
    capacitySize: "Capacité du Système",
    warrantyTitle: "Garantie Matériel",
    performanceYr25: "Performance à l'An 25",
    btnBack: "Retour",
    btnNext: "Suivant",
    btnAdjustROI: "Ajuster l'Économie Générale",
    siteTitle: "Conditions du Site",
    siteTilt: "Inclinaison du Toit",
    siteAzimuth: "Orientation (Azimut)",
    siteShading: "Pertes par Ombrage",
    utilityBill: "Facture STEG Mensuelle",
    utilityRate: "Tarif Réseau STEG",
    anmeSubNotice: "Nous appliquons automatiquement la subvention directe ANME FTE de 20%.",
    btnCalculate: "Calculer le ROI & Créer le Tableau de Bord",
    kpiPayback: "Période de Récupération",
    kpiCost: "Coût Net Initial",
    kpiProduction: "Production Annuelle",
    kpiSavings: "Économies sur 25 Ans",
    kpiSavingsDesc: "Profits nets cumulés à vie",
    chartROI: "Projection des Économies sur 25 Ans",
    chartMonthly: "Projections Énergétiques Mensuelles",
    chartMonthlyDesc: "Production Solaire vs Consommation Maison",
    ecoTitle: "Résumé de l'Impact Environnemental",
    ecoCO2: "CO2 Évité Annuellement",
    ecoTrees: "Équivalent en Arbres",
    ecoMiles: "Kilomètres en Voiture Évités",
    pdfBtn: "Télécharger le Rapport PDF",
    saveBtn: "Enregistrer le Rapport",
    botPlaceholder: "Posez vos questions sur le ROI, la STEG, l'ANME...",
    botActiveExpert: "Expert Actif",
    botTitle: "Assistant Solaire",
    resetBtn: "Réinitialiser",
    undoBtn: "Annuler Point",
    locateBtn: "Me localiser",
    vpnError: "Connexion VPN détectée ! Veuillez désactiver le VPN pour obtenir votre position réelle.",
    instClick: "Cliquez sur les coins de votre toit pour tracer la surface des panneaux.",
    units: "Unités",
    hrsDay: "h/jour",
    siteConfigTitle: "Configuration du Site",
    stegProfileTitle: "Profil STEG & Consommation",
    tiltHint: "L'angle optimal correspond à votre latitude (~30°–35°).",
    azimuthSouth: "Sud",
    azimuthEast: "Est",
    azimuthWest: "Ouest",
    azimuthHint: "180° = Sud (optimal). 90° = Est, 270° = Ouest.",
    shadingVal: "Ombrages",
    shadingHint: "Tient compte des arbres, structures ou cheminées environnants.",
    billUnit: "DT / mois",
    billHint: "Permet d’adapter la capacité du système à votre charge de consommation.",
    rateUnit: "DT",
    rateHint: "Tarifs résidentiels basse tension en vigueur en Tunisie.",
    warrantyYears: "Ans (Garantie)",
    breakEvenLabel: "Point de rentabilité du système",
    anmeLabel: "Après subvention ANME 20%",
    yearlyOutputLabel: "Production annuelle estimée",
    chartInflationNote: "Comparé aux coûts électriques avec 3,5% d’inflation",
    dashboardTitle: "Tableau de Bord ROI Solaire",
    locationLabel: "Localisation",
    savingLabel: "Enregistrement...",
    savedLabel: "Enregistré ! ✓",
    tons: "Tonnes",
    trees: "Arbres",
    miles: "km évités",
    peakLabel: "Heures de crête (Energie) :",
    sunriseSunsetLabel: "Heures de jour (Lever - Coucher) :",
    summerLabel: "Eté",
    winterLabel: "Hiver"
  },
  ar: {
    title: "رسم السقف وتقدير الطاقة",
    subtitle: "حدد موقع المبنى وارسم حدود سقفك لتقدير التوفير في فاتورة الكهرباء.",
    searchPlaceholder: "أدخل العنوان، المدينة أو الإحداثيات (مثال: تونس)...",
    searchBtn: "البحث عن الموقع",
    area: "المساحة المحددة",
    maxPanels: "أقصى عدد ألواح",
    avgPeak: "معدل ساعات الشمس اليومي",
    step1Name: "رسم السقف",
    step1Desc: "تحديد الموقع والمساحة",
    step2Name: "الشركات والماركات",
    step2Desc: "مقارنة الأنظمة والمكونات",
    step3Name: "إعدادات الأرباح",
    step3Desc: "الظلال والتكاليف",
    step4Name: "لوحة التحكم",
    step4Desc: "عرض الإحصائيات النهائية",
    brandTitle: "مقارنة ماركات الألواح الشمسية",
    brandSubtitle: "قارن بين المصنعين المحليين، شركات التركيب الممتازة والحلول الاقتصادية المتوازنة.",
    brandSelectTitle: "اختر نوع النظام",
    brandSpecsTitle: "ملخص المواصفات الفنية للنظام النشط",
    powerTitle: "قدرة اللوح الاسمي",
    qtyProposed: "عدد الألواح المقترح",
    capacitySize: "إجمالي قدرة النظام",
    warrantyTitle: "ضمان المكونات والألواح",
    performanceYr25: "معدل الأداء بعد 25 سنة",
    btnBack: "الرجوع",
    btnNext: "التالي",
    btnAdjustROI: "ضبط المعايير الاقتصادية",
    siteTitle: "معايير ومواصفات الموقع",
    siteTilt: "زاوية ميلان الألواح",
    siteAzimuth: "اتجاه الألواح (السمت)",
    siteShading: "نسبة خسائر الظلال",
    utilityBill: "معدل فاتورة الستاغ (STEG) الشهرية",
    utilityRate: "سعر الكيلوواط عند الستاغ",
    anmeSubNotice: "نقوم تلقائياً بتطبيق الدعم المباشر لوكالة التحكم في الطاقة (ANME) بنسبة 20%.",
    btnCalculate: "احسب العائد المالي واعرض النتائج",
    kpiPayback: "مدة استرجاع رأس المال",
    kpiCost: "صافي التكلفة الاستثمارية",
    kpiProduction: "الإنتاج السنوي للطاقة",
    kpiSavings: "صافي أرباح 25 سنة",
    kpiSavingsDesc: "الأرباح الصافية المحققة مدى الحياة",
    chartROI: "منحنى الأرباح المتراكمة خلال 25 سنة",
    chartMonthly: "مقارنة إنتاج الطاقة الشهري",
    chartMonthlyDesc: "إنتاج الألواح الشمسية مقابل استهلاك المنزل",
    ecoTitle: "ملخص الأثر البيئي الإيجابي",
    ecoCO2: "انبعاثات CO2 المتجنبة سنوياً",
    ecoTrees: "عدد الأشجار المكافئة",
    ecoMiles: "مسافة سياقة سيارات البنزين الملغاة",
    pdfBtn: "تحميل التقرير بصيغة PDF",
    saveBtn: "حفظ تقرير الحساب",
    botPlaceholder: "اسألني عن الأرباح، فواتير الستاغ، منح وكالة التحكم في الطاقة...",
    botActiveExpert: "مستشار نشط",
    botTitle: "مساعدك الشمسي الذكي",
    resetBtn: "إعادة تعيين",
    undoBtn: "تراجع",
    locateBtn: "تحديد موقعي",
    vpnError: "تم كشف اتصال VPN! يرجى إيقاف تشغيل الـ VPN للحصول على موقعك الحقيقي.",
    instClick: "انقر على زوايا السقف الخاص بك لتحديد مساحة تركيب الألواح.",
    units: "لوح",
    hrsDay: "ساعة/يوم",
    siteConfigTitle: "إعدادات الموقع",
    stegProfileTitle: "ملف الستاغ واستهلاك الطاقة",
    tiltHint: "الزاوية المثلى تتوافق مع خط عرض موقعك (~30°–35°).",
    azimuthSouth: "جنوب",
    azimuthEast: "شرق",
    azimuthWest: "غرب",
    azimuthHint: "180° = جنوب (أمثل). 90° = شرق, 270° = غرب.",
    shadingVal: "ظلال",
    shadingHint: "يأخذ بعين الاعتبار الأشجار والمباني والمداخن المحيطة.",
    billUnit: "دت / شهر",
    billHint: "يساعد على تحديد طاقة النظام الملائمة لاستهلاكك.",
    rateUnit: "دت",
    rateHint: "تعريفة السكن الجهد المنخفض المعتمدة في تونس.",
    warrantyYears: "سنة (مضمون)",
    breakEvenLabel: "نقطة تعادل النظام",
    anmeLabel: "بعد دعم وكالة ANME بنسبة 20%",
    yearlyOutputLabel: "الإنتاج السنوي المتوقع",
    chartInflationNote: "مقارنة بتكاليف الكهرباء مع تضخم 3.5%",
    dashboardTitle: "لوحة تحليل العائد على الاستثمار الشمسي",
    locationLabel: "الموقع",
    savingLabel: "جاري الحفظ...",
    savedLabel: "تم الحفظ! ✓",
    tons: "طن",
    trees: "شجرة",
    miles: "كم متجنبة",
    peakLabel: "ساعات الذروة (طاقة):",
    sunriseSunsetLabel: "ساعات النهار (شروق - غروب):",
    summerLabel: "الصيف",
    winterLabel: "الشتاء"
  }
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const BACKEND_URL = 'http://localhost:3001';

const MONTHS_LOCALIZED = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: ['Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'],
  ar: ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
};

function App() {
  const [lang, setLang] = useState('ar'); // Default to Arabic
  const t = (key) => LOCALIZATION[lang][key] || LOCALIZATION['en'][key] || key;

  // App Steps: 0 = Location, 1 = Config/Brand, 2 = Economics, 3 = Dashboard Results
  const [activeStep, setActiveStep] = useState(0);

  // Map & Location state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationName, setLocationName] = useState('Tunis, Tunisia');
  const [coordinates, setCoordinates] = useState({ lat: 36.8065, lon: 10.1815 });
  const [mapPoints, setMapPoints] = useState([]);
  const [calculatedArea, setCalculatedArea] = useState(0);
  const [isDrawing, setIsDrawing] = useState(true);
  const [mapLayer, setMapLayer] = useState('satellite'); // satellite or street
  const [searchLoading, setSearchLoading] = useState(false);

  // User configurables
  const [selectedBrand, setSelectedBrand] = useState('sunpower');
  const [panelsCount, setPanelsCount] = useState(0);
  const [tilt, setTilt] = useState(30); // tilt in degrees
  const [azimuth, setAzimuth] = useState(180); // orientation in degrees (180 = South)
  const [shading, setShading] = useState(10); // shading loss in %
  const [utilityRate, setUtilityRate] = useState(0.28); // DT/kWh
  const [monthlyBill, setMonthlyBill] = useState(180); // monthly electricity bill in DT
  
  // Estimation & Solar Data results
  const [solarIrradiance, setSolarIrradiance] = useState({
    averageDailyPeakHours: 5.2,
    averageDaylightHours: 12.0,
    monthlyIrradiance: [
      { month: 'Jan', irradiance: 4.1, daylightHours: 9.8 },
      { month: 'Feb', irradiance: 4.5, daylightHours: 10.7 },
      { month: 'Mar', irradiance: 5.2, daylightHours: 12.0 },
      { month: 'Apr', irradiance: 5.8, daylightHours: 13.2 },
      { month: 'May', irradiance: 6.2, daylightHours: 14.1 },
      { month: 'Jun', irradiance: 6.5, daylightHours: 14.5 },
      { month: 'Jul', irradiance: 6.4, daylightHours: 14.3 },
      { month: 'Aug', irradiance: 6.1, daylightHours: 13.6 },
      { month: 'Sep', irradiance: 5.4, daylightHours: 12.4 },
      { month: 'Oct', irradiance: 4.8, daylightHours: 11.2 },
      { month: 'Nov', irradiance: 4.3, daylightHours: 10.1 },
      { month: 'Dec', irradiance: 3.9, daylightHours: 9.5 }
    ]
  });

  // Saving state
  const [saveStatus, setSaveStatus] = useState('idle');
  const [savedId, setSavedId] = useState(null);

  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: "Aslema! I am your Solar Energy Advisor for Tunisia. Draw your roof on the map to get started, and I can answer questions about your estimated solar costs in DT, local installation brands, STEG net-metering, or ANME subsidies!",
      suggestions: ['How is ROI calculated?', 'Compare Tunisian brands', 'What is the ANME subsidy?']
    }
  ]);
  const [botTyping, setBotTyping] = useState(false);

  // Leaflet map references
  const mapRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const markersGroupRef = useRef(null);
  const tileLayerRef = useRef(null);
  const chatEndRef = useRef(null);
  const tempLineRef = useRef(null);
  const mapPointsRef = useRef([]);

  // 1. Fetch Irradiance Data when coordinates change
  useEffect(() => {
    async function fetchSolarData() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/solar-irradiance?lat=${coordinates.lat}&lon=${coordinates.lon}`);
        if (response.ok) {
          const data = await response.json();
          setSolarIrradiance({
            averageDailyPeakHours: data.averageDailyPeakHours,
            averageDaylightHours: data.averageDaylightHours || 12.0,
            monthlyIrradiance: data.monthlyIrradiance
          });
        }
      } catch (err) {
        console.error('Error fetching solar irradiance data:', err);
      }
    }
    fetchSolarData();
  }, [coordinates]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (activeStep === 0 && !mapRef.current) {
      // Create map
      const map = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView([coordinates.lat, coordinates.lon], 19);

      L.control.zoom({ position: 'topleft' }).addTo(map);
      mapRef.current = map;

      // Set initial tile layer (Google Hybrid Satellite)
      const satelliteUrl = GOOGLE_MAPS_API_KEY 
        ? `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      const satelliteLayer = L.tileLayer(satelliteUrl, { maxZoom: 20 });
      satelliteLayer.addTo(map);
      tileLayerRef.current = satelliteLayer;

      // Layer groups for drawing
      markersGroupRef.current = L.layerGroup().addTo(map);
      polygonLayerRef.current = L.polygon([], {
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.25,
        weight: 3
      }).addTo(map);

      // Handle Map Clicks for drawing
      map.on('click', (e) => {
        if (!isDrawing) return;
        const newPoint = e.latlng;
        const isFirstPoint = mapPointsRef.current.length === 0;
        const markerIndex = mapPointsRef.current.length;
        
        // Custom neon marker icon (anchor is green, others are gold)
        const neonIcon = L.divIcon({
          className: isFirstPoint ? 'custom-neon-marker-anchor' : 'custom-neon-marker',
          html: `<div style="width:14px; height:14px; border-radius:50%; background:${isFirstPoint ? '#10b981' : '#f59e0b'}; border:2px solid #ffffff; box-shadow:0 0 12px ${isFirstPoint ? '#10b981' : '#f59e0b'}; cursor: pointer;"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const marker = L.marker(newPoint, { 
          icon: neonIcon,
          draggable: true 
        }).addTo(markersGroupRef.current);
        
        if (isFirstPoint) {
          marker.on('click', (ev) => {
            L.DomEvent.stopPropagation(ev);
            const currentPoints = mapPointsRef.current;
            if (currentPoints.length >= 3) {
              setIsDrawing(false);
            }
          });
        }

        // Live dragging listener to adjust coordinate points in real-time
        marker.on('drag', (ev) => {
          const draggedLatLng = ev.target.getLatLng();
          setMapPoints(prev => {
            const updated = [...prev];
            updated[markerIndex] = draggedLatLng;
            if (polygonLayerRef.current) {
              polygonLayerRef.current.setLatLngs(updated);
            }
            return updated;
          });
        });

        setMapPoints(prev => {
          const updated = [...prev, newPoint];
          polygonLayerRef.current.setLatLngs(updated);
          return updated;
        });
      });

      // Handle Map Mousemove for drawing guideline
      map.on('mousemove', (e) => {
        if (!isDrawing) return;
        const points = mapPointsRef.current;
        if (points.length === 0) return;
        
        const lastPoint = points[points.length - 1];
        const guidePoints = [lastPoint, e.latlng];
        
        if (tempLineRef.current) {
          tempLineRef.current.setLatLngs(guidePoints);
        } else {
          tempLineRef.current = L.polyline(guidePoints, {
            color: '#f59e0b',
            weight: 2,
            dashArray: '6, 6',
            opacity: 0.8
          }).addTo(map);
        }
      });
    }

    // Cleanup map on unmount
    return () => {
      if (mapRef.current && activeStep !== 0) {
        mapRef.current.remove();
        mapRef.current = null;
        polygonLayerRef.current = null;
        markersGroupRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [activeStep]);

  // Adjust map viewport when coordinates change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([coordinates.lat, coordinates.lon], 19);
      clearDrawing();
    }
  }, [coordinates]);

  // Redraw polygon if points list changes
  useEffect(() => {
    mapPointsRef.current = mapPoints;
    if (polygonLayerRef.current && mapPoints.length >= 3) {
      const area = calculateGeodesicArea(mapPoints);
      setCalculatedArea(Math.round(area * 10) / 10);
      
      // Compute default panels: assumes ~1.8 m² per panel and 60% coverage factor
      const maxPanels = Math.floor((area * 0.65) / 1.8);
      setPanelsCount(Math.max(1, maxPanels));
    } else {
      setCalculatedArea(0);
      setPanelsCount(0);
    }
  }, [mapPoints]);

  // Clean guide line when drawing completes
  useEffect(() => {
    if (!isDrawing && tempLineRef.current && mapRef.current) {
      mapRef.current.removeLayer(tempLineRef.current);
      tempLineRef.current = null;
    }
  }, [isDrawing]);

  // Scroll chat window to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, botTyping]);

  // Translate Chatbot Welcome Message when language changes
  useEffect(() => {
    let welcomeText = "";
    let welcomeSuggestions = [];

    if (lang === 'ar') {
      welcomeText = "عسلامة! أنا مستشارك الشمسي الذكي لتونس. ارسم حدود سقفك على الخريطة للبدء، ويمكنني الإجابة على أسئلتك حول تكاليف الألواح الشمسية بالدينار، الماركات المتاحة، ربط الستاغ، أو منح الـ ANME!";
      welcomeSuggestions = ["كيف يتم حساب الأرباح؟", "مقارنة الشركات التونسية", "ما هي منحة الـ ANME؟"];
    } else if (lang === 'fr') {
      welcomeText = "Aslema ! Je suis votre conseiller solaire intelligent pour la Tunisie. Tracez votre toit sur la carte pour commencer, et je répondrai à vos questions sur les coûts en DT, les marques d'installation, la STEG, ou les aides de l'ANME !";
      welcomeSuggestions = ["Comment calculer le ROI ?", "Comparer les marques Tunisiennes", "C'est quoi la subvention ANME ?"];
    } else {
      welcomeText = "Aslema! I am your Solar Energy Advisor for Tunisia. Draw your roof on the map to get started, and I can answer questions about your estimated solar costs in DT, local installation brands, STEG net-metering, or ANME subsidies!";
      welcomeSuggestions = ["How is ROI calculated?", "Compare Tunisian brands", "What is the ANME subsidy?"];
    }

    setChatMessages([
      {
        sender: 'bot',
        text: welcomeText,
        suggestions: welcomeSuggestions
      }
    ]);
  }, [lang]);

  // Geolocation with IP verification to check for VPN routing
  const getUserRealLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setSearchLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const gpsLat = position.coords.latitude;
        const gpsLon = position.coords.longitude;

        try {
          // Fetch IP location data
          const ipResponse = await fetch("https://ipapi.co/json/");
          if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            const ipLat = parseFloat(ipData.latitude);
            const ipLon = parseFloat(ipData.longitude);
            const ipCountry = ipData.country_code;

            // Calculate distance between physical GPS and IP location
            const R = 6371; // Earth radius in km
            const dLat = ((ipLat - gpsLat) * Math.PI) / 180;
            const dLon = ((ipLon - gpsLon) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((gpsLat * Math.PI) / 180) *
                Math.cos((ipLat * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distanceKm = R * c;

            // VPN check: If IP is outside Tunisia or distance is > 150 km
            const isOutsideTunisia = ipCountry !== 'TN' && (gpsLat >= 30 && gpsLat <= 38.5 && gpsLon >= 7 && gpsLon <= 12);
            if (distanceKm > 150 || isOutsideTunisia) {
              alert(t('vpnError'));
              setSearchLoading(false);
              return;
            }
          }
        } catch (ipErr) {
          console.warn("Could not check VPN status via IP info, proceeding with GPS coordinates:", ipErr);
        }

        // reverse geocode GPS coordinates to set address text
        try {
          const reverseResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${gpsLat}&lon=${gpsLon}`);
          if (reverseResponse.ok) {
            const reverseData = await reverseResponse.json();
            setLocationName(reverseData.display_name || "Current Location");
          }
        } catch (revErr) {
          console.error("Reverse geocoding failed:", revErr);
          setLocationName(`Location (${gpsLat.toFixed(4)}, ${gpsLon.toFixed(4)})`);
        }

        setCoordinates({ lat: gpsLat, lon: gpsLon });
        setSearchLoading(false);
      },
      (error) => {
        console.error("Geolocation failed:", error);
        alert("Failed to acquire device location. Please enable location permissions.");
        setSearchLoading(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Geocoder API search using Nominatim
  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      if (response.ok) {
        const results = await response.json();
        if (results.length > 0) {
          const loc = results[0];
          setLocationName(loc.display_name);
          setCoordinates({
            lat: parseFloat(loc.lat),
            lon: parseFloat(loc.lon)
          });
        } else {
          alert('Address not found. Please try a different query or enter coordinates.');
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      alert('Error searching for location. Please check your connection.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Change Map Base Layers
  const toggleMapLayer = (type) => {
    if (!mapRef.current || !tileLayerRef.current) return;
    setMapLayer(type);
    mapRef.current.removeLayer(tileLayerRef.current);

    let newTileUrl = '';
    if (type === 'satellite') {
      newTileUrl = GOOGLE_MAPS_API_KEY
        ? `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else {
      newTileUrl = GOOGLE_MAPS_API_KEY
        ? `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    const newLayer = L.tileLayer(newTileUrl, { maxZoom: 20 });
    newLayer.addTo(mapRef.current);
    tileLayerRef.current = newLayer;
  };

  // Clear Map Outlines
  const clearDrawing = () => {
    setMapPoints([]);
    setCalculatedArea(0);
    setPanelsCount(0);
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
    }
    if (polygonLayerRef.current) {
      polygonLayerRef.current.setLatLngs([]);
    }
    if (tempLineRef.current && mapRef.current) {
      mapRef.current.removeLayer(tempLineRef.current);
      tempLineRef.current = null;
    }
    setIsDrawing(true);
  };

  // Undo the last drawn coordinate point
  const undoLastPoint = () => {
    if (mapPoints.length === 0) return;
    
    // Clear last marker layer
    if (markersGroupRef.current) {
      const layers = markersGroupRef.current.getLayers();
      if (layers.length > 0) {
        markersGroupRef.current.removeLayer(layers[layers.length - 1]);
      }
    }
    
    setMapPoints(prev => {
      const updated = prev.slice(0, -1);
      if (polygonLayerRef.current) {
        polygonLayerRef.current.setLatLngs(updated);
      }
      return updated;
    });
  };

  // planar Shoelace polygon area calculation in square meters
  const calculateGeodesicArea = (latlngs) => {
    if (latlngs.length < 3) return 0;
    
    // Average latitude for scaling
    const avgLat = latlngs.reduce((sum, p) => sum + p.lat, 0) / latlngs.length;
    const latRad = (avgLat * Math.PI) / 180;
    
    const R = 6378137; // Earth radius in meters
    
    // Convert to meters
    const coords = latlngs.map(p => {
      const x = p.lng * (Math.PI / 180) * R * Math.cos(latRad);
      const y = p.lat * (Math.PI / 180) * R;
      return { x, y };
    });
    
    // Shoelace formula
    let area = 0;
    const n = coords.length;
    for (let i = 0; i < n; i++) {
      const current = coords[i];
      const next = coords[(i + 1) % n];
      area += (current.x * next.y) - (next.x * current.y);
    }
    return Math.abs(area / 2);
  };

  // Financial and Production Calculation Engine
  const activeBrand = BRANDS[selectedBrand];
  const systemCapacityKw = (panelsCount * activeBrand.power) / 1000; // kW

  // Factor in orientation and tilt efficiency multiplier
  // South facing at matching latitude is 100% efficient.
  const calculateEfficiencyMultiplier = () => {
    const latRad = (coordinates.lat * Math.PI) / 180;
    const tiltRad = (tilt * Math.PI) / 180;
    const azimuthRad = (azimuth * Math.PI) / 180;
    
    // Relative losses based on tilt (diff from latitude) and orientation (diff from South = 180)
    const tiltDiff = Math.abs(tilt - coordinates.lat);
    const azimuthDiff = Math.abs(azimuth - 180);
    
    const tiltFactor = Math.max(0.7, 1 - (tiltDiff * 0.005));
    const azimuthFactor = Math.max(0.65, 1 - (azimuthDiff * 0.0022));
    
    return tiltFactor * azimuthFactor;
  };

  const efficiencyMultiplier = calculateEfficiencyMultiplier();

  // Annual electricity consumption of the house (kWh)
  const annualConsumptionKwh = (monthlyBill / utilityRate) * 12;

  // Annual energy production of solar array
  const baseAnnualProduction = systemCapacityKw * solarIrradiance.averageDailyPeakHours * 365;
  const shadingFactor = 1 - (shading / 100);
  const annualSolarProductionKwh = Math.round(baseAnnualProduction * efficiencyMultiplier * shadingFactor);

  // Installation Costs (Tunisian Dinar - DT)
  const equipmentCost = panelsCount * activeBrand.costPerPanel;
  const laborAndInverterCost = systemCapacityKw * 900 + 2500; // Base pricing model in DT
  const upfrontInstallationCost = Math.round(equipmentCost + laborAndInverterCost);
  const realAnmeSubsidy = Math.round(upfrontInstallationCost * 0.20); // 20% ANME direct subsidy
  const netInvestmentCost = upfrontInstallationCost - realAnmeSubsidy;

  // Monthly utility offset savings (STEG Net-Metering)
  const annualSolarValuedRate = Math.min(annualSolarProductionKwh, annualConsumptionKwh) * utilityRate +
    Math.max(0, annualSolarProductionKwh - annualConsumptionKwh) * 0.050; // Excess sent to STEG at 50 millimes (0.050 DT)
  const monthlySavings = Math.round((annualSolarValuedRate / 12) * 100) / 100;
  
  // Calculate payback timeline arrays for charts
  const calculateROIProjections = () => {
    const years = Array.from({ length: 25 }, (_, i) => i + 1);
    let cumulativeSolarSavings = [0];
    let cumulativeUtilityCost = [0];
    let paybackYear = null;

    let utilityBase = monthlyBill * 12;
    let solarSavingsBase = annualSolarValuedRate;

    for (let yr = 1; yr <= 25; yr++) {
      // Utility rate inflates at 3.5% annually
      utilityBase = utilityBase * 1.035;
      cumulativeUtilityCost.push(Math.round(cumulativeUtilityCost[yr - 1] + utilityBase));

      // Solar production degrades annually based on brand specifications
      const degradationFactor = Math.pow(1 - (activeBrand.degradation / 100), yr);
      const yearSavings = solarSavingsBase * degradationFactor * (1.035); // savings value inflates with utility rate
      cumulativeSolarSavings.push(Math.round(cumulativeSolarSavings[yr - 1] + yearSavings));

      // Break even tracking (compare cumulative savings with net initial investment cost)
      if (paybackYear === null && cumulativeSolarSavings[yr] >= netInvestmentCost) {
        paybackYear = yr;
      }
    }

    return {
      years,
      cumulativeSolarSavings: cumulativeSolarSavings.slice(1),
      cumulativeUtilityCost: cumulativeUtilityCost.slice(1),
      paybackYear: paybackYear || '8.5'
    };
  };

  const projections = calculateROIProjections();

  // Environmental Benefits
  const co2SavingsMetricTons = Math.round((annualSolarProductionKwh * 0.0007) * 10) / 10; // 0.7 kg CO2 per kWh offset
  const treesPlantedEquivalent = Math.round(co2SavingsMetricTons * 16.5);
  const gasMilesAvoided = Math.round(co2SavingsMetricTons * 2480);

  // Proceed and trigger confetti
  const triggerDashboard = () => {
    setActiveStep(3);
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.65 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ffffff']
    });
  };

  // PDF Download Compiler
  const downloadPDFReport = () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    // Styles
    doc.setFillColor(7, 10, 19); // Background dark blue
    doc.rect(0, 0, 210, 297, 'F');

    // Title Header Card
    doc.setFillColor(15, 23, 42); // Glass panel card
    doc.rect(10, 10, 190, 45, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1);
    doc.line(10, 10, 10, 55);

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('SolarSun Energy Estimator', 16, 23);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11);
    doc.text('PREMIUM TUNISIAN GREEN ENERGY ROI REPORT', 16, 29);

    doc.setTextColor(156, 163, 175);
    doc.setFontSize(9);
    doc.text(`Location: ${locationName}`, 16, 38);
    doc.text(`Coordinates: ${coordinates.lat.toFixed(5)}°, ${coordinates.lon.toFixed(5)}°`, 16, 43);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 16, 48);

    // Section 1: System Design Specifications
    doc.setFillColor(15, 23, 42);
    doc.rect(10, 62, 190, 65, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('1. Solar Design & Configuration', 15, 72);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Selected Solar Brand:  ${activeBrand.name} (${activeBrand.quality})`, 15, 82);
    doc.text(`Estimated Roof Area:    ${calculatedArea} m²`, 15, 88);
    doc.text(`Total Installed Panels: ${panelsCount} units`, 15, 94);
    doc.text(`System Capacity Size:   ${systemCapacityKw.toFixed(2)} kWp`, 15, 100);
    doc.text(`Installation Orientation: ${azimuth}° (${azimuth === 180 ? 'South' : azimuth > 180 ? 'South-West' : 'South-East'})`, 15, 106);
    doc.text(`Roof Tilt Angle:         ${tilt}°`, 15, 112);
    doc.text(`Shading Obstacles Loss:  ${shading}%`, 15, 118);

    // Section 2: Economics and Investment ROI
    doc.setFillColor(15, 23, 42);
    doc.rect(10, 134, 190, 72, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('2. Financial Investment & ROI Modeling', 15, 144);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Total Upfront Cost (Gross):      ${upfrontInstallationCost.toLocaleString()} DT`, 15, 154);
    doc.text(`ANME FTE Solar Subsidy (20%):   -${realAnmeSubsidy.toLocaleString()} DT`, 15, 160);
    
    doc.setTextColor(16, 185, 129);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Net Out-of-Pocket Investment:   ${netInvestmentCost.toLocaleString()} DT`, 15, 168);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text(`Estimated Annual Solar Output:   ${annualSolarProductionKwh.toLocaleString()} kWh`, 15, 176);
    doc.text(`Current STEG Bill Cost:         ${monthlyBill} DT/month (${(monthlyBill * 12).toLocaleString()} DT/year)`, 15, 182);
    doc.text(`Calculated Solar Savings:        ${Math.round(monthlySavings * 12).toLocaleString()} DT/year (${monthlySavings.toFixed(0)} DT/month)`, 15, 188);
    
    doc.setTextColor(245, 158, 11);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Estimated Investment Payback:    ${projections.paybackYear} Years`, 15, 198);

    // Section 3: Environmental Offset Details
    doc.setFillColor(15, 23, 42);
    doc.rect(10, 213, 190, 52, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('3. Environmental Carbon Savings Offset', 15, 223);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129);
    doc.text(`Annual CO2 Emissions Offset:   ${co2SavingsMetricTons} Metric Tons`, 15, 235);
    doc.text(`Trees Planted Equivalent Offset:  ${treesPlantedEquivalent} trees every year`, 15, 241);
    doc.text(`Equivalent Gas Vehicle Mileage:  ${gasMilesAvoided.toLocaleString()} miles not driven`, 15, 247);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('SolarSun SaaS Platform. Powered by Open-Meteo & STEG Net-Metering Guidance.', 10, 280);

    // Save
    doc.save(`Solar_Savings_Estimate_${selectedBrand}.pdf`);
  };

  // Save Estimate record to Database (MongoDB or fallback JSON)
  const saveEstimateToDb = async () => {
    setSaveStatus('saving');
    const estimatePayload = {
      address: locationName,
      coordinates,
      roofArea: calculatedArea,
      brand: selectedBrand,
      panelsCount,
      tilt,
      azimuth,
      shading,
      utilityRate,
      monthlyBill,
      systemCapacityKw,
      annualSolarProductionKwh,
      netInvestmentCost,
      paybackPeriod: projections.paybackYear,
      co2SavingsMetricTons
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/estimates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estimatePayload)
      });
      if (response.ok) {
        const result = await response.json();
        setSavedId(result.id || result._id);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        throw new Error('Server returned error response code');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  // Send message to backend chatbot
  const handleChatSubmit = async (e, textOverride = '') => {
    if (e) e.preventDefault();
    const query = textOverride || chatInput;
    if (!query.trim()) return;

    // Add user message
    const updatedMessages = [...chatMessages, { sender: 'user', text: query }];
    setChatMessages(updatedMessages);
    setChatInput('');
    setBotTyping(true);

    const chatbotContext = {
      area: calculatedArea,
      brand: activeBrand.name,
      totalCost: upfrontInstallationCost,
      payback: projections.paybackYear,
      monthlySavings,
      annualProduction: annualSolarProductionKwh,
      co2Savings: co2SavingsMetricTons
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: chatbotContext,
          lang: lang
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          text: data.reply,
          suggestions: data.suggestions || []
        }]);
      } else {
        throw new Error('Chatbot response error');
      }
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback local UI reply if server is slow
      setChatMessages(prev => [...prev, {
        sender: 'bot',
        text: "I am having trouble talking to my server, but based on your design, solar panel systems offer incredible ROI in Tunisia! Let me know if you want to compare Sun Energy, Saphir Solar, or EcoSolar.",
        suggestions: ['Compare Tunisian brands', 'Calculate my roof']
      }]);
    } finally {
      setBotTyping(false);
    }
  };

  // Chart 1 Options and Data: 25-Year Cumulative Savings
  const cumulativeChartData = {
    labels: projections.years.map(y => `Yr ${y}`),
    datasets: [
      {
        label: 'Solar Investment Path (DT)',
        data: projections.cumulativeSolarSavings,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: '#f59e0b',
      },
      {
        label: 'Utility Cost Without Solar (DT)',
        data: projections.cumulativeUtilityCost,
        borderColor: '#9ca3af',
        backgroundColor: 'transparent',
        borderDash: [6, 4],
        tension: 0.3,
        borderWidth: 2,
        pointBackgroundColor: '#9ca3af',
      }
    ]
  };

  const cumulativeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#f3f4f6', font: { family: 'Plus Jakarta Sans', size: 11 } }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()} DT`
        }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
    }
  };

  // Chart 2 Options and Data: Monthly Solar Output vs average usage
  const avgMonthlyConsumption = Math.round(annualConsumptionKwh / 12);
  const monthlyChartData = {
    labels: solarIrradiance.monthlyIrradiance.map((m, idx) => MONTHS_LOCALIZED[lang][idx]),
    datasets: [
      {
        label: 'Solar Output (kWh)',
        data: solarIrradiance.monthlyIrradiance.map(m => {
          // Multiply total monthly solar capacity scaling from daily sun hours
          const monthlyOutput = systemCapacityKw * m.irradiance * 30 * efficiencyMultiplier * shadingFactor;
          return Math.round(monthlyOutput);
        }),
        backgroundColor: 'rgba(245, 158, 11, 0.75)',
        borderRadius: 6,
        hoverBackgroundColor: '#f59e0b',
      },
      {
        label: 'House Consumption (kWh)',
        data: Array(12).fill(avgMonthlyConsumption),
        backgroundColor: 'rgba(59, 130, 246, 0.35)',
        borderRadius: 4,
        type: 'bar',
      }
    ]
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#f3f4f6', font: { family: 'Plus Jakarta Sans', size: 11 } }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
    }
  };

  return (
    <div className="app-container" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="logo-section">
            <Sun className="logo-icon" size={32} />
            <span className="logo-text">SolarSun</span>
          </div>

          <div className="lang-selector">
            <button className={`lang-btn ${lang === 'ar' ? 'active' : ''}`} onClick={() => setLang('ar')}>AR</button>
            <button className={`lang-btn ${lang === 'fr' ? 'active' : ''}`} onClick={() => setLang('fr')}>FR</button>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          </div>
          
          <nav className="nav-steps">
            <button 
              className={`step-item ${activeStep === 0 ? 'active' : ''}`}
              onClick={() => setActiveStep(0)}
            >
              <div className="step-number">1</div>
              <div className="step-label">
                {t('step1Name')}
                <span>{t('step1Desc')}</span>
              </div>
            </button>

            <button 
              className={`step-item ${activeStep === 1 ? 'active' : ''}`}
              disabled={calculatedArea === 0}
              onClick={() => setActiveStep(1)}
            >
              <div className="step-number">2</div>
              <div className="step-label">
                {t('step2Name')}
                <span>{t('step2Desc')}</span>
              </div>
            </button>

            <button 
              className={`step-item ${activeStep === 2 ? 'active' : ''}`}
              disabled={panelsCount === 0}
              onClick={() => setActiveStep(2)}
            >
              <div className="step-number">3</div>
              <div className="step-label">
                {t('step3Name')}
                <span>{t('step3Desc')}</span>
              </div>
            </button>

            <button 
              className={`step-item ${activeStep === 3 ? 'active' : ''}`}
              disabled={panelsCount === 0}
              onClick={() => setActiveStep(3)}
            >
              <div className="step-number">4</div>
              <div className="step-label">
                {t('step4Name')}
                <span>{t('step4Desc')}</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <p>© 2026 SolarSun SaaS Inc.</p>
          <p>Version 1.2.0 (Active)</p>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {/* Step 1: Location & Roof Map drawing */}
        {activeStep === 0 && (
          <div className="fade-in">
            <header>
              <h1 className="header-title">{t('title')}</h1>
              <p className="header-subtitle">{t('subtitle')}</p>
            </header>

            <div className="glass-panel">
              <form onSubmit={handleAddressSearch} className="search-container">
                <input 
                  type="text" 
                  className="input-glow" 
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn-primary" disabled={searchLoading}>
                  {searchLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <>
                      <MapPin size={18} />
                      {t('searchBtn')}
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={getUserRealLocation}
                  disabled={searchLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                >
                  <Compass size={18} />
                  {t('locateBtn')}
                </button>
              </form>

              <div className="map-outer">
                <div id="map" className="map-container"></div>
                
                <div className="map-overlay">
                  <button 
                    className={`map-control-btn ${mapLayer === 'satellite' ? 'active' : ''}`}
                    onClick={() => toggleMapLayer('satellite')}
                  >
                    Satellite View
                  </button>
                  <button 
                    className={`map-control-btn ${mapLayer === 'street' ? 'active' : ''}`}
                    onClick={() => toggleMapLayer('street')}
                  >
                    Street Map
                  </button>
                  <button 
                    className="map-control-btn" 
                    onClick={undoLastPoint}
                    disabled={mapPoints.length === 0}
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                  >
                    <Undo size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    {t('undoBtn')}
                  </button>
                  <button 
                    className="map-control-btn" 
                    onClick={clearDrawing}
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                  >
                    <Trash2 size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    {t('resetBtn')}
                  </button>
                </div>

                {isDrawing && mapPoints.length === 0 && (
                  <div className="map-instruction-banner">
                    <div className="pulse-indicator"></div>
                    <span>{t('instClick')}</span>
                  </div>
                )}
              </div>

              <div className="map-stats-row">
                <div className="stat-card">
                  <div className="stat-card-icon">
                    <Maximize2 size={24} />
                  </div>
                  <div className="stat-card-info">
                    <h4>{t('area')}</h4>
                    <div className="area-input-wrapper">
                      <input 
                        type="number" 
                        className="area-input" 
                        value={calculatedArea} 
                        onChange={(e) => setCalculatedArea(parseFloat(e.target.value) || 0)} 
                      />
                      <span>m²</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon gold">
                    <Layers2 size={24} />
                  </div>
                  <div className="stat-card-info">
                    <h4>{t('maxPanels')}</h4>
                    <p>{panelsCount} <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{t('units')}</span></p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>
                    <Sun size={24} />
                  </div>
                  <div className="stat-card-info" style={{ width: '100%' }}>
                    <h4>{t('avgPeak')}</h4>
                    
                    {/* 1. Peak Sun Hours (Usable energy) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{lang === 'ar' ? 'ساعات الذروة (طاقة):' : lang === 'fr' ? 'Heures de crête (Énergie) :' : 'Peak Sun Hours (Energy):'}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fbbf24' }}>
                        {solarIrradiance.averageDailyPeakHours.toFixed(1)}h
                      </span>
                    </div>

                    {/* 2. Daylight Hours (Astronomical sunrise-sunset) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{lang === 'ar' ? 'ساعات النهار (شروق - غروب):' : lang === 'fr' ? 'Heures de jour (Lever - Coucher) :' : 'Daylight Hours (Sunrise - Sunset):'}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#60a5fa' }}>
                        {solarIrradiance.averageDaylightHours.toFixed(1)}h
                      </span>
                    </div>

                    {/* Seasonal fluctuations */}
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '6px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>☀️ {lang === 'ar' ? 'الصيف:' : lang === 'fr' ? 'Été :' : 'Summer:'} {Math.max(...solarIrradiance.monthlyIrradiance.map(m => m.irradiance)).toFixed(1)}h / {Math.max(...solarIrradiance.monthlyIrradiance.map(m => m.daylightHours || 12)).toFixed(1)}h</span>
                      <span>❄️ {lang === 'ar' ? 'الشتاء:' : lang === 'fr' ? 'Hiver :' : 'Winter:'} {Math.min(...solarIrradiance.monthlyIrradiance.map(m => m.irradiance)).toFixed(1)}h / {Math.min(...solarIrradiance.monthlyIrradiance.map(m => m.daylightHours || 12)).toFixed(1)}h</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button 
                  className="btn-primary" 
                  disabled={calculatedArea === 0}
                  onClick={() => setActiveStep(1)}
                >
                  {t('step2Name')}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Compare Solar Brands */}
        {activeStep === 1 && (
          <div className="fade-in">
            <header>
              <h1 className="header-title">{t('brandTitle')}</h1>
              <p className="header-subtitle">{t('brandSubtitle')}</p>
            </header>

            <div className="glass-panel">
              <div className="grid-2col">
                <div>
                  <h3 style={{ marginBottom: '1.25rem', fontFamily: 'Outfit' }}>{t('brandSelectTitle')}</h3>
                  <div className="brand-select-grid">
                    {Object.values(BRANDS).map((b) => (
                      <div 
                        key={b.key} 
                        className={`brand-card ${selectedBrand === b.key ? 'selected' : ''}`}
                        onClick={() => setSelectedBrand(b.key)}
                      >
                        <div className="brand-header">
                          <span className="brand-name">{b.name}</span>
                          <span className="brand-cost-tag">{b.costPerPanel} DT/{t('units')}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.75rem' }}>{b.quality}</p>
                        <div className="brand-specs">
                          <div className="brand-spec-item">
                            Efficiency
                            <strong>{b.efficiency}%</strong>
                          </div>
                          <div className="brand-spec-item">
                            Degradation
                            <strong>{b.degradation}%/yr</strong>
                          </div>
                          <div className="brand-spec-item">
                            Warranty
                            <strong>{b.warranty} yrs</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ marginBottom: '1.25rem', fontFamily: 'Outfit' }}>{t('brandSpecsTitle')}</h3>
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <Award size={32} style={{ color: activeBrand.color }} />
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{activeBrand.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{activeBrand.quality}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: '#9ca3af' }}>{t('powerTitle')}</span>
                        <strong style={{ color: activeBrand.color }}>{activeBrand.power} Watts</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: '#9ca3af' }}>{t('qtyProposed')}</span>
                        <span>{panelsCount} {t('units')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: '#9ca3af' }}>{t('capacitySize')}</span>
                        <span>{systemCapacityKw.toFixed(2)} kWp</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: '#9ca3af' }}>{t('warrantyTitle')}</span>
                        <span>{activeBrand.warranty} Years (Guaranteed)</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.4 }}>
                      <ShieldCheck size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span>{t('performanceYr25')}: {((1 - (activeBrand.degradation * 25 / 100)) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button className="btn-secondary" onClick={() => setActiveStep(0)}>
                  {t('btnBack')}
                </button>
                <button className="btn-primary" onClick={() => setActiveStep(2)}>
                  {t('btnAdjustROI')}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Shading & Economics */}
        {activeStep === 2 && (
          <div className="fade-in">
            <header>
              <h1 className="header-title">{t('siteTitle')}</h1>
              <p className="header-subtitle">{t('brandSubtitle')}</p>
            </header>

            <div className="glass-panel">
              <div className="grid-2col">
                <div>
                  <h3 style={{ marginBottom: '1.25rem', fontFamily: 'Outfit' }}>Site Configuration</h3>
                  
                  <div className="slider-group">
                    <div className="slider-header">
                      <span>{t('siteTilt')}</span>
                      <span className="slider-val">{tilt}°</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="60" 
                      className="slider-input" 
                      value={tilt} 
                      onChange={(e) => setTilt(parseInt(e.target.value))}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>Optimal angle matches your latitude (~30°-35°).</span>
                  </div>

                  <div className="slider-group">
                    <div className="slider-header">
                      <span>{t('siteAzimuth')}</span>
                      <span className="slider-val">{azimuth}° ({azimuth === 180 ? 'South' : azimuth > 180 ? 'West' : 'East'})</span>
                    </div>
                    <input 
                      type="range" 
                      min="90" 
                      max="270" 
                      className="slider-input" 
                      value={azimuth} 
                      onChange={(e) => setAzimuth(parseInt(e.target.value))}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>180° is South (optimal). 90° is East, 270° is West.</span>
                  </div>

                  <div className="slider-group">
                    <div className="slider-header">
                      <span>{t('siteShading')}</span>
                      <span className="slider-val">{shading}% Shaded</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="60" 
                      className="slider-input" 
                      value={shading} 
                      onChange={(e) => setShading(parseInt(e.target.value))}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>Accounts for surrounding trees, structures, or chimneys.</span>
                  </div>
                </div>

                <div>
                  <h3 style={{ marginBottom: '1.25rem', fontFamily: 'Outfit' }}>STEG Utility & Consumption Profile</h3>

                  <div className="slider-group">
                    <div className="slider-header">
                      <span>{t('utilityBill')}</span>
                      <span className="slider-val">{monthlyBill} DT / month</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="800" 
                      step="10"
                      className="slider-input" 
                      value={monthlyBill} 
                      onChange={(e) => setMonthlyBill(parseInt(e.target.value))}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>Helps size system capacity matches to load.</span>
                  </div>

                  <div className="slider-group">
                    <div className="slider-header">
                      <span>{t('utilityRate')}</span>
                      <span className="slider-val">{utilityRate.toFixed(3)} DT</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.150" 
                      max="0.450" 
                      step="0.005"
                      className="slider-input" 
                      value={utilityRate} 
                      onChange={(e) => setUtilityRate(parseFloat(e.target.value))}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>Typical Basse Tension residential tariff tiers in Tunisia.</span>
                  </div>

                  <div style={{ background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)', padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Compass size={24} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.4 }}>
                      {t('anmeSubNotice')}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button className="btn-secondary" onClick={() => setActiveStep(1)}>
                  {t('btnBack')}
                </button>
                <button className="btn-primary" onClick={triggerDashboard}>
                  <Sparkles size={18} />
                  {t('btnCalculate')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Final Dashboard ROI Panel */}
        {activeStep === 3 && (
          <div className="fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 className="header-title">Solar ROI Analysis Dashboard</h1>
                <p className="header-subtitle">Location: {locationName}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-secondary" onClick={saveEstimateToDb} disabled={saveStatus === 'saving'}>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved! ✓' : t('saveBtn')}
                </button>
                <button className="btn-primary" onClick={downloadPDFReport}>
                  <Download size={18} />
                  {t('pdfBtn')}
                </button>
              </div>
            </header>

            {/* Dashboard Statistics KPIs */}
            <div className="dashboard-grid">
              <div className="metric-box highlight">
                <div className="metric-box-icon">
                  <Calendar size={20} />
                </div>
                <div className="metric-title">{t('kpiPayback')}</div>
                <div className="metric-value" style={{ color: '#f59e0b' }}>{projections.paybackYear} Yrs</div>
                <div className="metric-subtitle">System break-even point</div>
              </div>

              <div className="metric-box">
                <div className="metric-box-icon">
                  <CircleDollarSign size={20} />
                </div>
                <div className="metric-title">{t('kpiCost')}</div>
                <div className="metric-value">{netInvestmentCost.toLocaleString()} DT</div>
                <div className="metric-subtitle">After 20% ANME Subsidy</div>
              </div>

              <div className="metric-box">
                <div className="metric-box-icon">
                  <Zap size={20} />
                </div>
                <div className="metric-title">{t('kpiProduction')}</div>
                <div className="metric-value">{annualSolarProductionKwh.toLocaleString()} <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>kWh</span></div>
                <div className="metric-subtitle">Estimated yearly output</div>
              </div>

              <div className="metric-box">
                <div className="metric-box-icon">
                  <TrendingUp size={20} />
                </div>
                <div className="metric-title">{t('kpiSavings')}</div>
                <div className="metric-value green">{Math.round(projections.cumulativeSolarSavings[24] - netInvestmentCost).toLocaleString()} DT</div>
                <div className="metric-subtitle">{t('kpiSavingsDesc')}</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-title">{t('chartROI')}</span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Compared against Utility costs with 3.5% inflation</span>
                </div>
                <div className="chart-canvas-wrapper">
                  <Line data={cumulativeChartData} options={cumulativeChartOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-title">{t('chartMonthly')}</span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t('chartMonthlyDesc')}</span>
                </div>
                <div className="chart-canvas-wrapper">
                  <Bar data={monthlyChartData} options={monthlyChartOptions} />
                </div>
              </div>
            </div>

            {/* Bottom Row: Environmental offset details */}
            <div className="glass-panel" style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Leaf size={24} style={{ color: '#10b981' }} />
                {t('ecoTitle')}
              </h3>

              <div className="eco-grid">
                <div className="eco-item">
                  <div className="eco-icon">
                    <Leaf size={24} />
                  </div>
                  <div className="eco-details">
                    <h5>{co2SavingsMetricTons} Tons</h5>
                    <p>{t('ecoCO2')}</p>
                  </div>
                </div>

                <div className="eco-item">
                  <div className="eco-icon">
                    <Sun size={24} />
                  </div>
                  <div className="eco-details">
                    <h5>{treesPlantedEquivalent} Trees</h5>
                    <p>{t('ecoTrees')}</p>
                  </div>
                </div>

                <div className="eco-item">
                  <div className="eco-icon">
                    <TrendingUp size={24} />
                  </div>
                  <div className="eco-details">
                    <h5>{gasMilesAvoided.toLocaleString()} Miles</h5>
                    <p>{t('ecoMiles')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => setActiveStep(2)}>
                {t('btnBack')}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Chatbot Assistant */}
      <div className="chatbot-container">
        {chatOpen && (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <div className="chatbot-avatar">
                <Sparkles size={20} />
              </div>
              <div className="chatbot-header-info">
                <h4>{t('botTitle')}</h4>
                <p>
                  <span className="online-dot"></span>
                  {t('botActiveExpert')}
                </p>
              </div>
              <button 
                onClick={() => setChatOpen(false)} 
                style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="chatbot-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className={`chat-msg ${msg.sender === 'bot' ? 'bot' : 'user'}`}>
                    {msg.text.split('\n').map((line, lidx) => (
                      <p key={lidx} style={{ marginBottom: line.startsWith('*') ? '0.25rem' : '0.5rem' }}>{line}</p>
                    ))}
                  </div>
                  {msg.sender === 'bot' && msg.suggestions && (
                    <div className="chatbot-suggestions" style={{ paddingLeft: 0, paddingRight: 0, marginTop: '4px' }}>
                      {msg.suggestions.map((s, sidx) => (
                        <button 
                          key={sidx} 
                          className="suggestion-pill"
                          onClick={(e) => handleChatSubmit(e, s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {botTyping && (
                <div className="chat-msg bot" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div className="loading-spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></div>
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={chatEndRef}></div>
            </div>

            <form onSubmit={(e) => handleChatSubmit(e)} className="chatbot-input-area">
              <input 
                type="text" 
                className="chat-input" 
                placeholder={t('botPlaceholder')}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="chat-send-btn">
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        <button 
          className={`chatbot-bubble-trigger ${chatOpen ? 'active' : ''}`}
          onClick={() => setChatOpen(!chatOpen)}
        >
          {chatOpen ? <X size={26} /> : <MessageSquare size={26} />}
        </button>
      </div>
    </div>
  );
}

export default App;
