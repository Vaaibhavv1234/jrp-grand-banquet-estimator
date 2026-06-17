/* JRP Grand Banquet Estimator Core Script */

document.addEventListener("DOMContentLoaded", () => {
    // Pricing Constants
    const HALL_RENT = 10000;
    const TAX_RATE = 0.18; // 18% GST

    // DOM Elements
    const eventTypeSelect = document.getElementById("event-type");
    const eventDateInput = document.getElementById("event-date");
    const guestSlider = document.getElementById("guest-slider");
    const guestCountInput = document.getElementById("guest-count");
    
    const foodRadios = document.getElementsByName("food-package");
    const decorRadios = document.getElementsByName("decor-package");
    
    // Addons
    const addonDj = document.getElementById("addon-dj");
    const addonPhoto = document.getElementById("addon-photo");
    const addonLed = document.getElementById("addon-led");
    const addonAc = document.getElementById("addon-ac");
    
    // Live Output Displays
    const badgeEventType = document.getElementById("badge-event-type");
    const calcGrandTotal = document.getElementById("calc-grand-total");
    const calcCostPerGuest = document.getElementById("calc-cost-per-guest");
    const calcSubtotal = document.getElementById("calc-subtotal");
    const calcTax = document.getElementById("calc-tax");
    const invoiceItemsContainer = document.getElementById("invoice-items");
    
    // SVG Donut Chart elements
    const segmentHall = document.getElementById("segment-hall");
    const segmentFood = document.getElementById("segment-food");
    const segmentDecor = document.getElementById("segment-decor");
    const segmentAddons = document.getElementById("segment-addons");
    
    // Advisor & Enquiry elements
    const costAdvisor = document.getElementById("cost-advisor");
    const advisorText = document.querySelector(".advisor-text");
    const enquiryForm = document.getElementById("enquiry-form");
    const userSummary = document.getElementById("user-summary");
    const toast = document.getElementById("toast");
    const btnPrint = document.getElementById("btn-print");
    
    // Print Modal details
    const printDate = document.getElementById("print-date");
    const printId = document.getElementById("print-id");
    const printEventType = document.getElementById("print-event-type");
    const printEventDate = document.getElementById("print-event-date");
    const printGuests = document.getElementById("print-guests");
    const printTableBody = document.getElementById("print-table-body");
    const printSubtotal = document.getElementById("print-subtotal");
    const printTax = document.getElementById("print-tax");
    const printTotal = document.getElementById("print-total");

    // Initialize Default Date to 1 month from now if empty
    if (!eventDateInput.value) {
        const defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 1);
        eventDateInput.value = defaultDate.toISOString().split('T')[0];
        // Ensure date picker can't select past dates
        const todayStr = new Date().toISOString().split('T')[0];
        eventDateInput.min = todayStr;
    }

    // Set Date Picker Min to Today
    const today = new Date().toISOString().split('T')[0];
    eventDateInput.min = today;

    // Load Cached Local Storage Data if exists
    loadCachedInputs();

    // Event Listeners for Live Calculation Updates
    eventTypeSelect.addEventListener("change", () => { updateBadgeText(); calculateEstimate(); saveInputsToCache(); });
    eventDateInput.addEventListener("change", () => { calculateEstimate(); saveInputsToCache(); });
    
    // Sync guest count number field & slider
    guestSlider.addEventListener("input", (e) => {
        guestCountInput.value = e.target.value;
        calculateEstimate();
        saveInputsToCache();
    });
    
    guestCountInput.addEventListener("input", (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 10;
        if (val < 10) val = 10;
        if (val > 1000) val = 1000;
        guestSlider.value = val;
        calculateEstimate();
        saveInputsToCache();
    });

    guestCountInput.addEventListener("blur", (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 10) val = 10;
        if (val > 1000) val = 1000;
        guestCountInput.value = val;
        guestSlider.value = val;
        calculateEstimate();
        saveInputsToCache();
    });

    // Event listeners on food package radios
    foodRadios.forEach(radio => {
        radio.addEventListener("change", () => { calculateEstimate(); saveInputsToCache(); });
    });

    // Event listeners on decor package radios
    decorRadios.forEach(radio => {
        radio.addEventListener("change", () => { calculateEstimate(); saveInputsToCache(); });
    });

    // Event listeners on addons checkboxes
    [addonDj, addonPhoto, addonLed, addonAc].forEach(checkbox => {
        checkbox.addEventListener("change", () => { calculateEstimate(); saveInputsToCache(); });
    });

    // Initial Trigger
    updateBadgeText();
    calculateEstimate();

    // Formatting helper
    function formatCurrency(amount) {
        return "₹" + Math.round(amount).toLocaleString('en-IN');
    }

    // Badge event type updater
    function updateBadgeText() {
        badgeEventType.textContent = eventTypeSelect.value;
    }

    // Main Estimator Calculation Engine
    function calculateEstimate() {
        const guests = parseInt(guestCountInput.value) || 15;
        const eventType = eventTypeSelect.value;
        const dateVal = eventDateInput.value;

        // 1. Catering Calculation
        let cateringCostPerGuest = 299;
        let cateringPackageName = "Silver Package";
        foodRadios.forEach(radio => {
            if (radio.checked) {
                cateringCostPerGuest = parseInt(radio.value);
                cateringPackageName = radio.nextElementSibling.querySelector(".package-name").textContent;
            }
        });
        const totalCateringCost = cateringCostPerGuest * guests;

        // 2. Decoration Calculation
        let decorCost = 5000;
        let decorPackageName = "Basic Decor";
        decorRadios.forEach(radio => {
            if (radio.checked) {
                decorCost = parseInt(radio.value);
                decorPackageName = radio.nextElementSibling.querySelector(".decor-name").textContent;
            }
        });

        // 3. Add-ons Calculation
        let addonsCost = 0;
        const selectedAddons = [];
        
        if (addonDj.checked) {
            addonsCost += parseInt(addonDj.value);
            selectedAddons.push({ name: "DJ & Sound System", cost: parseInt(addonDj.value) });
        }
        if (addonPhoto.checked) {
            addonsCost += parseInt(addonPhoto.value);
            selectedAddons.push({ name: "Professional Photography", cost: parseInt(addonPhoto.value) });
        }
        if (addonLed.checked) {
            addonsCost += parseInt(addonLed.value);
            selectedAddons.push({ name: "LED Screen (12x8 ft)", cost: parseInt(addonLed.value) });
        }
        if (addonAc.checked) {
            addonsCost += parseInt(addonAc.value);
            selectedAddons.push({ name: "Air Conditioning", cost: parseInt(addonAc.value) });
        }

        // 4. Summaries & Taxes
        const subtotal = HALL_RENT + totalCateringCost + decorCost + addonsCost;
        const tax = subtotal * TAX_RATE;
        const grandTotal = subtotal + tax;
        const costPerGuest = grandTotal / guests;

        // 5. Update GUI Numbers
        calcSubtotal.textContent = formatCurrency(subtotal);
        calcTax.textContent = formatCurrency(tax);
        calcGrandTotal.textContent = formatCurrency(grandTotal);
        calcCostPerGuest.textContent = formatCurrency(costPerGuest);

        // 6. Dynamic Itemized Invoice List
        invoiceItemsContainer.innerHTML = "";
        
        // Hall rent row
        addInvoiceItemRow("Hall Rent (Fixed Base)", HALL_RENT);
        // Catering row
        addInvoiceItemRow(`Catering (${cateringPackageName} @ ₹${cateringCostPerGuest} × ${guests})`, totalCateringCost);
        // Decor row
        addInvoiceItemRow(`Decorations (${decorPackageName})`, decorCost);
        
        // Add-ons list
        selectedAddons.forEach(addon => {
            addInvoiceItemRow(addon.name, addon.cost);
        });

        // 7. Update Donut Visual Chart
        renderChart(HALL_RENT, totalCateringCost, decorCost, addonsCost, subtotal);

        // 8. Dynamic Cost Advisor Alerts
        renderAdvisorAlerts(guests, cateringCostPerGuest, decorCost, dateVal, selectedAddons);

        // 9. Form Prefill Summary
        updateEnquirySummary(eventType, dateVal, guests, cateringPackageName, decorPackageName, selectedAddons, grandTotal);
    }

    // Helper to inject items into the receipt
    function addInvoiceItemRow(description, cost) {
        const row = document.createElement("div");
        row.className = "breakdown-row";
        row.innerHTML = `
            <span>${description}</span>
            <span>${formatCurrency(cost)}</span>
        `;
        invoiceItemsContainer.appendChild(row);
    }

    // Chart Renderer using SVG stroke dasharray offsets
    function renderChart(hall, food, decor, addons, subtotal) {
        // Calculate shares
        const hallPct = (hall / subtotal) * 100;
        const foodPct = (food / subtotal) * 100;
        const decorPct = (decor / subtotal) * 100;
        const addonsPct = (addons / subtotal) * 100;

        // Circle circumference is exactly 100
        // Set dash array as "size remaining_size"
        segmentHall.style.strokeDasharray = `${hallPct} 100`;
        segmentHall.style.strokeDashoffset = "0";

        segmentFood.style.strokeDasharray = `${foodPct} 100`;
        segmentFood.style.strokeDashoffset = `-${hallPct}`;

        segmentDecor.style.strokeDasharray = `${decorPct} 100`;
        segmentDecor.style.strokeDashoffset = `-${hallPct + foodPct}`;

        segmentAddons.style.strokeDasharray = `${addonsPct} 100`;
        segmentAddons.style.strokeDashoffset = `-${hallPct + foodPct + decorPct}`;
    }

    // Dynamic Intelligent Cost Advisor
    function renderAdvisorAlerts(guests, cateringRate, decorCost, dateVal, selectedAddons) {
        let advice = "";
        
        // Date Check: Weekday Pricing Advice
        if (dateVal) {
            const dayOfWeek = new Date(dateVal).getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6); // Fri, Sat, Sun
            
            if (isWeekend) {
                advice = "💡 <strong>Weekend demand advice:</strong> Shifting your event date to a weekday (Monday-Thursday) might secure premium catering slot upgrades or negotiated rates!";
            }
        }

        // Guest count scaling optimization advice
        if (guests > 350 && cateringRate === 699) {
            advice = "💡 <strong>Budget Tip:</strong> For large crowds of " + guests + "+, choosing the Gold Menu (₹499/guest) instead of Platinum (₹699) will save you ₹" + ((699-499) * guests).toLocaleString('en-IN') + " on food packages alone!";
        } else if (guests < 50 && decorCost === 30000) {
            advice = "💡 <strong>Decor Advice:</strong> For smaller gatherings (less than 50 guests), the Premium Decor (₹15,000) provides excellent aesthetic presence while saving you ₹15,000 over Luxury Decor.";
        }

        // LED display usage tip
        if (selectedAddons.length === 0 && guests >= 150) {
            advice = "💡 <strong>Tip for grand events:</strong> Adding the DJ & Sound System (₹5,000) adds immense guest engagement value for gatherings over 150 guests!";
        }

        if (advice) {
            costAdvisor.classList.remove("hidden");
            advisorText.innerHTML = advice;
        } else {
            costAdvisor.classList.add("hidden");
        }
    }

    // Prefill the readonly summary box in enquiry form
    function updateEnquirySummary(type, date, guests, foodPkg, decorPkg, addons, total) {
        const formattedDate = date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Not Selected";
        const addonsStr = addons.map(a => a.name).join(", ") || "None";
        
        userSummary.value = `Event: ${type}
Date: ${formattedDate}
Guest Count: ${guests}
Packages Selected: Food (${foodPkg}), Decor (${decorPkg})
Add-ons: ${addonsStr}
Total Estimated Cost: ${formatCurrency(total)}`;
    }

    // Save configuration states to localStorage
    function saveInputsToCache() {
        const addons = {
            dj: addonDj.checked,
            photo: addonPhoto.checked,
            led: addonLed.checked,
            ac: addonAc.checked
        };
        
        let selectedFood = "299";
        foodRadios.forEach(r => { if (r.checked) selectedFood = r.value; });
        
        let selectedDecor = "5000";
        decorRadios.forEach(r => { if (r.checked) selectedDecor = r.value; });

        const config = {
            eventType: eventTypeSelect.value,
            eventDate: eventDateInput.value,
            guests: guestCountInput.value,
            food: selectedFood,
            decor: selectedDecor,
            addons: addons
        };

        localStorage.setItem("jrp_estimator_cache", JSON.stringify(config));
    }

    // Load configuration states from localStorage
    function loadCachedInputs() {
        const cacheRaw = localStorage.getItem("jrp_estimator_cache");
        if (!cacheRaw) return;

        try {
            const cache = JSON.parse(cacheRaw);
            
            eventTypeSelect.value = cache.eventType || "Wedding";
            
            if (cache.eventDate) {
                // Ensure cached date isn't in the past
                const cacheDate = new Date(cache.eventDate);
                const today = new Date();
                today.setHours(0,0,0,0);
                if (cacheDate >= today) {
                    eventDateInput.value = cache.eventDate;
                }
            }
            
            if (cache.guests) {
                guestCountInput.value = cache.guests;
                guestSlider.value = cache.guests;
            }

            if (cache.food) {
                foodRadios.forEach(r => {
                    r.checked = (r.value === cache.food);
                });
            }

            if (cache.decor) {
                decorRadios.forEach(r => {
                    r.checked = (r.value === cache.decor);
                });
            }

            if (cache.addons) {
                addonDj.checked = !!cache.addons.dj;
                addonPhoto.checked = !!cache.addons.photo;
                addonLed.checked = !!cache.addons.led;
                addonAc.checked = !!cache.addons.ac;
            }
        } catch (e) {
            console.error("Error parsing localstorage cache values:", e);
        }
    }

    // PDF / Print Layout generator
    btnPrint.addEventListener("click", () => {
        // Hydrate Print Invoice Modal Elements
        const dateObj = new Date();
        printDate.textContent = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        printId.textContent = "EST-" + Math.floor(100000 + Math.random() * 900000);
        
        printEventType.textContent = eventTypeSelect.value;
        const eventDateStr = eventDateInput.value;
        printEventDate.textContent = eventDateStr ? new Date(eventDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : "TBD";
        printGuests.textContent = guestCountInput.value + " Guests";

        // Hydrate Print Invoice Details Table
        printTableBody.innerHTML = "";
        
        // Base Hall Rent Row
        addPrintTableRow("Hall Rent (Fixed base price setup)", "Fixed Contract", HALL_RENT);

        // Catering details row
        let foodRate = 299;
        let foodName = "Silver Package";
        foodRadios.forEach(r => {
            if (r.checked) {
                foodRate = parseInt(r.value);
                foodName = r.nextElementSibling.querySelector(".package-name").textContent;
            }
        });
        const guestCount = parseInt(guestCountInput.value);
        addPrintTableRow(`Catering: ${foodName} Menu Selection`, `₹${foodRate} per guest × ${guestCount}`, foodRate * guestCount);

        // Decor details row
        let decorRate = 5000;
        let decorName = "Basic Decor";
        decorRadios.forEach(r => {
            if (r.checked) {
                decorRate = parseInt(r.value);
                decorName = r.nextElementSibling.querySelector(".decor-name").textContent;
            }
        });
        addPrintTableRow(`Decoration: ${decorName} Setup Theme`, "Selected tier package", decorRate);

        // Add-ons
        if (addonDj.checked) addPrintTableRow("DJ & Sound System Setup", "Event Service Add-on", parseInt(addonDj.value));
        if (addonPhoto.checked) addPrintTableRow("Professional Photography (Full Event Coverage)", "Event Service Add-on", parseInt(addonPhoto.value));
        if (addonLed.checked) addPrintTableRow("LED Screen Display (12x8 ft setup)", "Equipment Add-on", parseInt(addonLed.value));
        if (addonAc.checked) addPrintTableRow("Banquet Hall Air Conditioning (AC)", "Climate Service Add-on", parseInt(addonAc.value));

        // Subtotals, Taxes & Grand Total calculations
        const subtotal = parseInt(calcSubtotal.textContent.replace(/[^\d]/g, ""));
        const tax = parseInt(calcTax.textContent.replace(/[^\d]/g, ""));
        const total = parseInt(calcGrandTotal.textContent.replace(/[^\d]/g, ""));

        printSubtotal.textContent = formatCurrency(subtotal);
        printTax.textContent = formatCurrency(tax);
        printTotal.textContent = formatCurrency(total);

        // Trigger native printing popup window
        window.print();
    });

    // Helper for adding print table rows
    function addPrintTableRow(item, scheme, amount) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item}</td>
            <td>${scheme}</td>
            <td class="text-right">${amount.toLocaleString('en-IN')}</td>
        `;
        printTableBody.appendChild(tr);
    }

    // Enquiry Contact Form Submission
    enquiryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Simulated form submission (validates fields then triggers Toast indicator)
        const name = document.getElementById("user-name").value;
        const phone = document.getElementById("user-phone").value;
        const email = document.getElementById("user-email").value;
        const message = document.getElementById("user-message").value;
        const summary = userSummary.value;

        // Print details to simulated server log / console
        console.log("Enquiry Submission Logs:", { name, phone, email, summary, message });

        // Trigger Toast UI Alert
        toast.classList.remove("hidden");
        setTimeout(() => {
            toast.classList.add("show");
        }, 10);

        // Reset inputs except readonly summary
        document.getElementById("user-name").value = "";
        document.getElementById("user-phone").value = "";
        document.getElementById("user-email").value = "";
        document.getElementById("user-message").value = "";

        // Dismiss Toast after 4 seconds
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => {
                toast.classList.add("hidden");
            }, 400);
        }, 4000);
    });
});
