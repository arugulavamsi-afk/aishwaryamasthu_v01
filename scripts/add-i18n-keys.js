// scripts/add-i18n-keys.js
// Adds all missing translation keys for every untranslated tool panel.

const fs   = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '../public/js/i18n.js');

// New keys per language — {key: {en, hi, te, ta}}
const KEYS = {
  // ── Common ──────────────────────────────────────────────────────────────
  'common.reset':              { en:'Reset',            hi:'रीसेट',           te:'రీసెట్',                ta:'மீட்டமை' },
  'common.quickscen':          { en:'Quick Scenarios',  hi:'त्वरित परिदृश्य', te:'శీఘ్ర దృశ్యాలు',       ta:'விரைவு காட்சிகள்' },

  // ── Insurance Adequacy ───────────────────────────────────────────────────
  'page.insure.sub':           { en:'HLV method · Health ₹35L+ · Critical Illness ₹25–50L · Disability income · Senior parent floater', hi:'HLV पद्धति · स्वास्थ्य ₹35L+ · CI ₹25-50L · विकलांगता आय · वरिष्ठ माता-पिता फ्लोटर', te:'HLV పద్ధతి · ఆరోగ్యం ₹35L+ · CI ₹25-50L · వైకల్య ఆదాయం · వరిష్ఠ తల్లిదండ్రుల ఫ్లోటర్', ta:'HLV முறை · சுகாதாரம் ₹35L+ · CI ₹25-50L · மாற்றுத்திறன் வருமானம் · மூத்தோர் ஃப்ளோட்டர்' },
  'insure.sec.profile':        { en:'Your Profile',           hi:'आपकी प्रोफ़ाइल',    te:'మీ ప్రొఫైల్',           ta:'உங்கள் சுயவிவரம்' },
  'insure.sec.advanced':       { en:'Critical Illness · Disability · Parents', hi:'क्रिटिकल इलनेस · विकलांगता · माता-पिता', te:'క్రిటికల్ ఇల్నెస్ · వైకల్యం · తల్లిదండ్రులు', ta:'தீவிர நோய் · மாற்றுத்திறன் · பெற்றோர்' },
  'insure.lbl.income':         { en:'Annual Income (₹)',      hi:'वार्षिक आय (₹)',     te:'వార్షిక ఆదాయం (₹)',     ta:'வருடாந்திர வருமானம் (₹)' },
  'insure.lbl.age':            { en:'Age (yrs)',               hi:'उम्र (वर्ष)',         te:'వయసు (సం.)',             ta:'வயது (ஆண்டு)' },
  'insure.lbl.dependents':     { en:'Dependents',              hi:'आश्रित',              te:'ఆధారపడిన వ్యక్తులు',   ta:'சார்பினர்' },
  'insure.lbl.loans':          { en:'Outstanding Loans (₹)',  hi:'बकाया ऋण (₹)',       te:'పెండింగ్ రుణాలు (₹)',  ta:'நிலுவை கடன்கள் (₹)' },
  'insure.lbl.term_cover':     { en:'Current Term Cover (₹)', hi:'वर्तमान टर्म कवर (₹)', te:'ప్రస్తుత టర్మ్ కవర్ (₹)', ta:'தற்போதைய டேர்ம் கவர் (₹)' },
  'insure.lbl.health_cover':   { en:'Current Health Cover (₹)', hi:'वर्तमान स्वास्थ्य कवर (₹)', te:'ప్రస్తుత హెల్త్ కవర్ (₹)', ta:'தற்போதைய சுகாதார கவர் (₹)' },
  'insure.lbl.monthly_exp':    { en:'Monthly Expenses (₹)',   hi:'मासिक खर्च (₹)',     te:'నెలసరి ఖర్చులు (₹)',    ta:'மாதாந்திர செலவுகள் (₹)' },
  'insure.lbl.family_size':    { en:'Family Size (health)',   hi:'परिवार का आकार',     te:'కుటుంబ పరిమాణం',        ta:'குடும்ப அளவு' },
  'insure.lbl.liquid_assets':  { en:'Liquid Assets (₹)',      hi:'तरल संपत्ति (₹)',    te:'లిక్విడ్ అసెట్స్ (₹)', ta:'பணரீதியான சொத்துகள் (₹)' },
  'insure.lbl.ci_cover':       { en:'Current CI Cover (₹)',   hi:'वर्तमान CI कवर (₹)', te:'ప్రస్తుత CI కవర్ (₹)', ta:'தற்போதைய CI கவர் (₹)' },
  'insure.lbl.disability':     { en:'Disability Cover (₹)',   hi:'विकलांगता कवर (₹)', te:'వైకల్య కవర్ (₹)',       ta:'மாற்றுத்திறன் கவர் (₹)' },
  'insure.lbl.parents_cover':  { en:"Parents' Health Cover (₹)", hi:'माता-पिता का हेल्थ कवर (₹)', te:'తల్లిదండ్రుల హెల్త్ కవర్ (₹)', ta:'பெற்றோர் சுகாதார கவர் (₹)' },
  'insure.lbl.parent1_age':    { en:'Parent 1 Age (yrs)',      hi:'माता-पिता 1 की उम्र (वर्ष)', te:'తల్లిదండ్రులు 1 వయసు (సం.)', ta:'பெற்றோர் 1 வயது (ஆண்.)' },
  'insure.lbl.parent2_age':    { en:'Parent 2 Age (yrs)',      hi:'माता-पिता 2 की उम्र (वर्ष)', te:'తల్లిదండ్రులు 2 వయసు (సం.)', ta:'பெற்றோர் 2 வயது (ஆண்.)' },
  'res.insure.term_req':       { en:'Required Term Cover',    hi:'आवश्यक टर्म कवर',   te:'అవసరమైన టర్మ్ కవర్',   ta:'தேவையான டேர்ம் கவர்' },
  'res.insure.health_req':     { en:'Required Health Cover',  hi:'आवश्यक स्वास्थ्य कवर', te:'అవసరమైన హెల్త్ కవర్', ta:'தேவையான சுகாதார கவர்' },
  'res.insure.ci':             { en:'Critical Illness',       hi:'क्रिटिकल इलनेस',    te:'క్రిటికల్ ఇల్నెస్',   ta:'தீவிர நோய்' },
  'res.insure.disability':     { en:'Disability Cover',       hi:'विकलांगता कवर',      te:'వైకల్య కవర్',           ta:'மாற்றுத்திறன் கவர்' },
  'res.insure.parents':        { en:'Parents Health',         hi:'माता-पिता स्वास्थ्य', te:'తల్లిదండ్రుల ఆరోగ్యం', ta:'பெற்றோர் சுகாதாரம்' },
  'res.insure.hlv_mult':       { en:'HLV Multiple',           hi:'HLV गुणक',            te:'HLV గుణకం',             ta:'HLV பெருக்கி' },
  'res.insure.term_gap':       { en:'Term Gap',               hi:'टर्म गैप',            te:'టర్మ్ గ్యాప్',          ta:'டேர்ம் இடைவெளி' },
  'res.insure.health_gap':     { en:'Health Gap',             hi:'स्वास्थ्य गैप',      te:'హెల్త్ గ్యాప్',        ta:'சுகாதார இடைவெளி' },
  'res.insure.term_prem':      { en:'Est. Term Premium',      hi:'अनुमानित टर्म प्रीमियम', te:'అంచనా టర్మ్ ప్రీమియం', ta:'அனுமான டேர்ம் ப்ரீமியம்' },
  'res.insure.ci_gap':         { en:'CI Gap',                 hi:'CI गैप',              te:'CI గ్యాప్',             ta:'CI இடைவெளி' },
  'res.insure.parents_prem':   { en:'Parents Premium',        hi:'माता-पिता प्रीमियम', te:'తల్లిదండ్రుల ప్రీమియం', ta:'பெற்றோர் ப்ரீமியம்' },
  'insure.work.term':          { en:'📐 How Your Term Cover Is Calculated', hi:'📐 आपका टर्म कवर कैसे गणना होता है', te:'📐 మీ టర్మ్ కవర్ ఎలా లెక్కిస్తారు', ta:'📐 உங்கள் டேர்ம் கவர் கணக்கீடு' },
  'insure.work.health':        { en:'🏥 Health Cover Breakdown', hi:'🏥 स्वास्थ्य कवर विवरण', te:'🏥 హెల్త్ కవర్ వివరణ', ta:'🏥 சுகாதார கவர் விவரம்' },
  'insure.work.ci':            { en:'🎗️ Critical Illness + Disability', hi:'🎗️ क्रिटिकल इलनेस + विकलांगता', te:'🎗️ క్రిటికల్ ఇల్నెస్ + వైకల్యం', ta:'🎗️ தீவிர நோய் + மாற்றுத்திறன்' },
  'insure.work.parents':       { en:"👴 Parents' Health Cover", hi:'👴 माता-पिता का हेल्थ कवर', te:'👴 తల్లిదండ్రుల హెల్త్ కవర్', ta:'👴 பெற்றோர் சுகாதார கவர்' },
  'insure.rules':              { en:'📌 India Insurance Adequacy Rules', hi:'📌 भारत बीमा पर्याप्तता नियम', te:'📌 భారత్ బీమా నియమాలు', ta:'📌 இந்திய காப்பீட்டு விதிகள்' },

  // ── PPF & NPS ────────────────────────────────────────────────────────────
  'ppf.sec.inputs':            { en:'PPF Inputs',                    hi:'PPF विवरण',            te:'PPF వివరాలు',          ta:'PPF விவரங்கள்' },
  'lbl.ppf.annual':            { en:'Annual Contribution (₹)',        hi:'वार्षिक योगदान (₹)',   te:'వార్షిక చందా (₹)',     ta:'வருடாந்திர பங்களிப்பு (₹)' },
  'lbl.ppf.balance':           { en:'Current PPF Balance (₹)',        hi:'वर्तमान PPF बैलेंस (₹)', te:'ప్రస్తుత PPF బ్యాలెన్స్ (₹)', ta:'தற்போதைய PPF இருப்பு (₹)' },
  'lbl.ppf.years_done':        { en:'Years Already Invested',         hi:'अब तक के निवेश वर्ष', te:'ఇప్పటివరకు పెట్టుబడి సంవత్సరాలు', ta:'ஏற்கனவே முதலீடு செய்த ஆண்டுகள்' },
  'lbl.ppf.rate':              { en:'Interest Rate (%)',               hi:'ब्याज दर (%)',         te:'వడ్డీ రేటు (%)',        ta:'வட்டி விகிதம் (%)' },
  'lbl.ppf.extend':            { en:'Extension After 15 Yrs (blocks of 5)', hi:'15 वर्ष बाद विस्तार (5 के ब्लॉक)', te:'15 సం. తర్వాత పొడిగింపు (5 బ్లాకులు)', ta:'15 ஆண்டுகளுக்கு பிறகு நீட்டிப்பு' },
  'res.ppf.maturity':          { en:'Maturity Value',                 hi:'परिपक्वता मूल्य',      te:'మెచ్యూరిటీ విలువ',     ta:'முதிர்வு மதிப்பு' },
  'res.ppf.interest':          { en:'Total Interest',                 hi:'कुल ब्याज',            te:'మొత్తం వడ్డీ',          ta:'மொத்த வட்டி' },
  'res.ppf.invested':          { en:'Total Invested',                 hi:'कुल निवेश',            te:'మొత్తం పెట్టుబడి',      ta:'மொத்த முதலீடு' },
  'ppf.tbl.title':             { en:'📋 PPF Year-by-Year Passbook',   hi:'📋 PPF वार्षिक पासबुक', te:'📋 PPF వార్షిక పాస్‌బుక్', ta:'📋 PPF வருடாந்திர பாஸ்புக்' },
  'ppf.rules':                 { en:'📌 PPF Key Rules',               hi:'📌 PPF मुख्य नियम',    te:'📌 PPF ముఖ్య నియమాలు',  ta:'📌 PPF முக்கிய விதிகள்' },
  'nps.sec.inputs':            { en:'NPS Inputs',                    hi:'NPS विवरण',            te:'NPS వివరాలు',          ta:'NPS விவரங்கள்' },
  'lbl.nps.monthly':           { en:'Monthly Contribution (₹)',       hi:'मासिक योगदान (₹)',     te:'నెలసరి చందా (₹)',      ta:'மாதாந்திர பங்களிப்பு (₹)' },
  'lbl.nps.age':               { en:'Current Age (yrs)',              hi:'वर्तमान उम्र (वर्ष)', te:'ప్రస్తుత వయసు (సం.)', ta:'தற்போதைய வயது (ஆண்.)' },
  'lbl.nps.balance':           { en:'Current NPS Balance (₹)',        hi:'वर्तमान NPS बैलेंस (₹)', te:'ప్రస్తుత NPS బ్యాలెన్స్ (₹)', ta:'தற்போதைய NPS இருப்பு (₹)' },
  'lbl.nps.return':            { en:'Expected Return (%/yr)',          hi:'अपेक्षित रिटर्न (%/वर्ष)', te:'అంచనా రాబడి (%/సం.)', ta:'எதிர்பார்க்கும் வருவாய் (%/ஆண்.)' },
  'lbl.nps.annuity':           { en:'Annuity Rate (%/yr)',            hi:'एन्यूटी दर (%/वर्ष)',  te:'యాన్యుటీ రేటు (%/సం.)', ta:'வருடாந்திர விகிதம் (%/ஆண்.)' },
  'lbl.nps.regime':            { en:'Tax Regime',                    hi:'कर व्यवस्था',          te:'పన్ను విధానం',          ta:'வரி ஆட்சி' },
  'lbl.nps.slab':              { en:'Your Tax Slab',                 hi:'आपका कर स्लैब',        te:'మీ పన్ను స్లాబ్',       ta:'உங்கள் வரி அடுக்கு' },
  'res.nps.corpus':            { en:'Total NPS Corpus',              hi:'कुल NPS कोष',           te:'మొత్తం NPS కార్పస్',    ta:'மொத்த NPS கார்பஸ்' },
  'res.nps.lumpsum':           { en:'Tax-Free Lumpsum (60%)',         hi:'कर-मुक्त एकमुश्त (60%)', te:'పన్ను-రహిత ఏకమొత్తం (60%)', ta:'வரி-இல்லாத ஒட்டுமொத்தம் (60%)' },
  'res.nps.pension':           { en:'Monthly Pension',               hi:'मासिक पेंशन',           te:'నెలసరి పెన్షన్',        ta:'மாதாந்திர பென்ஷன்' },
  'nps.rules':                 { en:'📌 NPS Key Rules',              hi:'📌 NPS मुख्य नियम',    te:'📌 NPS ముఖ్య నియమాలు',  ta:'📌 NPS முக்கிய விதிகள்' },

  // ── CTC Optimizer ────────────────────────────────────────────────────────
  'ctc.sec.structure':         { en:'Your CTC & Structure',          hi:'आपका CTC और संरचना',   te:'మీ CTC & నిర్మాణం',      ta:'உங்கள் CTC & அமைப்பு' },
  'lbl.ctc.annual':            { en:'Annual CTC (₹)',                hi:'वार्षिक CTC (₹)',       te:'వార్షిక CTC (₹)',        ta:'வருடாந்திர CTC (₹)' },
  'lbl.ctc.basic':             { en:'Basic Salary (₹/mo)',           hi:'मूल वेतन (₹/माह)',     te:'ప్రాథమిక జీతం (₹/నెల)', ta:'அடிப்படை சம்பளம் (₹/மாதம்)' },
  'lbl.ctc.regime':            { en:'Tax Regime',                   hi:'कर व्यवस्था',          te:'పన్ను విధానం',           ta:'வரி ஆட்சி' },
  'lbl.ctc.hra':               { en:'HRA (₹/mo)',                   hi:'HRA (₹/माह)',           te:'HRA (₹/నెల)',            ta:'HRA (₹/மாதம்)' },
  'lbl.ctc.rent':              { en:'Monthly Rent Paid (₹)',         hi:'मासिक किराया (₹)',     te:'నెలసరి అద్దె (₹)',       ta:'மாதாந்திர வாடகை (₹)' },
  'lbl.ctc.city':              { en:'City Type',                    hi:'शहर का प्रकार',        te:'నగర రకం',                ta:'நகர வகை' },
  'lbl.ctc.lta':               { en:'LTA (₹/yr)',                   hi:'LTA (₹/वर्ष)',         te:'LTA (₹/సం.)',             ta:'LTA (₹/ஆண்.)' },
  'lbl.ctc.food':              { en:'Food Coupons (₹/mo)',          hi:'फूड कूपन (₹/माह)',     te:'ఫుడ్ కూపన్లు (₹/నెల)',  ta:'உணவு குப்பன்கள் (₹/மாதம்)' },
  'lbl.ctc.phone':             { en:'Phone/Internet (₹/mo)',        hi:'फोन/इंटरनेट (₹/माह)', te:'ఫోన్/ఇంటర్నెట్ (₹/నెల)', ta:'தொலைபேசி/இணையம் (₹/மாதம்)' },
  'lbl.ctc.emp_nps':           { en:'Employer NPS (% of basic)',    hi:'नियोक्ता NPS (मूल का %)', te:'యజమాని NPS (ప్రాథమికంలో %)', ta:'முதலாளி NPS (அடிப்படையில் %)' },
  'lbl.ctc.80c':               { en:'80C Investments (₹/yr)',       hi:'80C निवेश (₹/वर्ष)',   te:'80C పెట్టుబడులు (₹/సం.)', ta:'80C முதலீடுகள் (₹/ஆண்.)' },
  'res.ctc.takehome':          { en:'Current Monthly Take-Home',    hi:'वर्तमान मासिक टेक-होम', te:'ప్రస్తుత నెలసరి టేక్-హోమ్', ta:'தற்போதைய மாதாந்திர டேக்-ஹோம்' },
  'res.ctc.optimized':         { en:'Optimized Monthly Take-Home',  hi:'अनुकूलित मासिक टेक-होम', te:'అనుకూలిత నెలసరి టేక్-హోమ్', ta:'மேம்படுத்தப்பட்ட மாதாந்திர டேக்-ஹோம்' },
  'res.ctc.annual_tax':        { en:'Annual Tax',                   hi:'वार्षिक कर',            te:'వార్షిక పన్ను',           ta:'வருடாந்திர வரி' },
  'res.ctc.tax_opt':           { en:'Tax After Opt.',               hi:'अनुकूलन के बाद कर',    te:'అనుకూలన తర్వాత పన్ను',  ta:'மேம்படுத்தலுக்கு பிறகு வரி' },
  'res.ctc.eff_rate':          { en:'Effective Tax Rate',           hi:'प्रभावी कर दर',        te:'ప్రభావవంతమైన పన్ను రేటు', ta:'பயனுள்ள வரி விகிதம்' },
  'res.ctc.monthly_saved':     { en:'Monthly Tax Saved',            hi:'मासिक कर बचत',         te:'నెలసరి పన్ను ఆదా',       ta:'மாதாந்திர வரி சேமிப்பு' },
  'ctc.breakup':               { en:'📋 Monthly Salary Breakup',    hi:'📋 मासिक वेतन विवरण',  te:'📋 నెలసరి జీతం వివరణ',   ta:'📋 மாதாந்திர சம்பள விவரம்' },
  'ctc.optimization':          { en:'🚀 Salary Optimization',       hi:'🚀 वेतन अनुकूलन',      te:'🚀 జీతం అనుకూలన',         ta:'🚀 சம்பள மேம்படுத்தல்' },
  'ctc.regime_compare':        { en:'⚖️ Old vs New Regime',         hi:'⚖️ पुरानी बनाम नई व्यवस्था', te:'⚖️ పాత vs కొత్త విధానం', ta:'⚖️ பழைய vs புதிய ஆட்சி' },

  // ── Gratuity ─────────────────────────────────────────────────────────────
  'gratuity.sec.details':      { en:'Your Employment Details',      hi:'आपके रोजगार विवरण',    te:'మీ ఉద్యోగ వివరాలు',     ta:'உங்கள் வேலை விவரங்கள்' },
  'lbl.gratuity.basic':        { en:'Last Drawn Basic + DA (₹/mo)', hi:'अंतिम मूल + DA वेतन (₹/माह)', te:'చివరిగా తీసుకున్న ప్రాథమిక + DA (₹/నెల)', ta:'கடைசியாக பெற்ற அடிப்படை + DA (₹/மாதம்)' },
  'lbl.gratuity.years':        { en:'Years of Service',             hi:'सेवा वर्ष',             te:'సేవా సంవత్సరాలు',        ta:'சேவை ஆண்டுகள்' },
  'lbl.gratuity.months':       { en:'Extra Months',                 hi:'अतिरिक्त महीने',        te:'అదనపు నెలలు',            ta:'கூடுதல் மாதங்கள்' },
  'lbl.gratuity.type':         { en:'Employer Type',                hi:'नियोक्ता प्रकार',       te:'యజమాని రకం',             ta:'முதலாளி வகை' },
  'lbl.gratuity.regime':       { en:'Tax Regime',                   hi:'कर व्यवस्था',          te:'పన్ను విధానం',           ta:'வரி ஆட்சி' },
  'lbl.gratuity.slab':         { en:'Tax Slab (on excess above ₹25L)', hi:'कर स्लैब (₹25L से अधिक पर)', te:'పన్ను స్లాబ్ (₹25L మించిన పైన)', ta:'வரி அடுக்கு (₹25L மேல்)' },
  'res.gratuity.gross':        { en:'Gross Gratuity',               hi:'सकल ग्रेच्युटी',        te:'స్థూల గ్రాచ్యుటీ',       ta:'மொத்த கிராட்டுயிட்டி' },
  'res.gratuity.taxfree':      { en:'Tax-Free Amount',              hi:'कर-मुक्त राशि',        te:'పన్ను-రహిత మొత్తం',      ta:'வரி-இல்லாத தொகை' },
  'res.gratuity.net':          { en:'Net In-Hand',                  hi:'नेट इन-हैंड',           te:'నెట్ ఇన్-హ్యాండ్',       ta:'நிகர கையில்' },
  'res.gratuity.service':      { en:'Service Counted',              hi:'गिनी गई सेवा',         te:'లెక్కించిన సేవ',          ta:'கணக்கிடப்பட்ட சேவை' },
  'res.gratuity.tax':          { en:'Tax on Excess',                hi:'अधिक पर कर',           te:'అదనంపై పన్ను',           ta:'அதிகப்படியான வரி' },
  'res.gratuity.per_year':     { en:'Per Year Value',               hi:'प्रति वर्ष मूल्य',     te:'ప్రతి సంవత్సరం విలువ',  ta:'ஆண்டுக்கு மதிப்பு' },
  'res.gratuity.pct':          { en:'% of Annual CTC',              hi:'वार्षिक CTC का %',      te:'వార్షిక CTC లో %',       ta:'வருடாந்திர CTC இல் %' },
  'gratuity.workings':         { en:'📐 Calculation Workings',       hi:'📐 गणना विवरण',         te:'📐 లెక్కింపు వివరాలు',   ta:'📐 கணக்கீடு விவரம்' },
  'gratuity.rules':            { en:'📌 Gratuity Rules Every Employee Must Know', hi:'📌 ग्रेच्युटी नियम', te:'📌 గ్రాచ్యుటీ నియమాలు', ta:'📌 கிராட்டுயிட்டி விதிகள்' },

  // ── Debt Plan ────────────────────────────────────────────────────────────
  'debt.lbl.extra':            { en:'Extra Monthly Prepayment (₹)', hi:'अतिरिक्त मासिक प्रीपेमेंट (₹)', te:'అదనపు నెలసరి ముందస్తు చెల్లింపు (₹)', ta:'கூடுதல் மாதாந்திர முன்கூட்டிய தொகை (₹)' },
  'debt.col.name':             { en:'Loan Name',                    hi:'ऋण का नाम',            te:'రుణం పేరు',              ta:'கடன் பெயர்' },
  'debt.col.balance':          { en:'Balance',                      hi:'बकाया',                 te:'బ్యాలెన్స్',             ta:'இருப்பு' },
  'debt.col.rate':             { en:'Rate %',                       hi:'दर %',                  te:'రేటు %',                 ta:'விகிதம் %' },
  'debt.col.emi':              { en:'EMI/mo',                       hi:'EMI/माह',               te:'EMI/నెల',                ta:'EMI/மாதம்' },
  'res.debt.total':            { en:'Total Debt',                   hi:'कुल ऋण',               te:'మొత్తం అప్పు',           ta:'மொத்த கடன்' },
  'res.debt.saved':            { en:'Interest Saved',               hi:'ब्याज बचत',             te:'వడ్డీ ఆదా',              ta:'வட்டி சேமிப்பு' },
  'res.debt.free_in':          { en:'Debt-Free In',                 hi:'ऋण-मुक्त में',          te:'అప్పు-రహితంగా',          ta:'கடன்-இல்லாமல் ஆக' },
  'debt.priority':             { en:'🎯 Repayment Priority Order',  hi:'🎯 चुकौती प्राथमिकता', te:'🎯 చెల్లింపు ప్రాధాన్యత', ta:'🎯 திருப்பிச் செலுத்தல் முன்னுரிமை' },

  // ── Joint Plan ───────────────────────────────────────────────────────────
  'joint.sec.p1':              { en:'Spouse / Partner 1',           hi:'पति/पत्नी / साथी 1',   te:'జీవిత భాగస్వామి 1',     ta:'வாழ்க்கை துணை 1' },
  'joint.sec.p2':              { en:'Spouse / Partner 2',           hi:'पति/पत्नी / साथी 2',   te:'జీవిత భాగస్వామి 2',     ta:'வாழ்க்கை துணை 2' },
  'lbl.joint.name':            { en:'Name',                         hi:'नाम',                   te:'పేరు',                   ta:'பெயர்' },
  'lbl.joint.income':          { en:'Monthly Gross Income (₹)',     hi:'मासिक सकल आय (₹)',     te:'నెలసరి స్థూల ఆదాయం (₹)', ta:'மாதாந்திர மொத்த வருமானம் (₹)' },
  'lbl.joint.invest_cap':      { en:'Monthly Investment Capacity (₹)', hi:'मासिक निवेश क्षमता (₹)', te:'నెలసరి పెట్టుబడి సామర్థ్యం (₹)', ta:'மாதாந்திர முதலீட்டு திறன் (₹)' },
  'lbl.joint.portfolio':       { en:'Equity MF Portfolio (₹)',      hi:'इक्विटी MF पोर्टफोलियो (₹)', te:'ఈక్విటీ MF పోర్ట్‌ఫోలియో (₹)', ta:'ஈக்விட்டி MF போர்ட்ஃபோலியோ (₹)' },
  'lbl.joint.regime':          { en:'Tax Regime',                   hi:'कर व्यवस्था',          te:'పన్ను విధానం',           ta:'வரி ஆட்சி' },
  'lbl.joint.slab':            { en:'Tax Slab',                     hi:'कर स्लैब',              te:'పన్ను స్లాబ్',           ta:'வரி அடுக்கு' },
  'lbl.joint.80c':             { en:'80C Already Used (₹/yr)',      hi:'80C पहले से उपयोग (₹/वर्ष)', te:'80C ఇప్పటికే వినియోగించిన (₹/సం.)', ta:'80C ஏற்கனவே பயன்படுத்திய (₹/ஆண்.)' },
  'joint.sec.goals':           { en:'Family Goals',                 hi:'पारिवारिक लक्ष्य',     te:'కుటుంబ లక్ష్యాలు',      ta:'குடும்ப இலக்குகள்' },
  'lbl.joint.edu':             { en:"Child's Education",            hi:'बच्चे की शिक्षा',      te:'పిల్లల విద్య',           ta:'குழந்தை கல்வி' },
  'lbl.joint.today_cost':      { en:"Today's Cost (₹)",             hi:'आज की लागत (₹)',        te:'నేటి వ్యయం (₹)',         ta:'இன்றைய செலவு (₹)' },
  'lbl.joint.years_goal':      { en:'Years to Goal',                hi:'लक्ष्य तक वर्ष',        te:'లక్ష్యానికి సంవత్సరాలు', ta:'இலக்கிற்கு ஆண்டுகள்' },
  'lbl.joint.home':            { en:'Home Purchase',                hi:'गृह खरीद',              te:'ఇల్లు కొనుగోలు',        ta:'வீடு வாங்குதல்' },
  'lbl.joint.target_amt':      { en:'Target Amount (₹)',            hi:'लक्ष्य राशि (₹)',       te:'లక్ష్య మొత్తం (₹)',      ta:'இலக்கு தொகை (₹)' },
  'lbl.joint.retire':          { en:'Joint Retirement',             hi:'संयुक्त सेवानिवृत्ति', te:'సంయుక్త పదవీ విరమణ',    ta:'கூட்டு ஓய்வு' },
  'lbl.joint.avg_age':         { en:'Current Avg Age',              hi:'वर्तमान औसत उम्र',     te:'ప్రస్తుత సగటు వయసు',    ta:'தற்போதைய சராசரி வயது' },
  'lbl.joint.monthly_need':    { en:'Monthly Need (₹)',             hi:'मासिक आवश्यकता (₹)',   te:'నెలసరి అవసరం (₹)',       ta:'மாதாந்திர தேவை (₹)' },
  'lbl.joint.return':          { en:'Expected Return (% p.a.)',     hi:'अपेक्षित रिटर्न (% p.a.)', te:'అంచనా రాబడి (% p.a.)', ta:'எதிர்பார்க்கும் வருவாய் (% p.a.)' },
  'res.joint.summary':         { en:'Household Financial Summary',  hi:'पारिवारिक वित्तीय सारांश', te:'కుటుంబ ఆర్థిక సారాంశం', ta:'குடும்ப நிதி சுருக்கம்' },
  'res.joint.ltcg':            { en:'🔑 LTCG Tax Optimization',     hi:'🔑 LTCG कर अनुकूलन',   te:'🔑 LTCG పన్ను అనుకూలన', ta:'🔑 LTCG வரி மேம்படுத்தல்' },
  'res.joint.split':           { en:'📊 Optimal Investment Split',  hi:'📊 इष्टतम निवेश विभाजन', te:'📊 అనుకూల పెట్టుబడి విభజన', ta:'📊 உகந்த முதலீட்டு பிரிப்பு' },

  // ── CIBIL ────────────────────────────────────────────────────────────────
  'cibil.sec.profile':         { en:'Your Credit Profile',         hi:'आपकी क्रेडिट प्रोफाइल', te:'మీ క్రెడిట్ ప్రొఫైల్', ta:'உங்கள் கடன் சுயவிவரம்' },
  'lbl.cibil.score':           { en:'Current CIBIL / Credit Score', hi:'वर्तमान CIBIL / क्रेडिट स्कोर', te:'ప్రస్తుత CIBIL / క్రెడిట్ స్కోర్', ta:'தற்போதைய CIBIL / கடன் மதிப்பெண்' },
  'lbl.cibil.util':            { en:'Credit Utilisation (%)',       hi:'क्रेडिट उपयोग (%)',    te:'క్రెడిట్ వినియోగం (%)',  ta:'கடன் பயன்பாடு (%)' },
  'lbl.cibil.missed':          { en:'Missed EMIs (last 2 yrs)',     hi:'चूके EMI (पिछले 2 वर्ष)', te:'మిస్ అయిన EMI (గత 2 సం.)', ta:'தவறிய EMI (கடந்த 2 ஆண்டுகள்)' },
  'lbl.cibil.age':             { en:'Credit Age (years)',           hi:'क्रेडिट आयु (वर्ष)',   te:'క్రెడిట్ వయసు (సంవత్సరాలు)', ta:'கடன் வயது (ஆண்டுகள்)' },
  'lbl.cibil.cards':           { en:'Active Credit Cards',          hi:'सक्रिय क्रेडिट कार्ड', te:'యాక్టివ్ క్రెడిట్ కార్డులు', ta:'செயல்பாட்டு கடன் அட்டைகள்' },
  'lbl.cibil.enquiries':       { en:'Hard Enquiries (6 mo)',        hi:'हार्ड पूछताछ (6 माह)',  te:'హార్డ్ ఎంక్వైరీలు (6 నెలలు)', ta:'கடின விசாரணைகள் (6 மாதம்)' },
  'lbl.cibil.loan_amt':        { en:'Loan Amount Seeking (₹)',      hi:'मांगी गई ऋण राशि (₹)', te:'అభ్యర్థిస్తున్న రుణ మొత్తం (₹)', ta:'தேடும் கடன் தொகை (₹)' },
  'lbl.cibil.loan_tenure':     { en:'Loan Tenure (Years)',          hi:'ऋण अवधि (वर्ष)',       te:'రుణ కాలవ్యవధి (సంవత్సరాలు)', ta:'கடன் காலம் (ஆண்டுகள்)' },
  'res.cibil.score':           { en:'Your Score',                  hi:'आपका स्कोर',            te:'మీ స్కోర్',              ta:'உங்கள் மதிப்பெண்' },
  'res.cibil.emi_save':        { en:'EMI Savings',                  hi:'EMI बचत',               te:'EMI ఆదా',                ta:'EMI சேமிப்பு' },
  'res.cibil.total_saved':     { en:'Total Interest Saved',         hi:'कुल ब्याज बचत',        te:'మొత్తం వడ్డీ ఆదా',       ta:'மொத்த வட்டி சேமிப்பு' },
  'cibil.sec.factors':         { en:'Score Factor Analysis',       hi:'स्कोर कारक विश्लेषण',  te:'స్కోర్ కారకాల విశ్లేషణ', ta:'மதிப்பெண் காரணி பகுப்பாய்வு' },
  'cibil.sec.action':          { en:'🗓️ Your 90-Day Action Plan',   hi:'🗓️ आपका 90-दिन एक्शन प्लान', te:'🗓️ మీ 90-రోజుల చర్య ప్రణాళిక', ta:'🗓️ உங்கள் 90-நாள் செயல் திட்டம்' },
  'cibil.sec.education':       { en:'📚 What Moves Your Score',     hi:'📚 स्कोर को क्या प्रभावित करता है', te:'📚 స్కోర్‌ను ఏమి మారుస్తుందో', ta:'📚 உங்கள் மதிப்பெண்ணை மாற்றுவது என்ன' },
  'cibil.sec.dispute':         { en:'🛡️ How to Dispute CIBIL Errors', hi:'🛡️ CIBIL त्रुटियों का विवाद', te:'🛡️ CIBIL లోపాలను ఎలా వివాదపరచాలి', ta:'🛡️ CIBIL பிழைகளை எதிர்ப்பது' },
  'cibil.sec.table':           { en:'📊 Score Band Impact',          hi:'📊 स्कोर बैंड प्रभाव', te:'📊 స్కోర్ బ్యాండ్ ప్రభావం', ta:'📊 மதிப்பெண் வரம்பு தாக்கம்' },

  // ── Financial Calendar ───────────────────────────────────────────────────
  'fincal.sec.profile':        { en:'Your Financial Profile',      hi:'आपकी वित्तीय प्रोफाइल', te:'మీ ఆర్థిక ప్రొఫైల్',   ta:'உங்கள் நிதி சுயவிவரம்' },
  'lbl.fincal.regime':         { en:'Tax Regime',                  hi:'कर व्यवस्था',          te:'పన్ను విధానం',           ta:'வரி ஆட்சி' },
  'lbl.fincal.income':         { en:'Annual Income (₹)',           hi:'वार्षिक आय (₹)',        te:'వార్షిక ఆదాయం (₹)',      ta:'வருடாந்திர வருமானம் (₹)' },
  'lbl.fincal.ppf':            { en:'Have PPF Account?',           hi:'PPF खाता है?',          te:'PPF ఖాతా ఉందా?',         ta:'PPF கணக்கு உள்ளதா?' },
  'lbl.fincal.elss':           { en:'Have ELSS / Tax-saving MF?',  hi:'ELSS / टैक्स-सेविंग MF है?', te:'ELSS / పన్ను ఆదా MF ఉందా?', ta:'ELSS / வரி சேமிப்பு MF உள்ளதா?' },
  'lbl.fincal.epf':            { en:'EPF Member?',                 hi:'EPF सदस्य हैं?',        te:'EPF సభ్యుడా?',           ta:'EPF உறுப்பினரா?' },
  'lbl.fincal.sgb':            { en:'Invest in SGB / Gold ETF?',   hi:'SGB / गोल्ड ETF में निवेश?', te:'SGB / గోల్డ్ ETF లో పెట్టుబడి?', ta:'SGB / தங்க ETF இல் முதலீடா?' },
  'fincal.sec.events':         { en:'All Events — Current Financial Year', hi:'सभी इवेंट — वर्तमान वित्त वर्ष', te:'అన్ని ఈవెంట్లు — ప్రస్తుత ఆర్థిక సంవత్సరం', ta:'அனைத்து நிகழ்வுகள் — தற்போதைய நிதியாண்டு' },
  'fincal.sec.calendar':       { en:'Monthly Calendar View',       hi:'मासिक कैलेंडर दृश्य',  te:'నెలసరి క్యాలెండర్ వీక్షణ', ta:'மாதாந்திர நாட்காட்டி காட்சி' },
  'res.fincal.next':           { en:'Next Upcoming Deadline',      hi:'अगली आगामी समय सीमा',  te:'తదుపరి రాబోయే గడువు',   ta:'அடுத்த வரவிருக்கும் காலக்கெடு' },

  // ── Self-Employed ─────────────────────────────────────────────────────────
  'selfempl.tab.tax':          { en:'🧾 Presumptive Tax',           hi:'🧾 अनुमानित कर',        te:'🧾 ఊహాజనిత పన్ను',       ta:'🧾 அனுமான வரி' },
  'selfempl.tab.bef':          { en:'🛡️ Business Emergency Fund',   hi:'🛡️ व्यापार आपातकालीन निधि', te:'🛡️ వ్యాపార అత్యవసర నిధి', ta:'🛡️ வணிக அவசர நிதி' },
  'selfempl.tab.gst':          { en:'📊 GST Cash-Flow',             hi:'📊 GST कैश-फ्लो',       te:'📊 GST నగదు-ప్రవాహం',    ta:'📊 GST பண-ஓட்டம்' },
  'selfempl.tab.adv':          { en:'📅 Advance Tax Planner',       hi:'📅 अग्रिम कर योजना',    te:'📅 అడ్వాన్స్ పన్ను ప్లానర్', ta:'📅 முன்கூட்டிய வரி திட்டம்' },
  'selfempl.sec.profile':      { en:'Your Business Profile',        hi:'आपकी व्यापार प्रोफाइल', te:'మీ వ్యాపార ప్రొఫైల్',   ta:'உங்கள் வணிக சுயவிவரம்' },
  'lbl.selfempl.type':         { en:'Business Type',                hi:'व्यापार प्रकार',        te:'వ్యాపార రకం',            ta:'வணிக வகை' },
  'lbl.selfempl.turnover':     { en:'Annual Turnover / Gross Receipts (₹)', hi:'वार्षिक टर्नओवर (₹)', te:'వార్షిక టర్నోవర్ (₹)',   ta:'வருடாந்திர வருவாய் (₹)' },
  'lbl.selfempl.profit':       { en:'Actual Annual Profit (₹)',     hi:'वास्तविक वार्षिक लाभ (₹)', te:'వాస్తవ వార్షిక లాభం (₹)', ta:'உண்மையான வருடாந்திர இலாபம் (₹)' },
  'lbl.selfempl.regime':       { en:'Tax Regime',                   hi:'कर व्यवस्था',          te:'పన్ను విధానం',           ta:'வரி ஆட்சி' },
  'lbl.selfempl.other':        { en:'Other Income (₹/yr)',          hi:'अन्य आय (₹/वर्ष)',     te:'ఇతర ఆదాయం (₹/సం.)',      ta:'பிற வருமானம் (₹/ஆண்.)' },
  'lbl.selfempl.80c':          { en:'80C Investments (₹/yr)',       hi:'80C निवेश (₹/वर्ष)',   te:'80C పెట్టుబడులు (₹/సం.)', ta:'80C முதலீடுகள் (₹/ஆண்.)' },
  'lbl.selfempl.nps':          { en:'NPS 80CCD(1B) (₹/yr)',        hi:'NPS 80CCD(1B) (₹/वर्ष)', te:'NPS 80CCD(1B) (₹/సం.)',  ta:'NPS 80CCD(1B) (₹/ஆண்.)' },

  // ── Fixed Income Tools ───────────────────────────────────────────────────
  'fi.tab.fd':                 { en:'📊 FD Calculator',             hi:'📊 FD कैलकुलेटर',       te:'📊 FD కాల్క్యులేటర్',    ta:'📊 FD கணிப்பான்' },
  'fi.tab.scss':               { en:'👴 SCSS & POMIS',              hi:'👴 SCSS & POMIS',        te:'👴 SCSS & POMIS',         ta:'👴 SCSS & POMIS' },
  'fi.tab.nsc':                { en:'📮 NSC & KVP',                 hi:'📮 NSC & KVP',           te:'📮 NSC & KVP',            ta:'📮 NSC & KVP' },
  'fi.tab.elss':               { en:'⚖️ FD vs ELSS',               hi:'⚖️ FD बनाम ELSS',        te:'⚖️ FD vs ELSS',           ta:'⚖️ FD vs ELSS' },
  'fi.sec.fd':                 { en:'FD Details',                  hi:'FD विवरण',              te:'FD వివరాలు',              ta:'FD விவரங்கள்' },
  'lbl.fi.principal':          { en:'Principal (₹)',                hi:'मूलधन (₹)',              te:'అసలు (₹)',                ta:'முதலீடு (₹)' },
  'lbl.fi.rate':               { en:'Rate (% p.a.)',                hi:'दर (% p.a.)',            te:'రేటు (% p.a.)',           ta:'விகிதம் (% p.a.)' },
  'lbl.fi.tenure':             { en:'Tenure (months)',              hi:'अवधि (महीने)',           te:'కాలం (నెలలు)',            ta:'காலம் (மாதங்கள்)' },
  'lbl.fi.type':               { en:'Type',                         hi:'प्रकार',                te:'రకం',                     ta:'வகை' },
  'lbl.fi.regime':             { en:'Tax Regime',                   hi:'कर व्यवस्था',          te:'పన్ను విధానం',            ta:'வரி ஆட்சி' },
  'lbl.fi.slab':               { en:'Your Tax Slab',                hi:'आपका कर स्लैब',        te:'మీ పన్ను స్లాబ్',         ta:'உங்கள் வரி அடுக்கு' },
  'res.fi.gross':              { en:'Gross Maturity',               hi:'सकल परिपक्वता',         te:'స్థూల మెచ్యూరిటీ',       ta:'மொத்த முதிர்வு' },
  'res.fi.net':                { en:'Post-Tax Maturity',            hi:'कर-पश्चात परिपक्वता',   te:'పన్ను తర్వాత మెచ్యూరిటీ', ta:'வரிக்கு பிறகு முதிர்வு' },

  // ── Gold Comparator ──────────────────────────────────────────────────────
  'gold.warning':              { en:'⚠ SEBI WARNING: Digital Gold (PhonePe/Paytm/GPay) is UNREGULATED', hi:'⚠ SEBI चेतावनी: डिजिटल गोल्ड अनियमित है', te:'⚠ SEBI హెచ్చరిక: డిజిటల్ గోల్డ్ అనియంత్రితం', ta:'⚠ SEBI எச்சரிக்கை: டிஜிட்டல் தங்கம் கட்டுப்படுத்தப்படவில்லை' },
  'gold.sec.profile':          { en:'Your Gold Investment Profile', hi:'आपकी सोना निवेश प्रोफाइल', te:'మీ బంగారు పెట్టుబడి ప్రొఫైల్', ta:'உங்கள் தங்க முதலீட்டு சுயவிவரம்' },
  'lbl.gold.amount':           { en:'Investment Amount (₹)',        hi:'निवेश राशि (₹)',        te:'పెట్టుబడి మొత్తం (₹)',   ta:'முதலீட்டுத் தொகை (₹)' },
  'lbl.gold.years':            { en:'Holding Period (Years)',        hi:'होल्डिंग अवधि (वर्ष)', te:'హోల్డింగ్ కాలం (సంవత్సరాలు)', ta:'வைத்திருக்கும் காலம் (ஆண்டுகள்)' },
  'lbl.gold.return':           { en:'Expected Gold Return (% p.a.)', hi:'अपेक्षित रिटर्न (% p.a.)', te:'అంచనా రాబడి (% p.a.)',  ta:'எதிர்பார்க்கும் வருவாய் (% p.a.)' },
  'lbl.gold.regime':           { en:'Tax Regime',                   hi:'कर व्यवस्था',          te:'పన్ను విధానం',            ta:'வரி ஆட்சி' },
  'lbl.gold.slab':             { en:'Income Tax Slab',              hi:'आयकर स्लैब',            te:'ఆదాయపు పన్ను స్లాబ్',    ta:'வருமான வரி அடுக்கு' },
  'lbl.gold.making':           { en:'Physical Gold Making Charges (%)', hi:'मेकिंग चार्ज (%)',  te:'మేకింగ్ చార్జీలు (%)',   ta:'தயாரிப்பு கட்டணம் (%)' },
  'lbl.gold.locker':           { en:'Locker Rent (₹/year)',          hi:'लॉकर किराया (₹/वर्ष)', te:'లాకర్ అద్దె (₹/సంవత్సరం)', ta:'லாக்கர் வாடகை (₹/ஆண்டு)' },
  'gold.sec.etf':              { en:'📊 Gold ETF',                   hi:'📊 गोल्ड ETF',           te:'📊 గోల్డ్ ETF',            ta:'📊 தங்க ETF' },
  'gold.sec.mf':               { en:'🏦 Gold MF / FoF',              hi:'🏦 गोल्ड MF / FoF',      te:'🏦 గోల్డ్ MF / FoF',       ta:'🏦 தங்க MF / FoF' },
  'gold.sec.phys':             { en:'📿 Physical Gold',               hi:'📿 भौतिक सोना',           te:'📿 భౌతిక బంగారం',          ta:'📿 இயற்பியல் தங்கம்' },
  'res.gold.winner':           { en:'🏆 Best Option for Your Profile', hi:'🏆 आपके लिए सर्वोत्तम विकल्प', te:'🏆 మీ ప్రొఫైల్‌కు ఉత్తమ ఎంపిక', ta:'🏆 உங்களுக்கான சிறந்த விருப்பம்' },

  // ── Net Worth Tracker ────────────────────────────────────────────────────
  'nw.sec.assets':             { en:'ASSETS — What You Own',        hi:'संपत्ति — आपके पास क्या है', te:'ఆస్తులు — మీకు ఏమి ఉంది', ta:'சொத்துகள் — நீங்கள் வைத்திருப்பவை' },
  'nw.sec.liquid':             { en:'💵 Liquid',                     hi:'💵 तरल',                  te:'💵 లిక్విడ్',              ta:'💵 பணரீதி' },
  'lbl.nw.savings':            { en:'Savings / Bank (₹)',            hi:'बचत / बैंक (₹)',          te:'సేవింగ్స్ / బ్యాంక్ (₹)', ta:'சேமிப்பு / வங்கி (₹)' },
  'lbl.nw.fd':                 { en:'Fixed Deposits (₹)',            hi:'सावधि जमा (₹)',           te:'స్థిర నిక్షేపాలు (₹)',    ta:'நிலையான வைப்பு (₹)' },
  'nw.sec.equity':             { en:'📈 Equity',                     hi:'📈 इक्विटी',              te:'📈 ఈక్విటీ',              ta:'📈 ஈக்விட்டி' },
  'lbl.nw.stocks':             { en:'Direct Stocks (₹)',             hi:'प्रत्यक्ष स्टॉक (₹)',    te:'నేరుగా స్టాక్స్ (₹)',     ta:'நேரடி பங்குகள் (₹)' },
  'lbl.nw.eq_mf':              { en:'Equity Mutual Funds (₹)',       hi:'इक्विटी म्यूचुअल फंड (₹)', te:'ఈక్విటీ మ్యూచువల్ ఫండ్స్ (₹)', ta:'ஈக்விட்டி மியூச்சுவல் ஃபண்ட் (₹)' },
  'nw.sec.retirement':         { en:'🔒 Retirement & Fixed Income',  hi:'🔒 सेवानिवृत्ति और फिक्स्ड इनकम', te:'🔒 పదవీ విరమణ & స్థిర ఆదాయం', ta:'🔒 ஓய்வு & நிலையான வருமானம்' },
  'lbl.nw.epf':                { en:'EPF Balance (₹)',               hi:'EPF बैलेंस (₹)',         te:'EPF బ్యాలెన్స్ (₹)',       ta:'EPF இருப்பு (₹)' },
  'lbl.nw.ppf':                { en:'PPF Balance (₹)',               hi:'PPF बैलेंस (₹)',         te:'PPF బ్యాలెన్స్ (₹)',       ta:'PPF இருப்பு (₹)' },
  'lbl.nw.nps':                { en:'NPS Balance (₹)',               hi:'NPS बैलेंस (₹)',         te:'NPS బ్యాలెన్స్ (₹)',       ta:'NPS இருப்பு (₹)' },
  'lbl.nw.debt_mf':            { en:'Debt MF / Bonds (₹)',           hi:'डेट MF / बॉन्ड (₹)',    te:'డెట్ MF / బాండ్లు (₹)',   ta:'கடன் MF / பத்திரங்கள் (₹)' },
  'nw.sec.realestate':         { en:'🏠 Real Estate',                hi:'🏠 रियल एस्टेट',          te:'🏠 రియల్ ఎస్టేట్',         ta:'🏠 ரியல் எஸ்டேட்' },
  'lbl.nw.home':               { en:'Primary Home (₹)',              hi:'प्राथमिक मकान (₹)',      te:'ప్రాథమిక నివాసం (₹)',      ta:'முதன்மை வீடு (₹)' },
  'lbl.nw.property':           { en:'Other Property (₹)',            hi:'अन्य संपत्ति (₹)',       te:'ఇతర ఆస్తి (₹)',            ta:'பிற சொத்து (₹)' },
  'nw.sec.gold':               { en:'🥇 Gold & Other',               hi:'🥇 सोना और अन्य',         te:'🥇 బంగారం & ఇతర',          ta:'🥇 தங்கம் & மற்றவை' },
  'lbl.nw.gold_phys':          { en:'Physical Gold (₹)',             hi:'भौतिक सोना (₹)',         te:'భౌతిక బంగారం (₹)',         ta:'இயற்பியல் தங்கம் (₹)' },
  'lbl.nw.gold_paper':         { en:'Gold ETF / SGB / MF (₹)',       hi:'गोल्ड ETF / SGB / MF (₹)', te:'గోల్డ్ ETF / SGB / MF (₹)', ta:'தங்க ETF / SGB / MF (₹)' },
  'lbl.nw.crypto':             { en:'Cryptocurrency (₹)',            hi:'क्रिप्टोकरेंसी (₹)',    te:'క్రిప్టోకరెన్సీ (₹)',       ta:'கிரிப்டோகரன்சி (₹)' },
  'lbl.nw.ulip_sv':            { en:'LIC / ULIP Surr. Value (₹)',    hi:'LIC / ULIP सरेंडर वैल्यू (₹)', te:'LIC / ULIP సరెండర్ విలువ (₹)', ta:'LIC / ULIP சரண்டர் மதிப்பு (₹)' },
  'lbl.nw.vehicles':           { en:'Vehicles + Other Assets (₹)',   hi:'वाहन + अन्य संपत्ति (₹)', te:'వాహనాలు + ఇతర ఆస్తులు (₹)', ta:'வாகனங்கள் + பிற சொத்துகள் (₹)' },
  'nw.sec.liabilities':        { en:'LIABILITIES — What You Owe',   hi:'देनदारी — आप पर क्या बकाया है', te:'బాధ్యతలు — మీరు ఏమి చెల్లించాలి', ta:'பொறுப்புகள் — நீங்கள் கடன்பட்டவை' },
  'lbl.nw.home_loan':          { en:'Home Loan (₹)',                  hi:'गृह ऋण (₹)',             te:'హోమ్ లోన్ (₹)',            ta:'வீட்டு கடன் (₹)' },
  'lbl.nw.car_loan':           { en:'Car Loan (₹)',                   hi:'कार ऋण (₹)',             te:'కార్ లోన్ (₹)',            ta:'கார் கடன் (₹)' },
  'lbl.nw.pl':                 { en:'Personal Loan (₹)',             hi:'व्यक्तिगत ऋण (₹)',      te:'వ్యక్తిగత రుణం (₹)',       ta:'தனிப்பட்ட கடன் (₹)' },
  'lbl.nw.edu_loan':           { en:'Education Loan (₹)',            hi:'शिक्षा ऋण (₹)',          te:'విద్యా రుణం (₹)',           ta:'கல்வி கடன் (₹)' },
  'lbl.nw.cc':                 { en:'Credit Card Dues (₹)',          hi:'क्रेडिट कार्ड बकाया (₹)', te:'క్రెడిట్ కార్డ్ బాకీలు (₹)', ta:'கடன் அட்டை நிலுவைகள் (₹)' },
  'lbl.nw.other_loans':        { en:'Business / Other Loans (₹)',    hi:'व्यापार / अन्य ऋण (₹)', te:'వ్యాపార / ఇతర రుణాలు (₹)', ta:'வணிக / பிற கடன்கள் (₹)' },
  'res.nw.networth':           { en:'Your Net Worth',                hi:'आपकी नेट वर्थ',          te:'మీ నెట్ వర్త్',            ta:'உங்கள் நிகர மதிப்பு' },
  'res.nw.total_assets':       { en:'Total Assets',                  hi:'कुल संपत्ति',             te:'మొత్తం ఆస్తులు',           ta:'மொத்த சொத்துகள்' },
  'res.nw.total_liab':         { en:'Total Liabilities',             hi:'कुल देनदारी',             te:'మొత్తం బాధ్యతలు',          ta:'மொத்த பொறுப்புகள்' },
  'nw.sec.ratios':             { en:'Key Financial Ratios',          hi:'प्रमुख वित्तीय अनुपात', te:'ముఖ్య ఆర్థిక నిష్పత్తులు', ta:'முக்கிய நிதி விகிதங்கள்' },
  'nw.sec.allocation':         { en:'Asset Allocation',             hi:'संपत्ति आवंटन',         te:'ఆస్తుల కేటాయింపు',         ta:'சொத்து ஒதுக்கீடு' },
  'nw.sec.breakdown':          { en:'Asset Breakdown',              hi:'संपत्ति विवरण',          te:'ఆస్తుల వివరణ',             ta:'சொத்து விவரம்' },

  // ── ULIP / Policy Analyzer ───────────────────────────────────────────────
  'ulip.sec.policy':           { en:'Your Policy Details',          hi:'आपकी पॉलिसी विवरण',    te:'మీ పాలసీ వివరాలు',        ta:'உங்கள் பாலிசி விவரங்கள்' },
  'lbl.ulip.premium':          { en:'Annual Premium (₹)',           hi:'वार्षिक प्रीमियम (₹)',  te:'వార్షిక ప్రీమియం (₹)',     ta:'வருடாந்திர ப்ரீமியம் (₹)' },
  'lbl.ulip.term':             { en:'Policy Term (years)',          hi:'पॉलिसी अवधि (वर्ष)',   te:'పాలసీ కాలం (సంవత్సరాలు)', ta:'பாலிசி காலம் (ஆண்டுகள்)' },
  'lbl.ulip.paid':             { en:'Years Paid So Far',            hi:'अब तक चुके वर्ष',      te:'ఇప్పటివరకు చెల్లించిన సంవత్సరాలు', ta:'இதுவரை செலுத்திய ஆண்டுகள்' },
  'lbl.ulip.maturity':         { en:'Maturity Value (₹)',           hi:'परिपक्वता मूल्य (₹)',   te:'మెచ్యూరిటీ విలువ (₹)',     ta:'முதிர்வு மதிப்பு (₹)' },
  'lbl.ulip.sv':               { en:'Surrender Value (₹)',          hi:'सरेंडर वैल्यू (₹)',     te:'సరెండర్ విలువ (₹)',         ta:'சரண்டர் மதிப்பு (₹)' },
  'lbl.ulip.cover':            { en:'Sum Assured / Cover (₹)',      hi:'बीमित राशि / कवर (₹)', te:'బీమా మొత్తం / కవర్ (₹)',  ta:'உறுதி செய்யப்பட்ட தொகை (₹)' },
  'lbl.ulip.age':              { en:'Your Current Age',             hi:'आपकी वर्तमान उम्र',    te:'మీ ప్రస్తుత వయసు',         ta:'உங்கள் தற்போதைய வயது' },
  'lbl.ulip.inv_return':       { en:'Expected Inv. Return (%)',     hi:'अपेक्षित निवेश रिटर्न (%)', te:'అంచనా పెట్టుబడి రాబడి (%)', ta:'எதிர்பார்க்கும் முதலீட்டு வருவாய் (%)' },
  'lbl.ulip.slab':             { en:'Your Tax Slab',                hi:'आपका कर स्लैब',        te:'మీ పన్ను స్లాబ్',           ta:'உங்கள் வரி அடுக்கு' },
  'res.ulip.irr':              { en:'Policy IRR',                   hi:'पॉलिसी IRR',            te:'పాలసీ IRR',                 ta:'பாலிசி IRR' },
  'res.ulip.btid':             { en:'Buy Term + Invest (BTID)',     hi:'टर्म + निवेश (BTID)',   te:'టర్మ్ + పెట్టుబడి (BTID)',  ta:'டேர்ம் + முதலீடு (BTID)' },
  'res.ulip.advantage':        { en:'BTID Advantage',               hi:'BTID लाभ',              te:'BTID ప్రయోజనం',             ta:'BTID நன்மை' },
  'ulip.sec.breakdown':        { en:'Policy Breakdown',             hi:'पॉलिसी विवरण',          te:'పాలసీ వివరణ',              ta:'பாலிசி விவரம்' },
  'ulip.sec.caveats':          { en:'⚠️ Important Caveats',          hi:'⚠️ महत्वपूर्ण सावधानियां', te:'⚠️ ముఖ్యమైన హెచ్చరికలు', ta:'⚠️ முக்கியமான எச்சரிக்கைகள்' },

  // ── Coffee Can ───────────────────────────────────────────────────────────
  'coffeecan.title':           { en:'☕ The Coffee Can',             hi:'☕ कॉफी कैन',             te:'☕ కాఫీ క్యాన్',             ta:'☕ காபி கேன்' },
  'coffeecan.what':            { en:'📖 What is Coffee Can Investing?', hi:'📖 कॉफी कैन निवेश क्या है?', te:'📖 కాఫీ క్యాన్ పెట్టుబడి అంటే ఏమిటి?', ta:'📖 காபி கேன் முதலீடு என்றால் என்ன?' },
  'coffeecan.disclaimer':      { en:'⚠ Disclaimer',                 hi:'⚠ अस्वीकरण',             te:'⚠ నిరాకరణ',                 ta:'⚠ மறுப்பு' },

  // ── EPF additional ───────────────────────────────────────────────────────
  'epf.sec.details':           { en:'Your EPF Details',             hi:'आपका EPF विवरण',         te:'మీ EPF వివరాలు',            ta:'உங்கள் EPF விவரங்கள்' },
  'epf.sec.eps':               { en:'EPS Pension — How It Works',   hi:'EPS पेंशन — कैसे काम करती है', te:'EPS పెన్షన్ — ఎలా పని చేస్తుంది', ta:'EPS பென்ஷன் — எப்படி செயல்படுகிறது' },
  'epf.sec.rules':             { en:'EPF Withdrawal — Tax Rules',   hi:'EPF निकासी — कर नियम',   te:'EPF ఉపసంహరణ — పన్ను నియమాలు', ta:'EPF திரும்பப்பெறல் — வரி விதிகள்' },
};

