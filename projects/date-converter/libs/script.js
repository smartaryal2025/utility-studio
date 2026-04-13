// --- Constants & Data ---
const engMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const nepMonths = ["Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];
const nepMonthsDevanagari = ["वैशाख", "जेष्ठ", "आषाढ", "श्रावण", "भाद्र", "आश्विन", "कार्तिक", "मंसिर", "पौष", "माघ", "फाल्गुण", "चैत्र"];
const engWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const nepWeekdays = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];

// Reference Date Map
const REF_AD_YEAR = 1943;
const REF_AD_MONTH = 3;
const REF_AD_DAY = 14;

const REF_BS_YEAR = 2000;
const REF_BS_MONTH = 0;
const REF_BS_DAY = 1;

let minBsYear = 2000;
let maxBsYear = 2090;
let currentYearLunarData = {}; 

const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const getAdDaysInMonth = (y, m) => [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];
const getUTCDays = (y, m, d) => Math.floor(Date.UTC(y, m, d) / 86400000);

const devMap = { 0: "०", 1: "१", 2: "२", 3: "३", 4: "४", 5: "५", 6: "६", 7: "७", 8: "८", 9: "९" };
const toDevanagari = (num) => String(num).split("").map((c) => devMap[c] || c).join("");

// --- Bidirectional Time Engine ---
const convertADtoBS = (adY, adM, adD) => {
  let daysPassed = getUTCDays(adY, adM, adD) - getUTCDays(REF_AD_YEAR, REF_AD_MONTH, REF_AD_DAY);
  let bsY = REF_BS_YEAR, bsM = REF_BS_MONTH, bsD = REF_BS_DAY;

  if (daysPassed >= 0) {
    while (daysPassed > 0) {
      if (!nepaliMonthDays[bsY]) return null;
      const daysLeft = nepaliMonthDays[bsY][bsM] - bsD + 1;
      if (daysPassed >= daysLeft) {
        daysPassed -= daysLeft;
        bsD = 1;
        bsM++;
        if (bsM > 11) { bsM = 0; bsY++; }
      } else {
        bsD += daysPassed;
        daysPassed = 0;
      }
    }
  } else {
    let absDays = Math.abs(daysPassed);
    while (absDays > 0) {
      bsD--;
      if (bsD === 0) {
        bsM--;
        if (bsM < 0) { bsM = 11; bsY--; }
        if (!nepaliMonthDays[bsY]) return null;
        bsD = nepaliMonthDays[bsY][bsM];
      }
      absDays--;
    }
  }
  return { year: bsY, month: bsM, day: bsD, weekdayIndex: new Date(adY, adM, adD).getDay() };
};

const convertBStoAD = (bsY, bsM, bsD) => {
  if (bsY < minBsYear || bsY > maxBsYear) return null;
  let daysPassed = 0;

  if (bsY >= REF_BS_YEAR) {
    let currY = REF_BS_YEAR, currM = REF_BS_MONTH;
    while (currY < bsY || (currY === bsY && currM < bsM)) {
      daysPassed += nepaliMonthDays[currY][currM];
      currM++;
      if (currM > 11) { currM = 0; currY++; }
    }
    daysPassed += bsD - REF_BS_DAY;
  } else {
    let currY = REF_BS_YEAR - 1, currM = 11;
    while (currY > bsY || (currY === bsY && currM >= bsM)) {
      daysPassed -= nepaliMonthDays[currY][currM];
      currM--;
      if (currM < 0) { currM = 11; currY--; }
    }
    daysPassed += bsD - 1;
  }

  const targetAD = new Date(Date.UTC(REF_AD_YEAR, REF_AD_MONTH, REF_AD_DAY));
  targetAD.setUTCDate(targetAD.getUTCDate() + daysPassed);
  return { year: targetAD.getUTCFullYear(), month: targetAD.getUTCMonth(), day: targetAD.getUTCDate(), weekdayIndex: targetAD.getUTCDay() };
};

