// --- Constants & Data ---
const engMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const nepMonths = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
const nepMonthsDevanagari = ['वैशाख', 'जेष्ठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन', 'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुण', 'चैत्र'];
const engWeekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const nepWeekdays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];

// Reference Date Map (Ground Zero)
const REF_AD_YEAR = 1943;
const REF_AD_MONTH = 3; 
const REF_AD_DAY = 14;

const REF_BS_YEAR = 2000;
const REF_BS_MONTH = 0; 
const REF_BS_DAY = 1;

let nepaliMonthDays = {};
let minBsYear = 2000;
let maxBsYear = 2090;

const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
const getAdDaysInMonth = (y, m) => [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];
const getUTCDays = (y, m, d) => Math.floor(Date.UTC(y, m, d) / 86400000);

const devMap = {'0':'०','1':'१','2':'२','3':'३','4':'४','5':'५','6':'६','7':'७','8':'८','9':'९'};
const toDevanagari = (num) => String(num).split('').map(c => devMap[c] || c).join('');

// --- Upgraded Bidirectional Time Engine ---

const convertADtoBS = (adY, adM, adD) => {
    let daysPassed = getUTCDays(adY, adM, adD) - getUTCDays(REF_AD_YEAR, REF_AD_MONTH, REF_AD_DAY);
    let bsY = REF_BS_YEAR, bsM = REF_BS_MONTH, bsD = REF_BS_DAY;

    if (daysPassed >= 0) {
        // Forward Calculation (Dates after April 14, 1943)
        while (daysPassed > 0) {
            if (!nepaliMonthDays[bsY]) return null;
            const daysLeft = nepaliMonthDays[bsY][bsM] - bsD + 1;
            if (daysPassed >= daysLeft) {
                daysPassed -= daysLeft;
                bsD = 1; bsM++;
                if (bsM > 11) { bsM = 0; bsY++; }
            } else {
                bsD += daysPassed; daysPassed = 0;
            }
        }
    } else {
        // Backward Calculation (Dates before April 14, 1943)
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
        // Forward Calculation
        let currY = REF_BS_YEAR, currM = REF_BS_MONTH;
        while (currY < bsY || (currY === bsY && currM < bsM)) {
            daysPassed += nepaliMonthDays[currY][currM];
            currM++;
            if (currM > 11) { currM = 0; currY++; }
        }
        daysPassed += bsD - REF_BS_DAY;
    } else {
        // Backward Calculation
        let currY = REF_BS_YEAR - 1, currM = 11;
        while (currY > bsY || (currY === bsY && currM >= bsM)) {
            daysPassed -= nepaliMonthDays[currY][currM];
            currM--;
            if (currM < 0) { currM = 11; currY--; }
        }
        daysPassed += (bsD - 1); 
    }

    const targetAD = new Date(Date.UTC(REF_AD_YEAR, REF_AD_MONTH, REF_AD_DAY));
    targetAD.setUTCDate(targetAD.getUTCDate() + daysPassed);
    return { year: targetAD.getUTCFullYear(), month: targetAD.getUTCMonth(), day: targetAD.getUTCDate(), weekdayIndex: targetAD.getUTCDay() };
};



// 1. Fixed BS Events (Happen on the exact same BS date every year)
// Format: 'MonthIndex-Day' (e.g., '4-24' is the 5th month, 24th day)
const getFixedEvent = (bsMonth, bsDay) => {
    const events = {
        '0-1': { name: 'नव वर्ष', isHoliday: true },
        '0-11': { name: 'लोकतन्त्र दिवस', isHoliday: true },
        '4-24': { name: 'नारी दिवस', isHoliday: false }, // Your corrected BS date
        '9-1': { name: 'माघे संक्रान्ति', isHoliday: true },
        '10-7': { name: 'प्रजातन्त्र दिवस', isHoliday: true }
    };
    return events[`${bsMonth}-${bsDay}`] || null;
};

// 2. Fixed AD Events (International events fixed on the Gregorian calendar)
// Format: 'AdMonthIndex-Day' (e.g., '4-1' is May 1st because Jan = 0)
const getAdFixedEvent = (adMonth, adDay) => {
    const events = {
        '0-1': { name: 'अंग्रेजी नयाँ वर्ष', isHoliday: false }, // Jan 1
        '2-8': { name: 'अन्तर्राष्ट्रिय नारी दिवस', isHoliday: false }, // March 8 (If you want the international one!)
        '4-1': { name: 'श्रम दिवस', isHoliday: true },           // May 1
        '11-25': { name: 'क्रिसमस डे', isHoliday: true }          // Dec 25
    };
    return events[`${adMonth}-${adDay}`] || null;
};