// ─── Build per-language blocks ────────────────────────────────────────────
const langs = ['en','hi','te','ta'];

// Read current i18n.js
let src = fs.readFileSync(FILE, 'utf8');

// For each language, insert the new keys before its closing  },  or  }
langs.forEach(lang => {
    // Build the block of new key lines
    const lines = [];
    for (const [key, vals] of Object.entries(KEYS)) {
        // Skip if key already exists in this language
        const escaped = key.replace(/\./g,'\\.');
        const re = new RegExp(`'${escaped}'\\s*:`);
        if (re.test(src)) return; // already present somewhere, skip
        const val = vals[lang].replace(/'/g, "\\'");
        lines.push(`        '${key}':${' '.repeat(Math.max(1,40-key.length))}\'${val}\',`);
    }
    if (lines.length === 0) return;

    const block = '\n        /* ── Additional tool labels (auto-added) ── */\n' + lines.join('\n') + '\n';

    // Find the closing tag for this language section:
    // en section ends before "hi: {", hi before "te: {", te before "ta: {", ta before "};"
    let insertBefore;
    if (lang === 'en') insertBefore = /\n\s{6}hi:\s*\{/;
    else if (lang === 'hi') insertBefore = /\n\s{6}te:\s*\{/;
    else if (lang === 'te') insertBefore = /\n\s{6}ta:\s*\{/;
    else insertBefore = /\n\s{4}\};\s*\n\s*\/\* ── Core helpers/;

    src = src.replace(insertBefore, m => block + m);
});

fs.writeFileSync(FILE, src, 'utf8');
console.log('Done — i18n keys added.');