// --- Fixed Event Maps ---
const getFixedEvent = (bsMonth, bsDay) => {
  const events = {
    "0-1": { name: "नव वर्ष", isHoliday: true },
    "0-11": { name: "लोकतन्त्र दिवस", isHoliday: false },
    "1-15": { name: "गणतन्त्र दिवस", isHoliday: true },
    "3-1": { name: "साउने संक्रान्ति", isHoliday: true },
    "4-24": { name: "नारी दिवस", isHoliday: false },
    "5-3": { name: "संविधान दिवस", isHoliday: false },
    "8-27": { name: "पृथ्वी जयन्ती, राष्ट्रिय एकता दिवस", isHoliday: true },
    "9-1": { name: "माघे संक्रान्ति", isHoliday: true },
    "9-16": { name: "शहीद दिवस", isHoliday: false },
    "10-7": { name: "प्रजातन्त्र दिवस", isHoliday: true }
  };
  return events[`${bsMonth}-${bsDay}`] || null;
};

const getAdFixedEvent = (adMonth, adDay) => {
  const events = {
    "0-1": { name: "अंग्रेजी नयाँ वर्ष, टोपी दिवस", isHoliday: false },
    "2-8": { name: "अन्तर्राष्ट्रिय नारी दिवस", isHoliday: false },
    "4-1": { name: "अन्तर्राष्ट्रिय श्रम दिवस", isHoliday: true },
    "11-25": { name: "क्रिसमस डे", isHoliday: true }
  };
  return events[`${adMonth}-${adDay}`] || null;
};