// 3. Lunar Events (Change dates every year based on the moon)
// Format: 'Year-MonthIndex-Day'
const getLunarEvent = (bsYear, bsMonth, bsDay) => {
    const events = {
        '2082-11-4': { name: 'घोडेजात्रा', isHoliday: false },
        '2082-11-13': { name: 'राम नवमी', isHoliday: true }
    };
    return events[`${bsYear}-${bsMonth}-${bsDay}`] || null;
};

// 4. Master Lookup: Checks Lunar -> BS Fixed -> AD Fixed
const getEventData = (bsYear, bsMonth, bsDay, adMonth, adDay) => {
    // It checks them in priority order. If a Lunar event and an AD event 
    // happen on the same day, the Lunar event will display.
    return getLunarEvent(bsYear, bsMonth, bsDay) || 
           getFixedEvent(bsMonth, bsDay) || 
           (adMonth !== null ? getAdFixedEvent(adMonth, adDay) : null);
};



// --- Initialization & UI Logic ---

document.addEventListener('DOMContentLoaded', () => {
    
    // Fetch the external JSON file
    fetch('libs/date.json')
        .then(response => response.json())
        .then(data => {
            nepaliMonthDays = data;
            
            // Automatically detect min and max years from the JSON keys
            const years = Object.keys(nepaliMonthDays).map(Number);
            minBsYear = Math.min(...years);
            maxBsYear = Math.max(...years);
            
            // Initialize App
            initializeApp();
        })
        .catch(err => {
            console.error("Error loading date.json:", err);
            document.getElementById('current-date-text').textContent = "Error loading calendar data.";
        });

    function initializeApp() {
        const now = new Date();
        const todayAd = { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
        const todayBsRaw = convertADtoBS(todayAd.year, todayAd.month, todayAd.day);
        const todayBs = todayBsRaw || { year: 2082, month: 11, day: 8 };

        let calBsYear = todayBs.year, calBsMonth = todayBs.month;
        let calAdYear = todayAd.year, calAdMonth = todayAd.month;

        document.getElementById('current-date-text').textContent = 
            `आज: मिति ${toDevanagari(todayBs.year)} साल ${nepMonthsDevanagari[todayBs.month]} ${toDevanagari(todayBs.day)} गते, ${nepWeekdays[todayBs.weekdayIndex]} | ${engMonths[todayAd.month]} ${todayAd.day}, ${todayAd.year}, ${engWeekdays[now.getDay()]}`;

        const populateAllDropdowns = () => {
            const adY = document.getElementById('ad-year');
            const adM = document.getElementById('ad-month');
            const adD = document.getElementById('ad-day');
            const bsY = document.getElementById('bs-year');
            const bsM = document.getElementById('bs-month');
            const bsD = document.getElementById('bs-day');
            
            const calAdY = document.getElementById('cal-ad-year-select');
            const calAdM = document.getElementById('cal-ad-month-select');
            const calBsY = document.getElementById('cal-bs-year-select');
            const calBsM = document.getElementById('cal-bs-month-select');

            // Dynamically calculate the AD limits based on BS limits
            const minAd = convertBStoAD(minBsYear, 0, 1).year;
            const maxAd = convertBStoAD(maxBsYear, 11, 30).year;

            for(let y=minAd; y<=maxAd; y++) {
                adY.add(new Option(y, y));
                calAdY.add(new Option(y, y));
            }
            for(let y=minBsYear; y<=maxBsYear; y++) {
                bsY.add(new Option(toDevanagari(y), y));
                calBsY.add(new Option(toDevanagari(y), y));
            }

            engMonths.forEach((m, i) => { adM.add(new Option(m, i)); calAdM.add(new Option(m, i)); });
            nepMonthsDevanagari.forEach((m, i) => { bsM.add(new Option(m, i)); calBsM.add(new Option(m, i)); });

            adY.value = todayAd.year;
            adM.value = todayAd.month;
            for(let i=1; i<=31; i++) adD.add(new Option(i, i));
            adD.value = todayAd.day;

            bsY.value = todayBs.year;
            bsM.value = todayBs.month;
            for(let i=1; i<=32; i++) bsD.add(new Option(toDevanagari(i), i));
            bsD.value = todayBs.day;
        };
        populateAllDropdowns();

        const updateAdDays = () => {
            const dSel = document.getElementById('ad-day');
            const curr = dSel.value;
            const max = getAdDaysInMonth(parseInt(document.getElementById('ad-year').value), parseInt(document.getElementById('ad-month').value));
            dSel.innerHTML = '';
            for(let i=1; i<=max; i++) dSel.add(new Option(i, i));
            dSel.value = curr <= max ? curr : max;
        };
        const updateBsDays = () => {
            const dSel = document.getElementById('bs-day');
            const curr = dSel.value;
            const y = parseInt(document.getElementById('bs-year').value);
            const m = parseInt(document.getElementById('bs-month').value);
            if(nepaliMonthDays[y]) {
                const max = nepaliMonthDays[y][m];
                dSel.innerHTML = '';
                for(let i=1; i<=max; i++) dSel.add(new Option(toDevanagari(i), i));
                dSel.value = curr <= max ? curr : max;
            }
        };
        
        document.getElementById('ad-year').addEventListener('change', updateAdDays);
        document.getElementById('ad-month').addEventListener('change', updateAdDays);
        document.getElementById('bs-year').addEventListener('change', updateBsDays);
        document.getElementById('bs-month').addEventListener('change', updateBsDays);

        const setupTabs = (btnClass) => {
            document.querySelectorAll(btnClass).forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const parent = e.target.closest('.card-container');
                    parent.querySelectorAll(btnClass).forEach(b => b.classList.remove('active'));
                    parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    e.target.classList.add('active');
                    document.getElementById(e.target.dataset.tab).classList.add('active');
                    if (btnClass === '.main-tab') document.getElementById('output-section').classList.add('hidden');
                });
            });
        };
        setupTabs('.main-tab'); setupTabs('.cal-tab');

        const showResult = (text) => {
            document.getElementById('error-message').classList.add('hidden');
            document.getElementById('result-text').textContent = text;
            document.getElementById('output-section').classList.remove('hidden');
        };
        const showError = (text) => {
            document.getElementById('result-text').textContent = '';
            document.getElementById('error-message').textContent = text;
            document.getElementById('error-message').classList.remove('hidden');
            document.getElementById('output-section').classList.remove('hidden');
        };

        document.getElementById('form-ad-to-bs').addEventListener('submit', (e) => {
            e.preventDefault();
            const res = convertADtoBS(parseInt(document.getElementById('ad-year').value), parseInt(document.getElementById('ad-month').value), parseInt(document.getElementById('ad-day').value));
            if(res) showResult(`${toDevanagari(res.year)} ${nepMonthsDevanagari[res.month]} ${toDevanagari(res.day)}, ${nepWeekdays[res.weekdayIndex]}`);
            else showError("Out of range.");
        });

        document.getElementById('form-bs-to-ad').addEventListener('submit', (e) => {
            e.preventDefault();
            const res = convertBStoAD(parseInt(document.getElementById('bs-year').value), parseInt(document.getElementById('bs-month').value), parseInt(document.getElementById('bs-day').value));
            if(res) showResult(`${res.year} ${engMonths[res.month]} ${res.day}, ${engWeekdays[res.weekdayIndex]}`);
            else showError("Out of range.");
        });

        document.querySelectorAll('.reset-btn').forEach(b => b.addEventListener('click', () => document.getElementById('output-section').classList.add('hidden')));

        document.getElementById('copy-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(document.getElementById('result-text').textContent);
            document.getElementById('copy-btn').style.color = 'var(--color-success)';
            setTimeout(() => document.getElementById('copy-btn').style.color = '', 2000);
        });

        const renderBsCalendar = () => {
            document.getElementById('cal-bs-year-select').value = calBsYear;
            document.getElementById('cal-bs-month-select').value = calBsMonth;
            
            const firstDayAd = convertBStoAD(calBsYear, calBsMonth, 1);
            if(!firstDayAd) return;
            
            const totalDays = nepaliMonthDays[calBsYear][calBsMonth];
            const cont = document.getElementById('bs-cal-days');
            cont.innerHTML = '';

            const isPro = document.querySelector('.pro-date-grid') !== null;

            let prevY = calBsYear, prevM = calBsMonth - 1;
            if (prevM < 0) { prevM = 11; prevY--; }
            
            if (isPro && nepaliMonthDays[prevY]) {
                const prevTotalDays = nepaliMonthDays[prevY][prevM];
                const startPrevDay = prevTotalDays - firstDayAd.weekdayIndex + 1;
                for (let i = 0; i < firstDayAd.weekdayIndex; i++) {
                    let pDay = startPrevDay + i;
                    const pAdDate = convertBStoAD(prevY, prevM, pDay);
                    let engLabel = pAdDate ? pAdDate.day : '';
                    if (pAdDate && pAdDate.day === 1) engLabel = engMonths[pAdDate.month].substring(0,3) + " " + pAdDate.day;
                    cont.innerHTML += `<div class="cal-day muted">${toDevanagari(pDay)}<span class="eng-date-small">${engLabel}</span></div>`;
                }
            } else {
                for (let i = 0; i < firstDayAd.weekdayIndex; i++) cont.innerHTML += `<div class="cal-day empty"></div>`;
            }

            // Build the current month's days
            for (let i = 1; i <= totalDays; i++) {
                const isToday = (todayBs.year === calBsYear && todayBs.month === calBsMonth && todayBs.day === i);
                
                // Calculate Weekends
                const currentWeekday = (firstDayAd.weekdayIndex + i - 1) % 7;
                const isWeekend = currentWeekday === 0 || currentWeekday === 6; 
                
                // CRITICAL UPDATE: Calculate the exact AD date for this BS day FIRST
                const adDate = convertBStoAD(calBsYear, calBsMonth, i);
                
                // EVENT CHECK: Now pass both the BS info AND the AD info to the engine
                let eventData = null;
                if (adDate) {
                    eventData = getEventData(calBsYear, calBsMonth, i, adDate.month, adDate.day);
                } else {
                    eventData = getEventData(calBsYear, calBsMonth, i, null, null);
                }
                
                // Build the CSS classes
                let classList = "cal-day";
                if (isToday) classList += " today";
                if (isWeekend || (eventData && eventData.isHoliday)) classList += " holiday";
                
                // Create the event text span
                let eventHtml = "";
                if (eventData) {
                    const labelClass = eventData.isHoliday ? "event-label" : "event-label observance";
                    eventHtml = `<span class="${labelClass}">${eventData.name}</span>`;
                }

                if (isPro) {
                    let engLabel = adDate ? adDate.day : '';
                    if (adDate && adDate.day === 1) engLabel = engMonths[adDate.month].substring(0,3) + " " + adDate.day;
                    
                    cont.innerHTML += `<div class="${classList}">${eventHtml}${toDevanagari(i)}<span class="eng-date-small">${engLabel}</span></div>`;
                } else {
                    cont.innerHTML += `<div class="${classList}">${eventHtml}${toDevanagari(i)}</div>`;
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
                        let engLabel = nAdDate ? nAdDate.day : '';
                        if (nAdDate && nAdDate.day === 1) engLabel = engMonths[nAdDate.month].substring(0,3) + " " + nAdDate.day;
                        cont.innerHTML += `<div class="cal-day muted">${toDevanagari(i)}<span class="eng-date-small">${engLabel}</span></div>`;
                    }
                }
            }
        };

        const renderAdCalendar = () => {
            document.getElementById('cal-ad-year-select').value = calAdYear;
            document.getElementById('cal-ad-month-select').value = calAdMonth;
            
            const firstDay = new Date(calAdYear, calAdMonth, 1).getDay();
            const totalDays = new Date(calAdYear, calAdMonth + 1, 0).getDate();
            const cont = document.getElementById('ad-cal-days');
            cont.innerHTML = '';

            for (let i = 0; i < firstDay; i++) cont.innerHTML += `<div class="cal-day empty"></div>`;
            for (let i = 1; i <= totalDays; i++) {
                const isToday = (todayAd.year === calAdYear && todayAd.month === calAdMonth && todayAd.day === i);
                
                const currentWeekday = (firstDay + i - 1) % 7;
                const isWeekend = currentWeekday === 0 || currentWeekday === 6;

                let classList = "cal-day";
                if (isToday) classList += " today";
                if (isWeekend) classList += " holiday";

                cont.innerHTML += `<div class="${classList}">${i}</div>`;
            }
        };

        renderBsCalendar(); 
        if(document.getElementById('ad-cal-days')) renderAdCalendar();

        document.getElementById('cal-bs-year-select').addEventListener('change', (e) => { calBsYear = parseInt(e.target.value); renderBsCalendar(); });
        document.getElementById('cal-bs-month-select').addEventListener('change', (e) => { calBsMonth = parseInt(e.target.value); renderBsCalendar(); });
        
        document.getElementById('cal-ad-year-select').addEventListener('change', (e) => { calAdYear = parseInt(e.target.value); renderAdCalendar(); });
        document.getElementById('cal-ad-month-select').addEventListener('change', (e) => { calAdMonth = parseInt(e.target.value); renderAdCalendar(); });

        document.getElementById('bs-cal-prev').addEventListener('click', () => {
            calBsMonth--; if (calBsMonth < 0) { calBsMonth = 11; calBsYear--; }
            if(calBsYear >= minBsYear) renderBsCalendar(); else calBsMonth = 0;
        });
        document.getElementById('bs-cal-next').addEventListener('click', () => {
            calBsMonth++; if (calBsMonth > 11) { calBsMonth = 0; calBsYear++; }
            if(calBsYear <= maxBsYear) renderBsCalendar(); else calBsMonth = 11;
        });
        
        const adCalPrev = document.getElementById('ad-cal-prev');
        if(adCalPrev) {
            adCalPrev.addEventListener('click', () => {
                calAdMonth--; if (calAdMonth < 0) { calAdMonth = 11; calAdYear--; }
                renderAdCalendar();
            });
            document.getElementById('ad-cal-next').addEventListener('click', () => {
                calAdMonth++; if (calAdMonth > 11) { calAdMonth = 0; calAdYear++; }
                renderAdCalendar();
            });
        }
    }
});