// --- Initialization & UI Logic ---
document.addEventListener("DOMContentLoaded", () => {
  try {
    const years = Object.keys(nepaliMonthDays).map(Number);
    minBsYear = Math.min(...years);
    maxBsYear = Math.max(...years);
    initializeApp();
  } catch (err) {
    console.error("Error starting calendar:", err);
    document.getElementById("current-date-text").textContent = "Error loading calendar data.";
  }

  async function initializeApp() {
    const now = new Date();
    const todayAd = { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
    const todayBsRaw = convertADtoBS(todayAd.year, todayAd.month, todayAd.day);
    const todayBs = todayBsRaw || { year: 2082, month: 11, day: 8 };

    let calBsYear = todayBs.year, calBsMonth = todayBs.month;
    let calAdYear = todayAd.year, calAdMonth = todayAd.month;

    // Load dynamic yearly JSON
    async function loadLunarData(year) {
        try {
            const response = await fetch(`libs/events/${year}.json`);
            if (response.ok) {
                currentYearLunarData = await response.json();
            } else {
                currentYearLunarData = {}; 
            }
        } catch (err) {
            currentYearLunarData = {}; 
        }
    }

    await loadLunarData(calBsYear);

    document.getElementById("current-date-text").textContent = `आज: मिति ${toDevanagari(todayBs.year)} साल ${nepMonthsDevanagari[todayBs.month]} ${toDevanagari(todayBs.day)} गते, ${nepWeekdays[todayBs.weekdayIndex]} | ${engMonths[todayAd.month]} ${todayAd.day}, ${todayAd.year}, ${engWeekdays[now.getDay()]}`;

    const populateAllDropdowns = () => {
      const adY = document.getElementById("ad-year"), adM = document.getElementById("ad-month"), adD = document.getElementById("ad-day");
      const bsY = document.getElementById("bs-year"), bsM = document.getElementById("bs-month"), bsD = document.getElementById("bs-day");
      const calAdY = document.getElementById("cal-ad-year-select"), calAdM = document.getElementById("cal-ad-month-select");
      const calBsY = document.getElementById("cal-bs-year-select"), calBsM = document.getElementById("cal-bs-month-select");

      const minAd = convertBStoAD(minBsYear, 0, 1).year;
      const maxAd = convertBStoAD(maxBsYear, 11, 30).year;

      for (let y = minAd; y <= maxAd; y++) { adY.add(new Option(y, y)); calAdY.add(new Option(y, y)); }
      for (let y = minBsYear; y <= maxBsYear; y++) { bsY.add(new Option(toDevanagari(y), y)); calBsY.add(new Option(toDevanagari(y), y)); }

      engMonths.forEach((m, i) => { adM.add(new Option(m, i)); calAdM.add(new Option(m, i)); });
      nepMonthsDevanagari.forEach((m, i) => { bsM.add(new Option(m, i)); calBsM.add(new Option(m, i)); });

      adY.value = todayAd.year; adM.value = todayAd.month;
      for (let i = 1; i <= 31; i++) adD.add(new Option(i, i)); adD.value = todayAd.day;

      bsY.value = todayBs.year; bsM.value = todayBs.month;
      for (let i = 1; i <= 32; i++) bsD.add(new Option(toDevanagari(i), i)); bsD.value = todayBs.day;
    };
    
    populateAllDropdowns();

    const updateAdDays = () => {
      const dSel = document.getElementById("ad-day");
      const curr = dSel.value;
      const max = getAdDaysInMonth(parseInt(document.getElementById("ad-year").value), parseInt(document.getElementById("ad-month").value));
      dSel.innerHTML = "";
      for (let i = 1; i <= max; i++) dSel.add(new Option(i, i));
      dSel.value = curr <= max ? curr : max;
    };
    
    const updateBsDays = () => {
      const dSel = document.getElementById("bs-day");
      const curr = dSel.value;
      const y = parseInt(document.getElementById("bs-year").value), m = parseInt(document.getElementById("bs-month").value);
      if (nepaliMonthDays[y]) {
        const max = nepaliMonthDays[y][m];
        dSel.innerHTML = "";
        for (let i = 1; i <= max; i++) dSel.add(new Option(toDevanagari(i), i));
        dSel.value = curr <= max ? curr : max;
      }
    };

    document.getElementById("ad-year").addEventListener("change", updateAdDays);
    document.getElementById("ad-month").addEventListener("change", updateAdDays);
    document.getElementById("bs-year").addEventListener("change", updateBsDays);
    document.getElementById("bs-month").addEventListener("change", updateBsDays);

    const setupTabs = (btnClass) => {
      document.querySelectorAll(btnClass).forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const parent = e.target.closest(".card-container");
          parent.querySelectorAll(btnClass).forEach((b) => b.classList.remove("active"));
          parent.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
          e.target.classList.add("active");
          document.getElementById(e.target.dataset.tab).classList.add("active");
          if (btnClass === ".main-tab") document.getElementById("output-section").classList.add("hidden");
        });
      });
    };
    setupTabs(".main-tab");
    setupTabs(".cal-tab");

    const showResult = (text) => {
      document.getElementById("error-message").classList.add("hidden");
      document.getElementById("result-text").textContent = text;
      document.getElementById("output-section").classList.remove("hidden");
    };
    
    const showError = (text) => {
      document.getElementById("result-text").textContent = "";
      document.getElementById("error-message").textContent = text;
      document.getElementById("error-message").classList.remove("hidden");
      document.getElementById("output-section").classList.remove("hidden");
    };

    document.getElementById("form-ad-to-bs").addEventListener("submit", (e) => {
      e.preventDefault();
      const res = convertADtoBS(parseInt(document.getElementById("ad-year").value), parseInt(document.getElementById("ad-month").value), parseInt(document.getElementById("ad-day").value));
      if (res) showResult(`${toDevanagari(res.year)} ${nepMonthsDevanagari[res.month]} ${toDevanagari(res.day)}, ${nepWeekdays[res.weekdayIndex]}`);
      else showError("Out of range.");
    });

    document.getElementById("form-bs-to-ad").addEventListener("submit", (e) => {
      e.preventDefault();
      const res = convertBStoAD(parseInt(document.getElementById("bs-year").value), parseInt(document.getElementById("bs-month").value), parseInt(document.getElementById("bs-day").value));
      if (res) showResult(`${res.year} ${engMonths[res.month]} ${res.day}, ${engWeekdays[res.weekdayIndex]}`);
      else showError("Out of range.");
    });

    document.querySelectorAll(".reset-btn").forEach((b) => b.addEventListener("click", () => document.getElementById("output-section").classList.add("hidden")));

    document.getElementById("copy-btn").addEventListener("click", () => {
      navigator.clipboard.writeText(document.getElementById("result-text").textContent);
      document.getElementById("copy-btn").style.color = "var(--color-success)";
      setTimeout(() => (document.getElementById("copy-btn").style.color = ""), 2000);
    });

    const renderBsCalendar = () => {
      document.getElementById("cal-bs-year-select").value = calBsYear;
      document.getElementById("cal-bs-month-select").value = calBsMonth;

      const firstDayAd = convertBStoAD(calBsYear, calBsMonth, 1);
      if (!firstDayAd) return;

      const totalDays = nepaliMonthDays[calBsYear][calBsMonth];
      const cont = document.getElementById("bs-cal-days");
      cont.innerHTML = "";

      const isPro = document.querySelector(".pro-date-grid") !== null;

      let prevY = calBsYear, prevM = calBsMonth - 1;
      if (prevM < 0) { prevM = 11; prevY--; }

      if (isPro && nepaliMonthDays[prevY]) {
        const prevTotalDays = nepaliMonthDays[prevY][prevM];
        const startPrevDay = prevTotalDays - firstDayAd.weekdayIndex + 1;
        for (let i = 0; i < firstDayAd.weekdayIndex; i++) {
          let pDay = startPrevDay + i;
          const pAdDate = convertBStoAD(prevY, prevM, pDay);
          let engLabel = pAdDate ? pAdDate.day : "";
          if (pAdDate && pAdDate.day === 1) engLabel = engMonths[pAdDate.month].substring(0, 3) + " " + pAdDate.day;
          cont.innerHTML += `<div class="cal-day muted"><span class="date-number" style="font-size: 1.2rem; margin-top:20px;">${toDevanagari(pDay)}</span><span class="eng-date-small">${engLabel}</span></div>`;
        }
      } else {
        for (let i = 0; i < firstDayAd.weekdayIndex; i++) cont.innerHTML += `<div class="cal-day empty"></div>`;
      }

      // Main Render Loop
      for (let i = 1; i <= totalDays; i++) {
        const isToday = todayBs.year === calBsYear && todayBs.month === calBsMonth && todayBs.day === i;
        const currentWeekday = (firstDayAd.weekdayIndex + i - 1) % 7;
        const isWeekend = currentWeekday === 0 || currentWeekday === 6;
        const adDate = convertBStoAD(calBsYear, calBsMonth, i);

        let dailyEvents = [];
        let tithi = "";

        // Combine Lunar, BS Fixed, and AD Fixed
        const lunarDayData = currentYearLunarData[`${calBsMonth}-${i}`];
        if (lunarDayData) {
            tithi = lunarDayData.tithi || "";
            if (lunarDayData.events) dailyEvents.push(...lunarDayData.events);
        }

        const fixedBs = getFixedEvent(calBsMonth, i);
        if (fixedBs) dailyEvents.push(fixedBs);

        if (adDate) {
            const fixedAd = getAdFixedEvent(adDate.month, adDate.day);
            if (fixedAd) dailyEvents.push(fixedAd);
        }

        let classList = "cal-day";
        if (isToday) classList += " today";
        
        const hasHoliday = dailyEvents.some(e => e.isHoliday);
        if (isWeekend || hasHoliday) classList += " holiday";

        let eventHtml = `<div class="event-area">`;
        dailyEvents.forEach(e => {
            const labelClass = e.isHoliday ? "event-label" : "event-label observance";
            eventHtml += `<span class="${labelClass}">${e.name}</span>`;
        });
        eventHtml += `</div>`;

    // Extract ONLY the last word (e.g., "एकादशी") for the tiny box
        const shortTithi = tithi ? tithi.split(" ").pop() : "";
        const tithiHtml = shortTithi ? `<span class="tithi-label">${shortTithi}</span>` : "";

        if (isPro) {
          let engLabel = adDate ? adDate.day : "";
          if (adDate && adDate.day === 1) engLabel = engMonths[adDate.month].substring(0, 3) + " " + adDate.day;
          
          cont.innerHTML += `
            <div class="${classList}" onclick="window.showDayDetails(${calBsYear}, ${calBsMonth}, ${i})">
                ${eventHtml}
                <span class="date-number">${toDevanagari(i)}</span>
                ${tithiHtml}
                <span class="eng-date-small">${engLabel}</span>
            </div>`;
        } else {
          cont.innerHTML += `
            <div class="${classList}" onclick="window.showDayDetails(${calBsYear}, ${calBsMonth}, ${i})">
                ${eventHtml}
                <span class="date-number">${toDevanagari(i)}</span>
                ${tithiHtml}
            </div>`;
        }
      }

      if (isPro) {
        const totalCells = firstDayAd.weekdayIndex + totalDays;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        if (remainingCells > 0) {
          let nextY = calBsYear, nextM = calBsMonth + 1;
          if (nextM > 11) { nextM = 0; nextY++; }
          for (let i = 1; i <= remainingCells; i++) {
            const nAdDate = convertBStoAD(nextY, nextM, i);
            let engLabel = nAdDate ? nAdDate.day : "";
            if (nAdDate && nAdDate.day === 1) engLabel = engMonths[nAdDate.month].substring(0, 3) + " " + nAdDate.day;
            cont.innerHTML += `<div class="cal-day muted"><span class="date-number" style="font-size: 1.2rem; margin-top:20px;">${toDevanagari(i)}</span><span class="eng-date-small">${engLabel}</span></div>`;
          }
        }
      }
    };

    const renderAdCalendar = () => {
      document.getElementById("cal-ad-year-select").value = calAdYear;
      document.getElementById("cal-ad-month-select").value = calAdMonth;

      const firstDay = new Date(calAdYear, calAdMonth, 1).getDay();
      const totalDays = new Date(calAdYear, calAdMonth + 1, 0).getDate();
      const cont = document.getElementById("ad-cal-days");
      cont.innerHTML = "";

      for (let i = 0; i < firstDay; i++) cont.innerHTML += `<div class="cal-day empty"></div>`;
      for (let i = 1; i <= totalDays; i++) {
        const isToday = todayAd.year === calAdYear && todayAd.month === calAdMonth && todayAd.day === i;
        const currentWeekday = (firstDay + i - 1) % 7;
        const isWeekend = currentWeekday === 0 || currentWeekday === 6;

        let classList = "cal-day";
        if (isToday) classList += " today";
        if (isWeekend) classList += " holiday";

        cont.innerHTML += `<div class="${classList}">${i}</div>`;
      }
    };

    renderBsCalendar();
    if (document.getElementById("ad-cal-days")) renderAdCalendar();

    // --- SMART SYNC LOGIC ---
    const syncDropdowns = async (source) => {
        if (source === 'BS') {
            // Find which AD month the 1st of this BS month falls into
            const adDate = convertBStoAD(calBsYear, calBsMonth, 1);
            if (adDate) {
                calAdYear = adDate.year;
                calAdMonth = adDate.month;
                document.getElementById("cal-ad-year-select").value = calAdYear;
                document.getElementById("cal-ad-month-select").value = calAdMonth;
            }
        } else if (source === 'AD') {
            // Check the 15th of the AD month to find the 'majority' overlapping BS month
            const bsDate = convertADtoBS(calAdYear, calAdMonth, 15);
            if (bsDate) {
                calBsYear = bsDate.year;
                calBsMonth = bsDate.month;
                document.getElementById("cal-bs-year-select").value = calBsYear;
                document.getElementById("cal-bs-month-select").value = calBsMonth;
                
                await loadLunarData(calBsYear);
                renderBsCalendar();
            }
        }
    };

    // 1. BS Dropdowns Change
    document.getElementById("cal-bs-year-select").addEventListener("change", async (e) => {
      calBsYear = parseInt(e.target.value);
      await loadLunarData(calBsYear);
      syncDropdowns('BS'); 
      renderBsCalendar();
    });
    
    document.getElementById("cal-bs-month-select").addEventListener("change", (e) => {
      calBsMonth = parseInt(e.target.value);
      syncDropdowns('BS'); 
      renderBsCalendar();
    });

    // 2. AD Dropdowns Change
    document.getElementById("cal-ad-year-select").addEventListener("change", (e) => { 
        calAdYear = parseInt(e.target.value); 
        syncDropdowns('AD'); 
    });
    
    document.getElementById("cal-ad-month-select").addEventListener("change", (e) => { 
        calAdMonth = parseInt(e.target.value); 
        syncDropdowns('AD'); 
    });

    // 3. Next / Prev Buttons
    document.getElementById("bs-cal-prev").addEventListener("click", async () => {
      calBsMonth--;
      if (calBsMonth < 0) { calBsMonth = 11; calBsYear--; await loadLunarData(calBsYear); }
      if (calBsYear >= minBsYear) {
          syncDropdowns('BS'); 
          renderBsCalendar(); 
      } else calBsMonth = 0;
    });
    
    document.getElementById("bs-cal-next").addEventListener("click", async () => {
      calBsMonth++;
      if (calBsMonth > 11) { calBsMonth = 0; calBsYear++; await loadLunarData(calBsYear); }
      if (calBsYear <= maxBsYear) {
          syncDropdowns('BS'); 
          renderBsCalendar(); 
      } else calBsMonth = 11;
    });

    // 4. Initial Sync on Load
    syncDropdowns('BS');

    const adCalPrev = document.getElementById("ad-cal-prev");
    if (adCalPrev) {
      adCalPrev.addEventListener("click", () => { calAdMonth--; if (calAdMonth < 0) { calAdMonth = 11; calAdYear--; } renderAdCalendar(); });
      document.getElementById("ad-cal-next").addEventListener("click", () => { calAdMonth++; if (calAdMonth > 11) { calAdMonth = 0; calAdYear++; } renderAdCalendar(); });
    }
  }

  // --- MODAL ENGINE ---
    window.showDayDetails = (y, m, d) => {
        // 1. Gather Data
        const adDate = convertBStoAD(y, m, d);
        const lunarDayData = currentYearLunarData[`${m}-${d}`];
        const tithi = lunarDayData ? lunarDayData.tithi : "";
        
        let dailyEvents = [];
        if (lunarDayData && lunarDayData.events) dailyEvents.push(...lunarDayData.events);
        const fixedBs = getFixedEvent(m, d);
        if (fixedBs) dailyEvents.push(fixedBs);
        if (adDate) {
            const fixedAd = getAdFixedEvent(adDate.month, adDate.day);
            if (fixedAd) dailyEvents.push(fixedAd);
        }

        // --- NEW: Moon Icon Generator ---
        const getMoonIcon = (tithiText) => {
            if (!tithiText) return "";
            if (tithiText.includes("पूर्णिमा")) return " 🌕";
            if (tithiText.includes("औंसी")) return " 🌑";
            if (tithiText.includes("एकादशी")) return " 🌓";
            if (tithiText.includes("अष्टमी")) return " 🌗";
            return " 🌙"; 
        };

        // 2. Populate Modal Header (Formatted: २०८२ चैत्र ३०, सोमबार)
        const weekdayNameBs = adDate ? nepWeekdays[adDate.weekdayIndex] : "";
        document.getElementById('modal-title').innerText = `${toDevanagari(y)} ${nepMonthsDevanagari[m]} ${toDevanagari(d)}, ${weekdayNameBs}`;
        
        if(adDate) {
            const weekdayNameAd = engWeekdays[adDate.weekdayIndex];
            document.getElementById('modal-ad-date').innerText = `${engMonths[adDate.month]} ${adDate.day}, ${adDate.year}, ${weekdayNameAd}`;
        }

        // 3. Populate Tithi (Just the Tithi and Moon Icon)
        if (tithi) {
            document.getElementById('modal-tithi').innerText = `${tithi}${getMoonIcon(tithi)}`;
        } else {
            document.getElementById('modal-tithi').innerText = "";
        }

        // 4. Populate Events List
        const eventsList = document.getElementById('modal-events');
        eventsList.innerHTML = "";
        
        if (dailyEvents.length > 0) {
            dailyEvents.forEach(e => {
                const li = document.createElement('li');
                li.innerText = e.name;
                li.className = e.isHoliday ? 'holiday' : 'observance';
                eventsList.appendChild(li);
            });
        } else {
             eventsList.innerHTML = "<li class='empty'>कुनै विशेष पर्व छैन</li>";
        }

        // 5. Show Modal
        document.getElementById('day-modal').classList.remove('hidden');
    };

    // 6. Close Modal Listeners
    document.querySelector('.us-modal-close').addEventListener('click', () => {
        document.getElementById('day-modal').classList.add('hidden');
    });
    
    // Close if user clicks outside the modal box
    document.getElementById('day-modal').addEventListener('click', (e) => {
        if (e.target.id === 'day-modal') {
            document.getElementById('day-modal').classList.add('hidden');
        
        // --- MOBILE SWIPE NAVIGATION ---
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Attach listeners to the entire calendar grid area
    const calendarGrid = document.getElementById('bs-cal-grid');

    calendarGrid.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    calendarGrid.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    const handleSwipe = () => {
        const swipeThreshold = 50; // Minimum pixel distance to count as a deliberate swipe
        
        // Swiped Left (Finger moved from right to left) -> Go to Next Month
        if (touchEndX < touchStartX - swipeThreshold) {
            document.getElementById('bs-cal-next').click();
        }
        
        // Swiped Right (Finger moved from left to right) -> Go to Previous Month
        if (touchEndX > touchStartX + swipeThreshold) {
            document.getElementById('bs-cal-prev').click();
        }
    };

        }
    });

});