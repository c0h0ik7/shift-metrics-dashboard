// Main application logic - Month → Shift → Categories → Trend
// VERSION 2.1 - Bug fix for YTD variable collision + Dark Mode
console.log('📊 Dashboard JS Version 2.1 loaded');

let currentMonth = null;
let currentShift = null;
let currentChart = null;  // Store current Chart.js instance

// ========================================
// ENHANCEMENT 2: ANIMATED COUNT-UP NUMBERS
// ========================================

function animateValue(element, start, end, duration = 1000) {
    if (!element) return;
    
    const startTime = performance.now();
    const isDecimal = end % 1 !== 0;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOut;
        
        if (isDecimal) {
            element.textContent = current.toFixed(1);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = isDecimal ? end.toFixed(1) : end.toLocaleString();
        }
    }
    
    requestAnimationFrame(update);
}

// Animate all stat values on page
function animateStatCards() {
    // Animate overview stats
    setTimeout(() => {
        document.querySelectorAll('.stat-value').forEach(element => {
            const text = element.textContent.trim();
            const match = text.match(/([\d,]+\.?\d*)/); // Extract number
            
            if (match) {
                const value = parseFloat(match[1].replace(/,/g, ''));
                element.textContent = '0';
                animateValue(element, 0, value, 1500);
            }
        });
    }, 100);
    
    // Animate YTD values
    setTimeout(() => {
        document.querySelectorAll('.ytd-card-value, .shift-ytd-value').forEach(element => {
            const text = element.textContent.trim();
            const match = text.match(/([\d,]+\.?\d*)/);
            
            if (match) {
                const value = parseFloat(match[1].replace(/,/g, ''));
                element.textContent = '0';
                animateValue(element, 0, value, 1200);
            }
        });
    }, 300);
    
    // Animate ranking scores
    setTimeout(() => {
        document.querySelectorAll('.rank-score').forEach(element => {
            const text = element.textContent.trim();
            const match = text.match(/(\d+)/);
            
            if (match) {
                const value = parseInt(match[1]);
                element.textContent = '0%';
                
                const scoreElement = element;
                const startTime = performance.now();
                
                function updateScore(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / 1000, 1);
                    const current = Math.floor(value * progress);
                    
                    scoreElement.textContent = current + '%';
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateScore);
                    } else {
                        scoreElement.textContent = value + '%';
                    }
                }
                
                requestAnimationFrame(updateScore);
            }
        });
    }, 500);
}

// Dark Mode Functionality
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    }
    
    // Toggle dark mode on button click
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        if (isDarkMode) {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light Mode';
            localStorage.setItem('theme', 'dark');
            console.log('🌙 Dark mode activated');
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark Mode';
            localStorage.setItem('theme', 'light');
            console.log('☀️ Light mode activated');
        }
    });
    
    // Keyboard shortcut: Ctrl/Cmd + D for dark mode
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            darkModeToggle.click();
        }
    });
}

// Initialize the application
function init() {
    initDarkMode();
    console.log('Dashboard initializing...');
    console.log('shiftMetrics available:', typeof shiftMetrics !== 'undefined');
    if (typeof shiftMetrics !== 'undefined') {
        console.log('Number of shifts:', Object.keys(shiftMetrics).length);
    }
    setupMonthListeners();
    setupShiftListeners();
    setupComparisonListeners();
    updateLastUpdatedTime();
    console.log('Dashboard initialized!');
}

// Set up comparison mode event listeners
function setupComparisonListeners() {
    const compareButton = document.getElementById('compareButton');
    const startCompareButton = document.getElementById('startCompareButton');
    const cancelCompareButton = document.getElementById('cancelCompareButton');
    const backFromComparisonButton = document.getElementById('backFromComparisonButton');
    
    if (compareButton) {
        compareButton.addEventListener('click', enableComparisonMode);
    }
    
    if (startCompareButton) {
        startCompareButton.addEventListener('click', startComparison);
    }
    
    if (cancelCompareButton) {
        cancelCompareButton.addEventListener('click', disableComparisonMode);
    }
    
    if (backFromComparisonButton) {
        backFromComparisonButton.addEventListener('click', backFromComparison);
    }
}

// Set up event listeners for month cards
function setupMonthListeners() {
    const monthCards = document.querySelectorAll('.month-card');
    console.log('Found month cards:', monthCards.length);
    
    monthCards.forEach(card => {
        card.addEventListener('click', () => {
            const month = card.getAttribute('data-month');
            console.log('Month clicked:', month);
            showShiftsForMonth(month);
        });
        
        // Add keyboard accessibility
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View ${card.querySelector('h3').textContent} shifts`);
        
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const month = card.getAttribute('data-month');
                showShiftsForMonth(month);
            }
        });
    });
}

// Set up event listeners for shift cards
function setupShiftListeners() {
    const shiftCards = document.querySelectorAll('.shift-card:not(.overview-card)');
    console.log('Found shift cards:', shiftCards.length);
    
    // Setup overview card listener
    const overviewCard = document.getElementById('overviewCard');
    if (overviewCard) {
        overviewCard.addEventListener('click', () => {
            console.log('Overview clicked for month:', currentMonth);
            showOverview(currentMonth);
        });
        overviewCard.setAttribute('tabindex', '0');
        overviewCard.setAttribute('role', 'button');
        overviewCard.setAttribute('aria-label', 'View month overview');
        overviewCard.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showOverview(currentMonth);
            }
        });
    }
    
    shiftCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // If in comparison mode, toggle selection instead
            if (comparisonMode) {
                e.preventDefault();
                e.stopPropagation();
                toggleShiftSelection(card);
                return;
            }
            
            const shiftId = card.getAttribute('data-shift');
            console.log('Shift clicked:', shiftId, 'for month:', currentMonth);
            showShiftDetails(shiftId, currentMonth);
        });
        
        // Add keyboard accessibility
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View ${card.querySelector('h3').textContent} metrics`);
        
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                
                // If in comparison mode, toggle selection instead
                if (comparisonMode) {
                    toggleShiftSelection(card);
                    return;
                }
                
                const shiftId = card.getAttribute('data-shift');
                showShiftDetails(shiftId, currentMonth);
            }
        });
    });

    // Back button event listeners
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', backToShifts);
    }
    
    const backToMonthsButton = document.getElementById('backToMonthsButton');
    if (backToMonthsButton) {
        backToMonthsButton.addEventListener('click', backToMonths);
    }
    
    const backFromOverviewButton = document.getElementById('backFromOverviewButton');
    if (backFromOverviewButton) {
        backFromOverviewButton.addEventListener('click', backToShifts);
    }
}

// ========================================
// BREADCRUMB NAVIGATION FUNCTIONS
// ========================================

function updateBreadcrumb(level, monthName = null, viewName = null) {
    const breadcrumb = document.getElementById('breadcrumb');
    const breadcrumbMonth = document.getElementById('breadcrumbMonth');
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    const sep1 = document.getElementById('breadcrumbSep1');
    const sep2 = document.getElementById('breadcrumbSep2');
    
    if (!breadcrumb) return; // Safety check
    
    if (level === 'home') {
        breadcrumb.style.display = 'none';
    } else if (level === 'month') {
        breadcrumb.style.display = 'flex';
        breadcrumbMonth.style.display = 'none';
        breadcrumbCurrent.style.display = 'inline';
        breadcrumbCurrent.textContent = `📅 ${monthName}`;
        sep1.style.display = 'inline';
        sep2.style.display = 'none';
    } else if (level === 'view') {
        breadcrumb.style.display = 'flex';
        breadcrumbMonth.style.display = 'inline';
        breadcrumbMonth.textContent = `📅 ${monthName}`;
        breadcrumbCurrent.style.display = 'inline';
        breadcrumbCurrent.textContent = viewName;
        sep1.style.display = 'inline';
        sep2.style.display = 'inline';
    }
}

// Show shifts for selected month
function showShiftsForMonth(month) {
    currentMonth = month;
    
    // Update title
    document.getElementById('selectedMonthTitle').textContent = `${month} 2025 - Select Shift`;
    
    // Hide month grid, show shift section
    document.getElementById('monthGrid').style.display = 'none';
    document.getElementById('shiftSection').style.display = 'block';
    document.getElementById('metricsDetail').style.display = 'none';
    document.getElementById('comparisonSection').style.display = 'none';
    
    // Show compare button
    document.getElementById('compareButton').style.display = 'block';
    document.getElementById('comparisonToolbar').style.display = 'none';
    
    // Update breadcrumb
    updateBreadcrumb('month', month);
}

// Show shift details for specific month
function showShiftDetails(shiftId, month) {
    console.log('showShiftDetails called with:', shiftId, month);
    currentShift = shiftId;
    const shiftData = shiftMetrics[shiftId];
    
    if (!shiftData) {
        console.error(`No data found for shift: ${shiftId}`);
        alert('No data found for shift: ' + shiftId);
        return;
    }
    console.log('Shift data found:', shiftData.name);

    // Update title
    document.getElementById('selectedShiftTitle').textContent = `${shiftData.name} - ${month} 2025`;

    // Build metrics container - FILTERED BY MONTH
    const metricsContainer = document.getElementById('metricsContainer');
    metricsContainer.innerHTML = '';
    
    // Add YTD tracking for this shift (if not February)
    const fiscalMonths = ['February', 'March', 'April', 'May', 'June', 'July',
                          'August', 'September', 'October', 'November', 'December', 'January'];
    const fiscalIndex = fiscalMonths.indexOf(month);
    
    if (fiscalIndex > 0) {
        const ytdSection = createShiftYTDSection(shiftId, shiftData, month, fiscalIndex);
        metricsContainer.appendChild(ytdSection);
    }

    // Create a section for each category
    Object.entries(shiftData.categories).forEach(([categoryName, subcategories]) => {
        const categorySection = createCategorySection(categoryName, subcategories, month);
        metricsContainer.appendChild(categorySection);
    });

    // Hide month and shift section, show details
    document.getElementById('monthGrid').style.display = 'none';
    document.getElementById('shiftSection').style.display = 'none';
    document.getElementById('metricsDetail').style.display = 'block';
    
    // Update breadcrumb
    updateBreadcrumb('view', month, `🎯 ${shiftData.name}`);
}

// Create a category section with subcategories (filtered by month) - COMPACT VIEW
function createCategorySection(categoryName, subcategories, month) {
    const section = document.createElement('div');
    section.className = 'category-section';

    // Category header
    const header = document.createElement('h3');
    const icon = categoryIcons[categoryName] || '📊';
    header.innerHTML = `<span class="category-icon">${icon}</span> ${categoryName}`;
    section.appendChild(header);

    // Create a horizontal container for all subcategories
    const metricsRow = document.createElement('div');
    metricsRow.className = 'metrics-row';

    // Process subcategories - display inline
    Object.entries(subcategories).forEach(([subcategoryName, monthlyData]) => {
        const metricCard = createCompactMetricCard(subcategoryName, monthlyData, month);
        metricsRow.appendChild(metricCard);
    });

    section.appendChild(metricsRow);
    return section;
}

// Create a compact metric card for inline display
function createCompactMetricCard(subcategoryName, monthlyData, selectedMonth) {
    const card = document.createElement('div');
    card.className = 'compact-metric-card';

    // Find the data for this specific month
    const monthData = monthlyData.find(data => data.month === selectedMonth);
    
    if (monthData) {
        // Add status class for color coding
        card.classList.add(monthData.status);
        
        // Metric name
        const name = document.createElement('div');
        name.className = 'metric-name';
        name.textContent = subcategoryName;
        card.appendChild(name);
        
        // Status icon
        const statusIcon = document.createElement('div');
        statusIcon.className = 'metric-icon';
        statusIcon.textContent = monthData.status === 'green' ? '✅' : '❌';
        card.appendChild(statusIcon);
        
        // Value
        const value = document.createElement('div');
        value.className = 'metric-value';
        value.textContent = monthData.value;
        card.appendChild(value);
        
        // Add click handler for inline trend chart
        if (monthData.weeklyRaw && monthData.weeklyRaw.length > 0) {
            card.addEventListener('click', () => {
                showInlineTrendChart(card, subcategoryName, monthData, selectedMonth);
            });
            
            // Add keyboard accessibility
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `View weekly trend for ${subcategoryName}`);
            
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    showInlineTrendChart(card, subcategoryName, monthData, selectedMonth);
                }
            });
        }
    } else {
        card.textContent = `${subcategoryName}: No data`;
        card.style.color = '#999';
    }

    return card;
}

// Create a month card with status
function createMonthCard(monthData) {
    const card = document.createElement('div');
    card.className = `month-card ${monthData.status}`;
    card.style.display = 'inline-block';
    card.style.margin = '10px';
    card.setAttribute('role', 'status');
    card.setAttribute('aria-label', `${monthData.month}: ${monthData.status === 'green' ? 'Goal met' : 'Goal missed'}, ${monthData.value}`);

    const monthName = document.createElement('div');
    monthName.className = 'month-name';
    monthName.textContent = monthData.month;

    const statusIcon = document.createElement('div');
    statusIcon.className = 'month-status';
    statusIcon.textContent = monthData.status === 'green' ? '✅' : '❌';

    const value = document.createElement('div');
    value.className = 'month-value';
    value.textContent = monthData.value;

    card.appendChild(monthName);
    card.appendChild(statusIcon);
    card.appendChild(value);

    return card;
}

// Back to shifts (from metrics detail)
function backToShifts() {
    document.getElementById('metricsDetail').style.display = 'none';
    document.getElementById('overviewSection').style.display = 'none';
    document.getElementById('comparisonSection').style.display = 'none';
    document.getElementById('shiftSection').style.display = 'block';
    currentShift = null;
    
    // Reset comparison mode if active
    if (comparisonMode) {
        disableComparisonMode();
    }
    
    // Show compare button again
    document.getElementById('compareButton').style.display = 'block';
    
    // Update breadcrumb
    updateBreadcrumb('month', currentMonth);
}

// Back to months (from shift selection)
function backToMonths() {
    document.getElementById('shiftSection').style.display = 'none';
    document.getElementById('comparisonSection').style.display = 'none';
    document.getElementById('monthGrid').style.display = 'grid';
    currentMonth = null;
    currentShift = null;
    
    // Reset comparison mode if active
    if (comparisonMode) {
        disableComparisonMode();
    }
    
    // Update breadcrumb
    updateBreadcrumb('home');
}

// Update last updated timestamp
function updateLastUpdatedTime() {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('lastUpdated').textContent = formatted;
}

// Show trend chart inline (expanding the card)
function showInlineTrendChart(card, metricName, monthData, month) {
    console.log('Showing inline trend for:', metricName, month);
    
    // Check if already expanded
    if (card.classList.contains('expanded')) {
        collapseCard(card);
        return;
    }
    
    // Collapse any other expanded cards first
    document.querySelectorAll('.compact-metric-card.expanded').forEach(otherCard => {
        if (otherCard !== card) {
            collapseCard(otherCard);
        }
    });
    
    // Mark as expanded
    card.classList.add('expanded');
    
    // Save original content
    const originalContent = card.innerHTML;
    card.dataset.originalContent = originalContent;
    
    // Create expanded view with chart
    const weeklyValues = monthData.weeklyRaw || [];
    const weekNumbers = monthData.weekNumbers || [];
    const weekLabels = weekNumbers.length > 0 
        ? weekNumbers.map(w => `Week ${w}`)
        : weeklyValues.map((_, i) => `Week ${i + 1}`);
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'inline-chart-container';
    
    // Add header with close button
    const header = document.createElement('div');
    header.className = 'inline-chart-header';
    // Determine year (January is 2026, all others are 2025)
    const displayYear = month === 'January' ? '2026' : '2025';
    
    header.innerHTML = `
        <h3>${metricName} - ${month} ${displayYear}</h3>
        <button class="inline-close-btn" aria-label="Close chart">×</button>
    `;
    chartContainer.appendChild(header);
    
    // Add monthly average and goal display
    const avgDisplay = document.createElement('div');
    avgDisplay.className = 'chart-avg-display';
    avgDisplay.innerHTML = `
        <div class="avg-value">Monthly Average: ${monthData.value}</div>
        ${typeof metricGoals !== 'undefined' && metricGoals[metricName] ? 
            `<div class="goal-value">Goal: ${metricGoals[metricName]}</div>` : ''}
    `;
    chartContainer.appendChild(avgDisplay);
    
    // Add canvas for chart
    const canvas = document.createElement('canvas');
    canvas.id = `chart-${metricName.replace(/\s+/g, '-')}-${Date.now()}`;
    chartContainer.appendChild(canvas);
    
    // Add comments section for countermeasures tracking
    const commentsSection = document.createElement('div');
    commentsSection.className = 'comments-section';
    
    // Get all months in fiscal year order (Feb-Jan)
    const months = ['February', 'March', 'April', 'May', 'June', 'July',
                    'August', 'September', 'October', 'November', 'December', 'January'];
    const currentMonthIndex = months.indexOf(month);
    
    // Create unique key for current month
    const commentKey = `comment-${currentShift}-${metricName}-${month}`;
    const savedComment = localStorage.getItem(commentKey) || '';
    
    // Build HTML with ALL previous months' notes (reverse chronological order)
    let historicalSections = '';
    let hasHistoricalData = false;
    
    // Check all previous months for this metric
    for (let i = currentMonthIndex - 1; i >= 0; i--) {
        const historicalMonth = months[i];
        const historicalKey = `comment-${currentShift}-${metricName}-${historicalMonth}`;
        const historicalComment = localStorage.getItem(historicalKey) || '';
        
        if (historicalComment) {
            hasHistoricalData = true;
            historicalSections += `
                <div class="historical-month-section">
                    <div class="historical-month-header" onclick="this.parentElement.classList.toggle('collapsed')">
                        <span class="collapse-icon">▼</span>
                        <strong>📋 ${historicalMonth}</strong>
                        <span class="historical-month-hint">Click to expand/collapse</span>
                    </div>
                    <div class="historical-month-content">${historicalComment.replace(/\n/g, '<br>')}</div>
                </div>
            `;
        }
    }
    
    // Wrap historical sections if any exist
    let previousMonthsWrapper = '';
    if (hasHistoricalData) {
        previousMonthsWrapper = `
            <div class="historical-wrapper">
                <div class="historical-header">
                    <strong>📜 Historical Countermeasures</strong>
                    <span class="historical-subtext">All previous months (read-only)</span>
                </div>
                ${historicalSections}
            </div>
        `;
    }
    
    commentsSection.innerHTML = `
        ${previousMonthsWrapper}
        <div class="comments-header">
            <label for="${commentKey}-textarea">
                <strong>📝 ${month} Countermeasures & Notes</strong>
                <span class="comment-hint">Document actions and expected results</span>
            </label>
        </div>
        <textarea 
            id="${commentKey}-textarea" 
            class="comment-textarea" 
            placeholder="Document countermeasures when goals are missed:\n• What actions were taken?\n• What was the root cause?\n• Expected results?\n\nNext month, evaluate if countermeasures worked...">${savedComment}</textarea>
        <div class="comment-actions">
            <button class="save-comment-btn" id="${commentKey}-save">💾 Save Notes</button>
            <span class="save-status" id="${commentKey}-status"></span>
        </div>
    `;
    
    chartContainer.appendChild(commentsSection);
    
    // Prevent clicks in comments section from collapsing the card
    commentsSection.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Add save button handler
    setTimeout(() => {
        const saveBtn = document.getElementById(`${commentKey}-save`);
        const textarea = document.getElementById(`${commentKey}-textarea`);
        const status = document.getElementById(`${commentKey}-status`);
        
        if (saveBtn && textarea && status) {
            saveBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent collapse
                const comment = textarea.value;
                localStorage.setItem(commentKey, comment);
                
                // Show saved feedback
                status.textContent = '✓ Saved!';
                status.style.color = '#28a745';
                
                setTimeout(() => {
                    status.textContent = '';
                }, 2000);
            });
            
            // Auto-save on blur (optional)
            textarea.addEventListener('blur', () => {
                const comment = textarea.value;
                localStorage.setItem(commentKey, comment);
            });
            
            // Prevent textarea clicks from bubbling
            textarea.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            // Prevent textarea focus from bubbling
            textarea.addEventListener('focus', (e) => {
                e.stopPropagation();
            });
            
            // Prevent keyboard events from bubbling (especially spacebar!)
            textarea.addEventListener('keydown', (e) => {
                e.stopPropagation();
            });
            
            textarea.addEventListener('keypress', (e) => {
                e.stopPropagation();
            });
            
            textarea.addEventListener('keyup', (e) => {
                e.stopPropagation();
            });
        }
    }, 100);
    
    // Replace card content
    card.innerHTML = '';
    card.appendChild(chartContainer);
    
    // Prevent clicks anywhere in the chart container from collapsing
    chartContainer.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Add close button handler
    const closeBtn = header.querySelector('.inline-close-btn');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        collapseCard(card);
    });
    
    // Create chart with color-coded points based on goal
    const isGreen = monthData.status === 'green';
    const lineColor = isGreen ? '#28a745' : '#dc3545';
    const backgroundColor = isGreen ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)';
    
    // Color each point based on whether it meets the goal
    const goal = monthData.goal;
    const goalDirection = monthData.goalDirection;
    const pointColors = weeklyValues.map(value => {
        if (goal === null || goal === undefined || goalDirection === undefined) {
            return lineColor; // No goal defined, use overall status color
        }
        
        // Check if this week's value meets the goal
        let meetsGoal = false;
        if (goalDirection === 'lower') {
            meetsGoal = value <= goal;
        } else {
            meetsGoal = value >= goal;
        }
        
        return meetsGoal ? '#28a745' : '#dc3545'; // Green if met, red if missed
    });
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weekLabels,
            datasets: [{
                label: metricName,
                data: weeklyValues,
                borderColor: lineColor,
                backgroundColor: backgroundColor,
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointRadius: 8,
                pointHoverRadius: 10,
                pointBackgroundColor: pointColors,  // Use color-coded points
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const weeklyFormatted = monthData.weekly || [];
                            if (weeklyFormatted[context.dataIndex]) {
                                return `${metricName}: ${weeklyFormatted[context.dataIndex]}`;
                            }
                            return `${metricName}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 11 },
                        color: '#666'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: { size: 11, weight: 'bold' },
                        color: '#0071ce'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
    
    // Store chart instance for cleanup
    card.chartInstance = chart;
}

// Collapse expanded card back to original state
function collapseCard(card) {
    // Destroy chart if exists
    if (card.chartInstance) {
        card.chartInstance.destroy();
        card.chartInstance = null;
    }
    
    // Restore original content
    if (card.dataset.originalContent) {
        card.innerHTML = card.dataset.originalContent;
        delete card.dataset.originalContent;
    }
    
    // Remove expanded class
    card.classList.remove('expanded');
}

// Keep old modal function for backwards compatibility (not used anymore)
function showTrendChart(metricName, monthData, month) {
    console.log('Showing trend for:', metricName, month);
    
    const modal = document.getElementById('trendModal');
    const modalTitle = document.getElementById('trendModalTitle');
    const canvas = document.getElementById('trendChart');
    
    // Update modal title
    const shiftName = shiftMetrics[currentShift]?.name || currentShift;
    modalTitle.textContent = `${shiftName} - ${metricName} - ${month} 2025`;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Destroy existing chart if any
    if (currentChart) {
        currentChart.destroy();
    }
    
    // Get weekly data
    const weeklyValues = monthData.weeklyRaw || [];
    const weekNumbers = monthData.weekNumbers || [];
    
    // Use actual fiscal week numbers if available, otherwise fall back to 1, 2, 3...
    const weekLabels = weekNumbers.length > 0 
        ? weekNumbers.map(w => `Week ${w}`)
        : weeklyValues.map((_, i) => `Week ${i + 1}`);
    
    // Determine chart color based on metric status
    const isGreen = monthData.status === 'green';
    const borderColor = isGreen ? '#28a745' : '#dc3545';
    const backgroundColor = isGreen ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)';
    
    // Create new chart
    const ctx = canvas.getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weekLabels,
            datasets: [{
                label: metricName,
                data: weeklyValues,
                borderColor: borderColor,
                backgroundColor: backgroundColor,
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: borderColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: `Weekly Trend - Monthly Average: ${monthData.value}`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#0071ce'
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            // Use the formatted weekly values if available
                            const weeklyFormatted = monthData.weekly || [];
                            if (weeklyFormatted[context.dataIndex]) {
                                return `${metricName}: ${weeklyFormatted[context.dataIndex]}`;
                            }
                            return `${metricName}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 12
                        },
                        color: '#666'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#0071ce'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Close modal (legacy - not used with inline charts)
function closeModal() {
    const modal = document.getElementById('trendModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Destroy chart
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
}

// ====================================================================
// OVERVIEW DASHBOARD FUNCTIONALITY
// ====================================================================

function calculateTrend(metricName, previousValue, currentValue) {
    // Extract numeric values
    const extractNumber = (val) => {
        if (typeof val === 'number') return val;
        const str = String(val).replace(/[^0-9.-]/g, '');
        return parseFloat(str) || 0;
    };
    
    const prev = extractNumber(previousValue);
    const curr = extractNumber(currentValue);
    
    if (prev === 0 && curr === 0) {
        return { direction: 'stable', arrow: '→', color: 'gray', percent: 0 };
    }
    
    if (prev === 0) {
        return { direction: 'up', arrow: '↑', color: 'red', percent: 100 };
    }
    
    const percentChange = ((curr - prev) / prev) * 100;
    const absChange = Math.abs(percentChange);
    
    // Determine if metric is "lower is better" or "higher is better"
    const lowerIsBetter = ['DPM', 'Chase %', 'Overtime', 'DPMO', 'Turnover %', 'Safety Medical', 'Safety Non-Medical'].includes(metricName);
    
    // Less than 5% change is considered stable
    if (absChange < 5) {
        return { direction: 'stable', arrow: '→', color: 'gray', percent: percentChange };
    }
    
    // Determine if change is good or bad
    let isGood = false;
    if (lowerIsBetter) {
        isGood = curr < prev; // Going down is good
    } else {
        isGood = curr > prev; // Going up is good
    }
    
    const direction = curr > prev ? 'up' : 'down';
    const arrow = curr > prev ? '↑' : '↓';
    const color = isGood ? 'green' : 'red';
    
    return { direction, arrow, color, percent: percentChange };
}

function showOverview(month) {
    console.log('Showing overview for', month);
    
    // Hide shift selection
    document.getElementById('shiftSection').style.display = 'none';
    
    // Show overview section
    const overviewSection = document.getElementById('overviewSection');
    overviewSection.style.display = 'block';
    
    // Update title
    const displayYear = month === 'January' ? '2026' : '2025';
    document.getElementById('overviewMonthTitle').textContent = `${month} ${displayYear} - All Shifts Overview`;
    
    // Update breadcrumb
    updateBreadcrumb('view', month, '📊 Month Overview');
    
    // Generate overview content
    generateOverviewContent(month);
    
    // Animate stat values after content loads
    setTimeout(() => {
        animateStatCards();
    }, 200);
}

function backToShifts() {
    // Hide overview and metrics detail
    document.getElementById('overviewSection').style.display = 'none';
    document.getElementById('metricsDetail').style.display = 'none';
    
    // Show shift selection
    document.getElementById('shiftSection').style.display = 'block';
    
    // Update breadcrumb
    if (currentMonth) {
        updateBreadcrumb('month', currentMonth);
    }
}

function generateOverviewContent(month) {
    const container = document.getElementById('overviewContainer');
    container.innerHTML = '';
    
    // Convert month name to data array index (data is in calendar year order: Jan, Feb, Mar...)
    const calendarMonths = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
    const dataIndex = calendarMonths.indexOf(month);
    
    if (dataIndex === -1) {
        container.innerHTML = '<p>No data available for this month.</p>';
        return;
    }
    
    // Also get fiscal year index for previous month calculation
    const fiscalMonths = ['February', 'March', 'April', 'May', 'June', 'July',
                          'August', 'September', 'October', 'November', 'December', 'January'];
    const fiscalIndex = fiscalMonths.indexOf(month);
    
    // Collect data from all shifts
    const allShifts = ['dry-1st', 'dry-2nd', 'dry-4th', 'dry-5th', 'per-1st', 'per-2nd', 'per-4th', 'per-5th'];
    const shiftData = [];
    
    allShifts.forEach(shiftId => {
        if (shiftMetrics[shiftId]) {
            const shift = shiftMetrics[shiftId];
            const data = {
                id: shiftId,
                name: shift.name,
                metrics: {},
                goalsMetCount: 0,
                totalMetrics: 0
            };
            
            // Collect all metrics for this shift
            for (const category in shift.categories) {
                for (const metricName in shift.categories[category]) {
                    const metricMonths = shift.categories[category][metricName];
                    const metricData = metricMonths[dataIndex];
                    
                    // Also get previous month data for trend calculation
                    let previousMonthData = null;
                    if (fiscalIndex > 0) {
                        const prevMonthName = fiscalMonths[fiscalIndex - 1];
                        const prevDataIndex = calendarMonths.indexOf(prevMonthName);
                        if (prevDataIndex !== -1) {
                            previousMonthData = metricMonths[prevDataIndex];
                        }
                    }
                    
                    if (metricData) {
                        // Add trend information
                        const metricWithTrend = { ...metricData };
                        if (previousMonthData && previousMonthData.value !== 'N/A' && metricData.value !== 'N/A') {
                            metricWithTrend.trend = calculateTrend(metricName, previousMonthData.value, metricData.value);
                            metricWithTrend.previousValue = previousMonthData.value;
                        }
                        
                        data.metrics[metricName] = metricWithTrend;
                        data.totalMetrics++;
                        if (metricData.status === 'green') {
                            data.goalsMetCount++;
                        }
                    }
                }
            }
            
            shiftData.push(data);
        }
    });
    
    // Calculate overall statistics
    const stats = calculateOverviewStats(shiftData, month);
    
    // Create stats cards with trend indicators
    const trendHTML = (trend) => {
        if (!trend) return '';
        return `<span style="color: ${trend.color}; font-size: 0.9em; margin-left: 8px;">${trend.arrow} ${Math.abs(trend.percent).toFixed(0)}%</span>`;
    };
    
    const statsHTML = `
        <div class="overview-stats">
            <div class="stat-card ${stats.safetyIncidents === 0 ? 'success' : 'alert'}">
                <div class="stat-label">Safety Incidents</div>
                <div class="stat-value">${stats.safetyIncidents}${trendHTML(stats.trends.safety)}</div>
                <div class="stat-description">Total (Medical + Non-Medical)</div>
            </div>
            
            <div class="stat-card ${stats.avgDPM <= 1500 ? 'success' : 'warning'}">
                <div class="stat-label">Average DPM</div>
                <div class="stat-value">${stats.avgDPM.toLocaleString()}${trendHTML(stats.trends.dpm)}</div>
                <div class="stat-description">Across all shifts</div>
            </div>
            
            <div class="stat-card ${stats.overtimeHours === 0 ? 'success' : 'alert'}">
                <div class="stat-label">Total Overtime</div>
                <div class="stat-value">${stats.overtimeHours.toFixed(1)} hrs${trendHTML(stats.trends.overtime)}</div>
                <div class="stat-description">All shifts combined</div>
            </div>
            
            <div class="stat-card ${stats.goalsMetPercent >= 75 ? 'success' : stats.goalsMetPercent >= 50 ? 'warning' : 'alert'}">
                <div class="stat-label">Goals Met</div>
                <div class="stat-value">${stats.goalsMetPercent}%${trendHTML(stats.trends.goalsmet)}</div>
                <div class="stat-description">${stats.goalsMetTotal} of ${stats.totalGoals} metrics</div>
            </div>
        </div>
    `;
    
    container.innerHTML = statsHTML;
    
    console.log('Adding YTD section for', month, 'fiscalIndex:', fiscalIndex);
    
    // Add YTD tracking section with error handling
    try {
        const ytdHTML = createYTDTracking(month, shiftData, fiscalIndex);
        container.innerHTML += ytdHTML;
        console.log('YTD section added successfully');
    } catch (error) {
        console.error('ERROR in createYTDTracking:', error);
        container.innerHTML += '<div style="color: red; padding: 20px;">Error loading YTD section: ' + error.message + '</div>';
    }
    
    // Add alerts section if there are issues
    if (stats.alerts.length > 0) {
        const alertsHTML = `
            <div class="alerts-section">
                <h3>🚨 Issues Requiring Attention</h3>
                ${stats.alerts.map(alert => `
                    <div class="alert-item">
                        <span class="alert-text">${alert.text}</span>
                        <span class="alert-value">${alert.value}</span>
                    </div>
                `).join('')}
            </div>
        `;
        container.innerHTML += alertsHTML;
    }
    
    // Add comprehensive rankings section
    console.log('Adding rankings section');
    try {
        const rankingsHTML = createRankingsSection(shiftData, stats);
        container.innerHTML += rankingsHTML;
        console.log('Rankings section added successfully');
    } catch (error) {
        console.error('ERROR in createRankingsSection:', error);
        container.innerHTML += '<div style="color: red; padding: 20px;">Error loading Rankings section: ' + error.message + '</div>';
    }
    
    // Add goal achievement summary
    console.log('Adding goal achievement section');
    try {
        const goalSummaryHTML = createGoalAchievementSummary(shiftData, stats);
        container.innerHTML += goalSummaryHTML;
        console.log('Goal achievement section added successfully');
    } catch (error) {
        console.error('ERROR in createGoalAchievementSummary:', error);
        container.innerHTML += '<div style="color: red; padding: 20px;">Error loading Goal Achievement section: ' + error.message + '</div>';
    }
    
    // Add individual shift summaries
    const shiftsHTML = `
        <h3 class="overview-section-title">Individual Shift Performance</h3>
        <div class="shifts-summary-grid">
            ${shiftData.map(shift => createShiftSummaryCard(shift, month)).join('')}
        </div>
    `;
    
    container.innerHTML += shiftsHTML;
    
    // Add click listeners to shift summary cards
    setTimeout(() => {
        document.querySelectorAll('.shift-summary-card').forEach(card => {
            card.addEventListener('click', () => {
                const shiftId = card.getAttribute('data-shift');
                showShiftDetails(shiftId, month);
            });
        });
    }, 100);
}

function calculateOverviewStats(shiftData, month) {
    let totalSafetyMedical = 0;
    let totalSafetyNonMedical = 0;
    let totalDPM = 0;
    let dpmCount = 0;
    let totalOvertime = 0;
    let goalsMetTotal = 0;
    let totalGoals = 0;
    const alerts = [];
    const successes = [];
    
    shiftData.forEach(shift => {
        // Safety incidents
        if (shift.metrics['Safety Medical']) {
            const value = parseFloat(shift.metrics['Safety Medical'].value) || 0;
            totalSafetyMedical += value;
            if (value > 0) {
                alerts.push({
                    text: `${shift.name} - Medical Incident`,
                    value: `${value} incident${value > 1 ? 's' : ''}`
                });
            }
        }
        
        if (shift.metrics['Safety Non-Medical']) {
            const value = parseFloat(shift.metrics['Safety Non-Medical'].value) || 0;
            totalSafetyNonMedical += value;
            if (value > 0) {
                alerts.push({
                    text: `${shift.name} - Non-Medical Incident`,
                    value: `${value} incident${value > 1 ? 's' : ''}`
                });
            }
        }
        
        // DPM
        if (shift.metrics['DPM'] && shift.metrics['DPM'].value !== 'N/A') {
            const dpmValue = parseFloat(shift.metrics['DPM'].value.replace(/[^0-9.]/g, ''));
            if (!isNaN(dpmValue)) {
                totalDPM += dpmValue;
                dpmCount++;
                
                if (dpmValue <= 1500 && dpmValue > 0) {
                    successes.push({
                        text: `${shift.name} - DPM`,
                        value: `${dpmValue.toLocaleString()} (Met goal!)`
                    });
                }
            }
        }
        
        // Overtime
        if (shift.metrics['Overtime'] && shift.metrics['Overtime'].value !== 'N/A') {
            const otValue = parseFloat(shift.metrics['Overtime'].value.replace(/[^0-9.]/g, ''));
            if (!isNaN(otValue)) {
                totalOvertime += otValue;
                if (otValue > 0) {
                    alerts.push({
                        text: `${shift.name} - Overtime`,
                        value: `${otValue.toFixed(1)} hours`
                    });
                }
            }
        }
        
        // Goals met
        goalsMetTotal += shift.goalsMetCount;
        totalGoals += shift.totalMetrics;
    });
    
    // Calculate trend data for overall stats
    const trends = {
        safety: null,
        dpm: null,
        overtime: null,
        goalsmet: null
    };
    
    // Collect previous month data for trends
    let prevSafetyTotal = 0;
    let prevDPMTotal = 0;
    let prevDPMCount = 0;
    let prevOvertimeTotal = 0;
    let prevGoalsMet = 0;
    let prevTotalGoals = 0;
    
    shiftData.forEach(shift => {
        if (shift.metrics['Safety Medical']?.previousValue !== undefined) {
            prevSafetyTotal += parseFloat(shift.metrics['Safety Medical'].previousValue) || 0;
        }
        if (shift.metrics['Safety Non-Medical']?.previousValue !== undefined) {
            prevSafetyTotal += parseFloat(shift.metrics['Safety Non-Medical'].previousValue) || 0;
        }
        if (shift.metrics['DPM']?.previousValue) {
            const prevDPM = parseFloat(String(shift.metrics['DPM'].previousValue).replace(/[^0-9.]/g, ''));
            if (!isNaN(prevDPM)) {
                prevDPMTotal += prevDPM;
                prevDPMCount++;
            }
        }
        if (shift.metrics['Overtime']?.previousValue) {
            const prevOT = parseFloat(String(shift.metrics['Overtime'].previousValue).replace(/[^0-9.]/g, ''));
            if (!isNaN(prevOT)) {
                prevOvertimeTotal += prevOT;
            }
        }
    });
    
    // Calculate trends
    const currentSafety = totalSafetyMedical + totalSafetyNonMedical;
    const currentDPM = dpmCount > 0 ? Math.round(totalDPM / dpmCount) : 0;
    const currentOT = totalOvertime;
    const currentGoalsPercent = totalGoals > 0 ? Math.round((goalsMetTotal / totalGoals) * 100) : 0;
    
    if (prevSafetyTotal !== undefined) {
        trends.safety = calculateTrend('Safety Medical', prevSafetyTotal, currentSafety);
    }
    if (prevDPMCount > 0) {
        const prevAvgDPM = Math.round(prevDPMTotal / prevDPMCount);
        trends.dpm = calculateTrend('DPM', prevAvgDPM, currentDPM);
    }
    if (prevOvertimeTotal !== undefined) {
        trends.overtime = calculateTrend('Overtime', prevOvertimeTotal, currentOT);
    }
    
    return {
        safetyIncidents: currentSafety,
        avgDPM: currentDPM,
        overtimeHours: currentOT,
        goalsMetTotal: goalsMetTotal,
        totalGoals: totalGoals,
        goalsMetPercent: currentGoalsPercent,
        alerts: alerts,
        successes: successes.slice(0, 5),
        trends: trends
    };
}

function createShiftYTDSection(shiftId, shiftData, currentMonth, fiscalIndex) {
    const fiscalMonths = ['February', 'March', 'April', 'May', 'June', 'July',
                          'August', 'September', 'October', 'November', 'December', 'January'];
    const calendarMonths = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Get all months from February through current month
    const ytdMonths = fiscalMonths.slice(0, fiscalIndex + 1);
    
    // Collect YTD data for this specific shift
    const ytdData = {
        dpm: { values: [], months: [] },
        safety: { total: 0, months: [] },
        overtime: { total: 0, months: [] },
        chase: { values: [], months: [] },
        receivingCPH: { values: [], months: [] },
        shippingCPH: { values: [], months: [] }
    };
    
    // Collect data for each YTD month
    ytdMonths.forEach(monthName => {
        const dataIndex = calendarMonths.indexOf(monthName);
        
        // DPM
        const dpm = shiftData.categories.Quality['DPM'][dataIndex];
        if (dpm && dpm.value !== 'N/A') {
            const dpmVal = parseFloat(String(dpm.value).replace(/[^0-9.]/g, ''));
            if (!isNaN(dpmVal)) {
                ytdData.dpm.values.push(dpmVal);
                ytdData.dpm.months.push({ month: monthName, value: dpmVal });
            }
        }
        
        // Safety
        const safetyMed = shiftData.categories.Safety['Safety Medical'][dataIndex];
        const safetyNonMed = shiftData.categories.Safety['Safety Non-Medical'][dataIndex];
        let monthSafety = 0;
        if (safetyMed && safetyMed.value !== 'N/A') {
            monthSafety += parseFloat(safetyMed.value) || 0;
        }
        if (safetyNonMed && safetyNonMed.value !== 'N/A') {
            monthSafety += parseFloat(safetyNonMed.value) || 0;
        }
        ytdData.safety.total += monthSafety;
        ytdData.safety.months.push({ month: monthName, value: monthSafety });
        
        // Overtime
        const ot = shiftData.categories.Cost['Overtime'][dataIndex];
        if (ot && ot.value !== 'N/A') {
            const otVal = parseFloat(String(ot.value).replace(/[^0-9.]/g, ''));
            if (!isNaN(otVal)) {
                ytdData.overtime.total += otVal;
                ytdData.overtime.months.push({ month: monthName, value: otVal });
            }
        }
        
        // Chase %
        const chase = shiftData.categories.Quality['Chase %'][dataIndex];
        if (chase && chase.value !== 'N/A') {
            const chaseVal = parseFloat(String(chase.value).replace(/[^0-9.]/g, ''));
            if (!isNaN(chaseVal)) {
                ytdData.chase.values.push(chaseVal);
                ytdData.chase.months.push({ month: monthName, value: chaseVal });
            }
        }
        
        // Receiving CPH
        const recvCPH = shiftData.categories.Cost['Receiving CPH'][dataIndex];
        if (recvCPH && recvCPH.value !== 'N/A') {
            const recvVal = parseFloat(String(recvCPH.value).replace(/[^0-9.]/g, ''));
            if (!isNaN(recvVal)) {
                ytdData.receivingCPH.values.push(recvVal);
                ytdData.receivingCPH.months.push({ month: monthName, value: recvVal });
            }
        }
        
        // Shipping CPH
        const shipCPH = shiftData.categories.Cost['Shipping CPH'][dataIndex];
        if (shipCPH && shipCPH.value !== 'N/A') {
            const shipVal = parseFloat(String(shipCPH.value).replace(/[^0-9.]/g, ''));
            if (!isNaN(shipVal)) {
                ytdData.shippingCPH.values.push(shipVal);
                ytdData.shippingCPH.months.push({ month: monthName, value: shipVal });
            }
        }
    });
    
    // Calculate YTD statistics
    const ytdStats = {
        monthCount: ytdMonths.length,
        startMonth: ytdMonths[0],
        endMonth: ytdMonths[ytdMonths.length - 1],
        
        dpm: {
            ytdAvg: ytdData.dpm.values.length > 0 ? Math.round(ytdData.dpm.values.reduce((a, b) => a + b, 0) / ytdData.dpm.values.length) : 0,
            best: ytdData.dpm.values.length > 0 ? Math.min(...ytdData.dpm.values) : 0,
            worst: ytdData.dpm.values.length > 0 ? Math.max(...ytdData.dpm.values) : 0,
            bestMonth: ytdData.dpm.months.length > 0 ? ytdData.dpm.months.reduce((a, b) => a.value < b.value ? a : b).month : '',
            worstMonth: ytdData.dpm.months.length > 0 ? ytdData.dpm.months.reduce((a, b) => a.value > b.value ? a : b).month : '',
            monthlyValues: ytdData.dpm.months,
            trend: ytdData.dpm.values.length >= 2 ? ytdData.dpm.values[ytdData.dpm.values.length - 1] - ytdData.dpm.values[0] : 0
        },
        
        safety: {
            total: ytdData.safety.total,
            avg: ytdData.safety.total / ytdMonths.length,
            trend: ytdData.safety.months.length >= 2 ? 
                ytdData.safety.months[ytdData.safety.months.length - 1].value - ytdData.safety.months[0].value : 0
        },
        
        overtime: {
            total: ytdData.overtime.total,
            avg: ytdData.overtime.total / ytdMonths.length,
            best: ytdData.overtime.months.length > 0 ? Math.min(...ytdData.overtime.months.map(m => m.value)) : 0,
            worst: ytdData.overtime.months.length > 0 ? Math.max(...ytdData.overtime.months.map(m => m.value)) : 0,
            bestMonth: ytdData.overtime.months.length > 0 ? ytdData.overtime.months.reduce((a, b) => a.value < b.value ? a : b).month : '',
            worstMonth: ytdData.overtime.months.length > 0 ? ytdData.overtime.months.reduce((a, b) => a.value > b.value ? a : b).month : '',
            monthlyValues: ytdData.overtime.months
        },
        
        receivingCPH: {
            ytdAvg: ytdData.receivingCPH.values.length > 0 ? Math.round(ytdData.receivingCPH.values.reduce((a, b) => a + b, 0) / ytdData.receivingCPH.values.length) : 0,
            best: ytdData.receivingCPH.values.length > 0 ? Math.max(...ytdData.receivingCPH.values) : 0,
            worst: ytdData.receivingCPH.values.length > 0 ? Math.min(...ytdData.receivingCPH.values) : 0,
            monthlyValues: ytdData.receivingCPH.months
        },
        
        shippingCPH: {
            ytdAvg: ytdData.shippingCPH.values.length > 0 ? Math.round(ytdData.shippingCPH.values.reduce((a, b) => a + b, 0) / ytdData.shippingCPH.values.length) : 0,
            best: ytdData.shippingCPH.values.length > 0 ? Math.max(...ytdData.shippingCPH.values) : 0,
            worst: ytdData.shippingCPH.values.length > 0 ? Math.min(...ytdData.shippingCPH.values) : 0,
            monthlyValues: ytdData.shippingCPH.months
        }
    };
    
    // Create mini sparkline
    const createMiniSparkline = (values) => {
        if (values.length === 0) return '';
        const max = Math.max(...values.map(v => v.value));
        const min = Math.min(...values.map(v => v.value));
        const range = max - min || 1;
        
        return values.map((v, i) => {
            const height = ((v.value - min) / range) * 30 + 8;
            const isLast = i === values.length - 1;
            const color = isLast ? '#0071ce' : '#95a5a6';
            
            return `<div class="mini-sparkline-bar" style="height: ${height}px; background: ${color};" title="${v.month}: ${v.value.toLocaleString()}"></div>`;
        }).join('');
    };
    
    // Create the YTD section element
    const section = document.createElement('div');
    section.className = 'shift-ytd-section';
    section.innerHTML = `
        <h3 class="shift-ytd-title">
            <span class="ytd-icon">📅</span>
            Year-to-Date: ${shiftData.name} (${ytdStats.startMonth} - ${ytdStats.endMonth})
        </h3>
        
        <div class="shift-ytd-grid">
            <div class="shift-ytd-card">
                <div class="shift-ytd-metric">DPM</div>
                <div class="shift-ytd-value">${ytdStats.dpm.ytdAvg.toLocaleString()}</div>
                <div class="shift-ytd-detail">YTD Average</div>
                <div class="shift-ytd-range">
                    Best: ${ytdStats.dpm.best.toLocaleString()} (${ytdStats.dpm.bestMonth})<br>
                    Worst: ${ytdStats.dpm.worst.toLocaleString()} (${ytdStats.dpm.worstMonth})
                </div>
                <div class="shift-ytd-trend ${ytdStats.dpm.trend < 0 ? 'positive' : 'negative'}">
                    ${ytdStats.dpm.trend < 0 ? '↓' : '↑'} ${Math.abs(ytdStats.dpm.trend).toFixed(0)} since ${ytdStats.startMonth}
                </div>
                <div class="shift-mini-sparkline">${createMiniSparkline(ytdStats.dpm.monthlyValues)}</div>
            </div>
            
            <div class="shift-ytd-card">
                <div class="shift-ytd-metric">Safety</div>
                <div class="shift-ytd-value">${ytdStats.safety.total}</div>
                <div class="shift-ytd-detail">Total Incidents</div>
                <div class="shift-ytd-range">Avg: ${ytdStats.safety.avg.toFixed(1)}/month</div>
                <div class="shift-ytd-trend ${ytdStats.safety.trend <= 0 ? 'positive' : 'negative'}">
                    ${ytdStats.safety.trend <= 0 ? '↓' : '↑'} ${Math.abs(ytdStats.safety.trend).toFixed(0)} since ${ytdStats.startMonth}
                </div>
            </div>
            
            <div class="shift-ytd-card">
                <div class="shift-ytd-metric">Overtime</div>
                <div class="shift-ytd-value">${ytdStats.overtime.total.toFixed(1)} hrs</div>
                <div class="shift-ytd-detail">Total YTD</div>
                <div class="shift-ytd-range">
                    Best: ${ytdStats.overtime.best.toFixed(1)} hrs (${ytdStats.overtime.bestMonth})<br>
                    Worst: ${ytdStats.overtime.worst.toFixed(1)} hrs (${ytdStats.overtime.worstMonth})
                </div>
                <div class="shift-mini-sparkline">${createMiniSparkline(ytdStats.overtime.monthlyValues)}</div>
            </div>
            
            <div class="shift-ytd-card">
                <div class="shift-ytd-metric">Receiving CPH</div>
                <div class="shift-ytd-value">${ytdStats.receivingCPH.ytdAvg.toLocaleString()}</div>
                <div class="shift-ytd-detail">YTD Average</div>
                <div class="shift-ytd-range">
                    Best: ${ytdStats.receivingCPH.best.toLocaleString()}<br>
                    Worst: ${ytdStats.receivingCPH.worst.toLocaleString()}
                </div>
                <div class="shift-mini-sparkline">${createMiniSparkline(ytdStats.receivingCPH.monthlyValues)}</div>
            </div>
            
            <div class="shift-ytd-card">
                <div class="shift-ytd-metric">Shipping CPH</div>
                <div class="shift-ytd-value">${ytdStats.shippingCPH.ytdAvg.toLocaleString()}</div>
                <div class="shift-ytd-detail">YTD Average</div>
                <div class="shift-ytd-range">
                    Best: ${ytdStats.shippingCPH.best.toLocaleString()}<br>
                    Worst: ${ytdStats.shippingCPH.worst.toLocaleString()}
                </div>
                <div class="shift-mini-sparkline">${createMiniSparkline(ytdStats.shippingCPH.monthlyValues)}</div>
            </div>
            
            <div class="shift-ytd-card highlight">
                <div class="shift-ytd-metric">📈 Progress</div>
                <div class="shift-ytd-value">${ytdStats.monthCount} months</div>
                <div class="shift-ytd-detail">${12 - ytdStats.monthCount} remaining</div>
                <div class="shift-progress-bar">
                    <div class="shift-progress-fill" style="width: ${(ytdStats.monthCount / 12) * 100}%"></div>
                </div>
                <div class="shift-ytd-detail">${Math.round((ytdStats.monthCount / 12) * 100)}% complete</div>
            </div>
        </div>
    `;
    
    return section;
}

function createYTDTracking(currentMonth, shiftData, fiscalIndex) {
    // Don't show YTD for February (first month)
    if (fiscalIndex === 0) {
        return '';
    }
    
    const fiscalMonths = ['February', 'March', 'April', 'May', 'June', 'July',
                          'August', 'September', 'October', 'November', 'December', 'January'];
    const calendarMonths = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Get all months from February through current month
    const ytdMonths = fiscalMonths.slice(0, fiscalIndex + 1);
    
    // Collect YTD data for key metrics
    const ytdData = {
        safety: { total: 0, months: [] },
        dpm: { values: [], months: [] },
        overtime: { total: 0, months: [] },
        chase: { values: [], months: [] },
        receivingCPH: { values: [], months: [] },
        shippingCPH: { values: [], months: [] },
        turnover: { values: [], months: [] }
    };
    
    // For each YTD month, collect data
    ytdMonths.forEach(monthName => {
        const dataIndex = calendarMonths.indexOf(monthName);
        
        let monthSafety = 0;
        let monthDPMSum = 0;
        let monthDPMCount = 0;
        let monthOT = 0;
        let monthChaseSum = 0;
        let monthChaseCount = 0;
        let monthRecvSum = 0;
        let monthRecvCount = 0;
        let monthShipSum = 0;
        let monthShipCount = 0;
        let monthTurnSum = 0;
        let monthTurnCount = 0;
        
        shiftData.forEach(shift => {
            // Get this shift's data for this month from all shifts
            if (shiftMetrics[shift.id]) {
                const currentShift = shiftMetrics[shift.id];
                
                // Safety
                const safetyMed = currentShift.categories.Safety['Safety Medical'][dataIndex];
                const safetyNonMed = currentShift.categories.Safety['Safety Non-Medical'][dataIndex];
                if (safetyMed && safetyMed.value !== 'N/A') {
                    monthSafety += parseFloat(safetyMed.value) || 0;
                }
                if (safetyNonMed && safetyNonMed.value !== 'N/A') {
                    monthSafety += parseFloat(safetyNonMed.value) || 0;
                }
                
                // DPM
                const dpm = currentShift.categories.Quality['DPM'][dataIndex];
                if (dpm && dpm.value !== 'N/A') {
                    const dpmVal = parseFloat(String(dpm.value).replace(/[^0-9.]/g, ''));
                    if (!isNaN(dpmVal)) {
                        monthDPMSum += dpmVal;
                        monthDPMCount++;
                    }
                }
                
                // Overtime
                const ot = currentShift.categories.Cost['Overtime'][dataIndex];
                if (ot && ot.value !== 'N/A') {
                    const otVal = parseFloat(String(ot.value).replace(/[^0-9.]/g, ''));
                    if (!isNaN(otVal)) {
                        monthOT += otVal;
                    }
                }
                
                // Chase %
                const chase = currentShift.categories.Quality['Chase %'][dataIndex];
                if (chase && chase.value !== 'N/A') {
                    const chaseVal = parseFloat(String(chase.value).replace(/[^0-9.]/g, ''));
                    if (!isNaN(chaseVal)) {
                        monthChaseSum += chaseVal;
                        monthChaseCount++;
                    }
                }
                
                // Receiving CPH
                const recvCPH = currentShift.categories.Cost['Receiving CPH'][dataIndex];
                if (recvCPH && recvCPH.value !== 'N/A') {
                    const recvVal = parseFloat(String(recvCPH.value).replace(/[^0-9.]/g, ''));
                    if (!isNaN(recvVal)) {
                        monthRecvSum += recvVal;
                        monthRecvCount++;
                    }
                }
                
                // Shipping CPH
                const shipCPH = currentShift.categories.Cost['Shipping CPH'][dataIndex];
                if (shipCPH && shipCPH.value !== 'N/A') {
                    const shipVal = parseFloat(String(shipCPH.value).replace(/[^0-9.]/g, ''));
                    if (!isNaN(shipVal)) {
                        monthShipSum += shipVal;
                        monthShipCount++;
                    }
                }
                
                // Turnover
                const turnover = currentShift.categories.Cost['Turnover %'][dataIndex];
                if (turnover && turnover.value !== 'N/A') {
                    const turnVal = parseFloat(String(turnover.value).replace(/[^0-9.]/g, ''));
                    if (!isNaN(turnVal)) {
                        monthTurnSum += turnVal;
                        monthTurnCount++;
                    }
                }
            }
        });
        
        // Store month data
        ytdData.safety.total += monthSafety;
        ytdData.safety.months.push({ month: monthName, value: monthSafety });
        
        if (monthDPMCount > 0) {
            const avgDPM = Math.round(monthDPMSum / monthDPMCount);
            ytdData.dpm.values.push(avgDPM);
            ytdData.dpm.months.push({ month: monthName, value: avgDPM });
        }
        
        ytdData.overtime.total += monthOT;
        ytdData.overtime.months.push({ month: monthName, value: monthOT });
        
        if (monthChaseCount > 0) {
            const avgChase = (monthChaseSum / monthChaseCount);
            ytdData.chase.values.push(avgChase);
            ytdData.chase.months.push({ month: monthName, value: avgChase });
        }
        
        if (monthRecvCount > 0) {
            const avgRecv = Math.round(monthRecvSum / monthRecvCount);
            ytdData.receivingCPH.values.push(avgRecv);
            ytdData.receivingCPH.months.push({ month: monthName, value: avgRecv });
        }
        
        if (monthShipCount > 0) {
            const avgShip = Math.round(monthShipSum / monthShipCount);
            ytdData.shippingCPH.values.push(avgShip);
            ytdData.shippingCPH.months.push({ month: monthName, value: avgShip });
        }
        
        if (monthTurnCount > 0) {
            const avgTurn = (monthTurnSum / monthTurnCount);
            ytdData.turnover.values.push(avgTurn);
            ytdData.turnover.months.push({ month: monthName, value: avgTurn });
        }
    });
    
    // Calculate YTD statistics
    const ytdStats = {
        monthCount: ytdMonths.length,
        startMonth: ytdMonths[0],
        endMonth: ytdMonths[ytdMonths.length - 1],
        
        safety: {
            total: ytdData.safety.total,
            avg: ytdData.safety.total / ytdMonths.length,
            best: Math.min(...ytdData.safety.months.map(m => m.value)),
            worst: Math.max(...ytdData.safety.months.map(m => m.value)),
            trend: ytdData.safety.months.length >= 2 ? 
                (ytdData.safety.months[ytdData.safety.months.length - 1].value - ytdData.safety.months[0].value) : 0
        },
        
        dpm: {
            ytdAvg: ytdData.dpm.values.length > 0 ? Math.round(ytdData.dpm.values.reduce((a, b) => a + b, 0) / ytdData.dpm.values.length) : 0,
            best: ytdData.dpm.values.length > 0 ? Math.min(...ytdData.dpm.values) : 0,
            worst: ytdData.dpm.values.length > 0 ? Math.max(...ytdData.dpm.values) : 0,
            bestMonth: ytdData.dpm.months.length > 0 ? ytdData.dpm.months.reduce((a, b) => a.value < b.value ? a : b).month : '',
            worstMonth: ytdData.dpm.months.length > 0 ? ytdData.dpm.months.reduce((a, b) => a.value > b.value ? a : b).month : '',
            monthlyValues: ytdData.dpm.months
        },
        
        overtime: {
            total: ytdData.overtime.total.toFixed(1),
            avg: (ytdData.overtime.total / ytdMonths.length).toFixed(1),
            best: ytdData.overtime.months.length > 0 ? Math.min(...ytdData.overtime.months.map(m => m.value)) : 0,
            worst: ytdData.overtime.months.length > 0 ? Math.max(...ytdData.overtime.months.map(m => m.value)) : 0,
            bestMonth: ytdData.overtime.months.length > 0 ? ytdData.overtime.months.reduce((a, b) => a.value < b.value ? a : b).month : '',
            worstMonth: ytdData.overtime.months.length > 0 ? ytdData.overtime.months.reduce((a, b) => a.value > b.value ? a : b).month : '',
            monthlyValues: ytdData.overtime.months
        }
    };
    
    // Create mini sparkline for DPM trend
    const createSparkline = (values) => {
        if (values.length === 0) return '';
        const max = Math.max(...values.map(v => v.value));
        const min = Math.min(...values.map(v => v.value));
        const range = max - min || 1;
        
        return values.map((v, i) => {
            const height = ((v.value - min) / range) * 40 + 10;
            const isFirst = i === 0;
            const isLast = i === values.length - 1;
            const isBest = v.value === min;
            const isWorst = v.value === max;
            
            let color = '#95a5a6';
            if (isBest) color = '#27ae60';
            if (isWorst) color = '#e74c3c';
            if (isLast) color = '#0071ce';
            
            return `<div class="sparkline-bar" style="height: ${height}px; background: ${color};" title="${v.month}: ${v.value.toLocaleString()}"></div>`;
        }).join('');
    };
    
    return `
        <div class="ytd-tracking-section">
            <h3 class="overview-section-title">📅 Year-to-Date Performance (${ytdStats.startMonth} - ${ytdStats.endMonth})</h3>
            
            <div class="ytd-summary-grid">
                <div class="ytd-card">
                    <div class="ytd-card-icon">🛡️</div>
                    <div class="ytd-card-content">
                        <div class="ytd-card-label">Safety Incidents (YTD)</div>
                        <div class="ytd-card-value">${ytdStats.safety.total}</div>
                        <div class="ytd-card-detail">Avg: ${ytdStats.safety.avg.toFixed(1)}/month</div>
                        <div class="ytd-card-trend ${ytdStats.safety.trend <= 0 ? 'positive' : 'negative'}">
                            ${ytdStats.safety.trend <= 0 ? '↓' : '↑'} ${Math.abs(ytdStats.safety.trend).toFixed(0)} since ${ytdStats.startMonth}
                        </div>
                    </div>
                </div>
                
                <div class="ytd-card">
                    <div class="ytd-card-icon">📊</div>
                    <div class="ytd-card-content">
                        <div class="ytd-card-label">Average DPM (YTD)</div>
                        <div class="ytd-card-value">${ytdStats.dpm.ytdAvg.toLocaleString()}</div>
                        <div class="ytd-card-detail">
                            Best: ${ytdStats.dpm.best.toLocaleString()} (${ytdStats.dpm.bestMonth})<br>
                            Worst: ${ytdStats.dpm.worst.toLocaleString()} (${ytdStats.dpm.worstMonth})
                        </div>
                        <div class="ytd-sparkline">
                            ${createSparkline(ytdStats.dpm.monthlyValues)}
                        </div>
                    </div>
                </div>
                
                <div class="ytd-card">
                    <div class="ytd-card-icon">⏰</div>
                    <div class="ytd-card-content">
                        <div class="ytd-card-label">Overtime (YTD)</div>
                        <div class="ytd-card-value">${ytdStats.overtime.total} hrs</div>
                        <div class="ytd-card-detail">Avg: ${ytdStats.overtime.avg} hrs/month</div>
                        <div class="ytd-card-detail">
                            Best: ${ytdStats.overtime.best.toFixed(1)} hrs (${ytdStats.overtime.bestMonth})<br>
                            Worst: ${ytdStats.overtime.worst.toFixed(1)} hrs (${ytdStats.overtime.worstMonth})
                        </div>
                    </div>
                </div>
                
                <div class="ytd-card highlight">
                    <div class="ytd-card-icon">📈</div>
                    <div class="ytd-card-content">
                        <div class="ytd-card-label">Months Tracked</div>
                        <div class="ytd-card-value">${ytdStats.monthCount}</div>
                        <div class="ytd-card-detail">${12 - ytdStats.monthCount} months remaining in FY</div>
                        <div class="ytd-progress-bar">
                            <div class="ytd-progress-fill" style="width: ${(ytdStats.monthCount / 12) * 100}%"></div>
                        </div>
                        <div class="ytd-card-detail">${Math.round((ytdStats.monthCount / 12) * 100)}% of fiscal year complete</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createRankingsSection(shiftData, stats) {
    // Sort shifts by goal achievement percentage
    const rankedShifts = [...shiftData].sort((a, b) => {
        const aPercent = a.totalMetrics > 0 ? (a.goalsMetCount / a.totalMetrics) * 100 : 0;
        const bPercent = b.totalMetrics > 0 ? (b.goalsMetCount / b.totalMetrics) * 100 : 0;
        return bPercent - aPercent;
    });
    
    const topPerformers = rankedShifts.slice(0, 3);
    const bottomPerformers = rankedShifts.slice(-3).reverse();
    
    // Find best performers for each key metric
    const metricLeaders = {
        dpm: { best: null, bestValue: Infinity, worst: null, worstValue: -Infinity },
        safety: { best: [], bestValue: 0 },
        overtime: { best: null, bestValue: Infinity, worst: null, worstValue: -Infinity },
        receivingCPH: { best: null, bestValue: -Infinity },
        shippingCPH: { best: null, bestValue: -Infinity }
    };
    
    shiftData.forEach(shift => {
        // DPM
        if (shift.metrics['DPM'] && shift.metrics['DPM'].value !== 'N/A') {
            const dpmVal = parseFloat(String(shift.metrics['DPM'].value).replace(/[^0-9.]/g, ''));
            if (!isNaN(dpmVal)) {
                if (dpmVal < metricLeaders.dpm.bestValue) {
                    metricLeaders.dpm.best = { name: shift.name, value: shift.metrics['DPM'].value };
                    metricLeaders.dpm.bestValue = dpmVal;
                }
                if (dpmVal > metricLeaders.dpm.worstValue) {
                    metricLeaders.dpm.worst = { name: shift.name, value: shift.metrics['DPM'].value };
                    metricLeaders.dpm.worstValue = dpmVal;
                }
            }
        }
        
        // Safety
        const safetyMed = shift.metrics['Safety Medical'];
        const safetyNonMed = shift.metrics['Safety Non-Medical'];
        let totalSafety = 0;
        if (safetyMed && safetyMed.value !== 'N/A') totalSafety += parseFloat(safetyMed.value) || 0;
        if (safetyNonMed && safetyNonMed.value !== 'N/A') totalSafety += parseFloat(safetyNonMed.value) || 0;
        if (totalSafety === 0) {
            metricLeaders.safety.best.push(shift.name);
        }
        
        // Overtime
        if (shift.metrics['Overtime'] && shift.metrics['Overtime'].value !== 'N/A') {
            const otVal = parseFloat(String(shift.metrics['Overtime'].value).replace(/[^0-9.]/g, ''));
            if (!isNaN(otVal)) {
                if (otVal < metricLeaders.overtime.bestValue) {
                    metricLeaders.overtime.best = { name: shift.name, value: shift.metrics['Overtime'].value };
                    metricLeaders.overtime.bestValue = otVal;
                }
                if (otVal > metricLeaders.overtime.worstValue) {
                    metricLeaders.overtime.worst = { name: shift.name, value: shift.metrics['Overtime'].value };
                    metricLeaders.overtime.worstValue = otVal;
                }
            }
        }
        
        // Receiving CPH
        if (shift.metrics['Receiving CPH'] && shift.metrics['Receiving CPH'].value !== 'N/A') {
            const recvVal = parseFloat(String(shift.metrics['Receiving CPH'].value).replace(/[^0-9.]/g, ''));
            if (!isNaN(recvVal) && recvVal > metricLeaders.receivingCPH.bestValue) {
                metricLeaders.receivingCPH.best = { name: shift.name, value: shift.metrics['Receiving CPH'].value };
                metricLeaders.receivingCPH.bestValue = recvVal;
            }
        }
        
        // Shipping CPH
        if (shift.metrics['Shipping CPH'] && shift.metrics['Shipping CPH'].value !== 'N/A') {
            const shipVal = parseFloat(String(shift.metrics['Shipping CPH'].value).replace(/[^0-9.]/g, ''));
            if (!isNaN(shipVal) && shipVal > metricLeaders.shippingCPH.bestValue) {
                metricLeaders.shippingCPH.best = { name: shift.name, value: shift.metrics['Shipping CPH'].value };
                metricLeaders.shippingCPH.bestValue = shipVal;
            }
        }
    });
    
    return `
        <div class="rankings-section">
            <h3 class="overview-section-title">🏆 Performance Rankings</h3>
            
            <div class="rankings-grid">
                <!-- Top Performers -->
                <div class="rankings-card top-performers">
                    <h4 class="rankings-card-title">🏏 Top Performers</h4>
                    <div class="rankings-list">
                        ${topPerformers.map((shift, index) => {
                            const percent = shift.totalMetrics > 0 ? Math.round((shift.goalsMetCount / shift.totalMetrics) * 100) : 0;
                            const medals = ['🥇', '🥈', '🥉'];
                            return `
                                <div class="ranking-item rank-${index + 1}">
                                    <span class="rank-medal">${medals[index]}</span>
                                    <span class="rank-name">${shift.name}</span>
                                    <span class="rank-score">${percent}%</span>
                                    <span class="rank-detail">${shift.goalsMetCount}/${shift.totalMetrics} goals</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <!-- Bottom Performers -->
                <div class="rankings-card bottom-performers">
                    <h4 class="rankings-card-title">⚠️ Needs Attention</h4>
                    <div class="rankings-list">
                        ${bottomPerformers.map((shift, index) => {
                            const percent = shift.totalMetrics > 0 ? Math.round((shift.goalsMetCount / shift.totalMetrics) * 100) : 0;
                            return `
                                <div class="ranking-item needs-help">
                                    <span class="rank-position">#${rankedShifts.length - index}</span>
                                    <span class="rank-name">${shift.name}</span>
                                    <span class="rank-score">${percent}%</span>
                                    <span class="rank-detail">${shift.goalsMetCount}/${shift.totalMetrics} goals</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Metric Leaders -->
            <div class="metric-leaders">
                <h4 class="rankings-card-title">⭐ Metric Champions</h4>
                <div class="leaders-grid">
                    ${metricLeaders.dpm.best ? `
                        <div class="leader-item">
                            <div class="leader-icon">🎯</div>
                            <div class="leader-content">
                                <div class="leader-metric">Best DPM</div>
                                <div class="leader-shift">${metricLeaders.dpm.best.name}</div>
                                <div class="leader-value">${metricLeaders.dpm.best.value}</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${metricLeaders.safety.best.length > 0 ? `
                        <div class="leader-item">
                            <div class="leader-icon">🛡️</div>
                            <div class="leader-content">
                                <div class="leader-metric">Perfect Safety</div>
                                <div class="leader-shift">${metricLeaders.safety.best.length === 1 ? metricLeaders.safety.best[0] : metricLeaders.safety.best.length + ' Shifts'}</div>
                                <div class="leader-value">0 Incidents</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${metricLeaders.overtime.best ? `
                        <div class="leader-item">
                            <div class="leader-icon">⏰</div>
                            <div class="leader-content">
                                <div class="leader-metric">Lowest Overtime</div>
                                <div class="leader-shift">${metricLeaders.overtime.best.name}</div>
                                <div class="leader-value">${metricLeaders.overtime.best.value}</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${metricLeaders.receivingCPH.best ? `
                        <div class="leader-item">
                            <div class="leader-icon">📦</div>
                            <div class="leader-content">
                                <div class="leader-metric">Best Receiving</div>
                                <div class="leader-shift">${metricLeaders.receivingCPH.best.name}</div>
                                <div class="leader-value">${metricLeaders.receivingCPH.best.value}</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${metricLeaders.shippingCPH.best ? `
                        <div class="leader-item">
                            <div class="leader-icon">🚚</div>
                            <div class="leader-content">
                                <div class="leader-metric">Best Shipping</div>
                                <div class="leader-shift">${metricLeaders.shippingCPH.best.name}</div>
                                <div class="leader-value">${metricLeaders.shippingCPH.best.value}</div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Areas of Concern -->
            ${(metricLeaders.dpm.worst || metricLeaders.overtime.worst) ? `
                <div class="metric-leaders concern">
                    <h4 class="rankings-card-title">🚨 Areas of Concern</h4>
                    <div class="leaders-grid">
                        ${metricLeaders.dpm.worst && metricLeaders.dpm.worstValue > 1500 ? `
                            <div class="leader-item concern-item">
                                <div class="leader-icon">⚠️</div>
                                <div class="leader-content">
                                    <div class="leader-metric">Highest DPM</div>
                                    <div class="leader-shift">${metricLeaders.dpm.worst.name}</div>
                                    <div class="leader-value">${metricLeaders.dpm.worst.value}</div>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${metricLeaders.overtime.worst && metricLeaders.overtime.worstValue > 0 ? `
                            <div class="leader-item concern-item">
                                <div class="leader-icon">⚠️</div>
                                <div class="leader-content">
                                    <div class="leader-metric">Highest Overtime</div>
                                    <div class="leader-shift">${metricLeaders.overtime.worst.name}</div>
                                    <div class="leader-value">${metricLeaders.overtime.worst.value}</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function createGoalAchievementSummary(shiftData, stats) {
    // Create comprehensive goal achievement breakdown
    const allMetricNames = ['Safety Medical', 'Safety Non-Medical', 'DPM', 'Chase %', 
                            'Overtime', 'Receiving CPH', 'Shipping CPH', 'DPMO', 'Turnover %'];
    
    // Track which metrics are commonly met/missed
    const metricStats = {};
    allMetricNames.forEach(metricName => {
        metricStats[metricName] = { met: 0, missed: 0, na: 0 };
    });
    
    // Collect stats across all shifts
    shiftData.forEach(shift => {
        allMetricNames.forEach(metricName => {
            if (shift.metrics[metricName]) {
                const metric = shift.metrics[metricName];
                if (metric.status === 'green') {
                    metricStats[metricName].met++;
                } else if (metric.status === 'red') {
                    metricStats[metricName].missed++;
                } else {
                    metricStats[metricName].na++;
                }
            } else {
                metricStats[metricName].na++;
            }
        });
    });
    
    // Create metric achievement bars
    const metricBarsHTML = allMetricNames.map(metricName => {
        const stat = metricStats[metricName];
        const total = stat.met + stat.missed;
        if (total === 0) return ''; // Skip metrics with no data
        
        const metPercent = Math.round((stat.met / total) * 100);
        const missedPercent = 100 - metPercent;
        
        let statusClass = 'poor';
        if (metPercent === 100) statusClass = 'excellent';
        else if (metPercent >= 75) statusClass = 'good';
        else if (metPercent >= 50) statusClass = 'warning';
        
        return `
            <div class="goal-metric-row">
                <div class="goal-metric-name">${metricName}</div>
                <div class="goal-metric-bar-container">
                    <div class="goal-metric-bar">
                        <div class="goal-bar-met" style="width: ${metPercent}%"></div>
                        <div class="goal-bar-missed" style="width: ${missedPercent}%"></div>
                    </div>
                    <div class="goal-metric-stats">
                        <span class="stat-met">✅ ${stat.met}</span>
                        <span class="stat-missed">❌ ${stat.missed}</span>
                        <span class="stat-percent ${statusClass}">${metPercent}%</span>
                    </div>
                </div>
            </div>
        `;
    }).filter(html => html).join('');
    
    // Create shift-by-shift goal summary
    const shiftGoalsHTML = shiftData.map(shift => {
        const goalPercent = shift.totalMetrics > 0 ? 
            Math.round((shift.goalsMetCount / shift.totalMetrics) * 100) : 0;
        
        let badge = '⭐';
        if (goalPercent === 100) badge = '🏆';
        else if (goalPercent >= 90) badge = '⭐⭐⭐';
        else if (goalPercent >= 75) badge = '⭐⭐';
        else if (goalPercent >= 50) badge = '⭐';
        else badge = '⚠️';
        
        // Get breakdown by category
        const metricsByStatus = { green: [], red: [], yellow: [] };
        for (const metricName in shift.metrics) {
            const metric = shift.metrics[metricName];
            if (metric.status === 'green') {
                metricsByStatus.green.push(metricName);
            } else if (metric.status === 'red') {
                metricsByStatus.red.push(metricName);
            } else if (metric.status === 'yellow') {
                metricsByStatus.yellow.push(metricName);
            }
        }
        
        return `
            <div class="shift-goal-summary">
                <div class="shift-goal-header">
                    <span class="shift-goal-name">${shift.name}</span>
                    <span class="shift-goal-score">${goalPercent}% ${badge}</span>
                </div>
                <div class="shift-goal-breakdown">
                    <div class="goal-stat">
                        <span class="goal-stat-label">Met:</span>
                        <span class="goal-stat-value green">${shift.goalsMetCount} ✅</span>
                    </div>
                    <div class="goal-stat">
                        <span class="goal-stat-label">Missed:</span>
                        <span class="goal-stat-value red">${shift.totalMetrics - shift.goalsMetCount} ❌</span>
                    </div>
                    <div class="goal-stat">
                        <span class="goal-stat-label">Total:</span>
                        <span class="goal-stat-value">${shift.totalMetrics}</span>
                    </div>
                </div>
                ${metricsByStatus.red.length > 0 ? `
                    <div class="metrics-missed">
                        <strong>Needs Attention:</strong> ${metricsByStatus.red.join(', ')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    return `
        <div class="goal-achievement-section">
            <h3 class="overview-section-title">🎯 Goal Achievement Summary</h3>
            
            <div class="goal-summary-header">
                <div class="goal-overall-stat">
                    <div class="goal-overall-label">Overall Performance</div>
                    <div class="goal-overall-value">${stats.goalsMetPercent}%</div>
                    <div class="goal-overall-detail">${stats.goalsMetTotal} of ${stats.totalGoals} metrics met goals</div>
                </div>
            </div>
            
            <h4 class="goal-subsection-title">Performance by Metric</h4>
            <div class="goal-metrics-breakdown">
                ${metricBarsHTML}
            </div>
            
            <h4 class="goal-subsection-title">Performance by Shift</h4>
            <div class="shift-goals-grid">
                ${shiftGoalsHTML}
            </div>
        </div>
    `;
}

function createShiftSummaryCard(shift, month) {
    const goalPercent = shift.totalMetrics > 0 ? Math.round((shift.goalsMetCount / shift.totalMetrics) * 100) : 0;
    
    let scoreClass = 'poor';
    if (goalPercent >= 90) scoreClass = 'excellent';
    else if (goalPercent >= 75) scoreClass = 'good';
    else if (goalPercent >= 50) scoreClass = 'needs-improvement';
    
    // Get key metrics for mini display
    const keyMetrics = ['DPM', 'Safety Medical', 'Overtime', 'Chase %', 'Receiving CPH', 'Shipping CPH'];
    const metricsHTML = keyMetrics
        .filter(metricName => shift.metrics[metricName])
        .slice(0, 6) // Show max 6 metrics
        .map(metricName => {
            const metric = shift.metrics[metricName];
            const trendIndicator = metric.trend ? 
                `<span style="color: ${metric.trend.color}; font-size: 0.75em;">${metric.trend.arrow}</span>` : '';
            
            return `
                <div class="metric-mini ${metric.status}">
                    <div class="metric-mini-name">${metricName} ${trendIndicator}</div>
                    <div class="metric-mini-value">${metric.value}</div>
                    <div class="metric-mini-status">${metric.status === 'green' ? '✅' : metric.status === 'red' ? '❌' : '⚠️'}</div>
                </div>
            `;
        })
        .join('');
    
    return `
        <div class="shift-summary-card" data-shift="${shift.id}">
            <div class="shift-summary-header">
                <div class="shift-summary-name">${shift.name}</div>
                <div class="shift-summary-score ${scoreClass}">${goalPercent}%</div>
            </div>
            <div class="shift-metrics-mini">
                ${metricsHTML}
            </div>
        </div>
    `;
}

// ========================================
// COMPARISON MODE FUNCTIONALITY
// ========================================

let comparisonMode = false;
let selectedShiftsForComparison = [];

function enableComparisonMode() {
    comparisonMode = true;
    selectedShiftsForComparison = [];
    
    // Update UI
    const shiftSection = document.getElementById('shiftSection');
    shiftSection.classList.add('comparison-mode');
    
    // Show comparison toolbar, hide compare button
    document.getElementById('compareButton').style.display = 'none';
    document.getElementById('comparisonToolbar').style.display = 'flex';
    
    // Add checkboxes to shift cards
    const shiftCards = document.querySelectorAll('.shift-card:not(.overview-card)');
    shiftCards.forEach(card => {
        const checkbox = document.createElement('div');
        checkbox.className = 'shift-card-checkbox';
        card.appendChild(checkbox);
    });
}

function disableComparisonMode() {
    comparisonMode = false;
    selectedShiftsForComparison = [];
    
    // Update UI
    const shiftSection = document.getElementById('shiftSection');
    shiftSection.classList.remove('comparison-mode');
    
    // Hide comparison toolbar, show compare button
    document.getElementById('compareButton').style.display = 'block';
    document.getElementById('comparisonToolbar').style.display = 'none';
    
    // Remove checkboxes and clear selections
    const shiftCards = document.querySelectorAll('.shift-card:not(.overview-card)');
    shiftCards.forEach(card => {
        const checkbox = card.querySelector('.shift-card-checkbox');
        if (checkbox) checkbox.remove();
        card.classList.remove('selected');
    });
}

function toggleShiftSelection(card) {
    const shiftId = card.getAttribute('data-shift');
    const index = selectedShiftsForComparison.indexOf(shiftId);
    
    if (index > -1) {
        // Deselect
        selectedShiftsForComparison.splice(index, 1);
        card.classList.remove('selected');
        const checkbox = card.querySelector('.shift-card-checkbox');
        checkbox.textContent = '';
    } else {
        // Select (max 3)
        if (selectedShiftsForComparison.length < 3) {
            selectedShiftsForComparison.push(shiftId);
            card.classList.add('selected');
            const checkbox = card.querySelector('.shift-card-checkbox');
            checkbox.textContent = '✓';
        } else {
            // Show alert
            alert('You can compare up to 3 shifts at a time.');
            return;
        }
    }
    
    // Update button state
    updateCompareButton();
}

function updateCompareButton() {
    const count = selectedShiftsForComparison.length;
    document.getElementById('selectedCount').textContent = count;
    
    const startButton = document.getElementById('startCompareButton');
    if (count >= 2) {
        startButton.disabled = false;
    } else {
        startButton.disabled = true;
    }
}

function startComparison() {
    if (selectedShiftsForComparison.length < 2) {
        alert('Please select at least 2 shifts to compare.');
        return;
    }
    
    showComparisonView(currentMonth, selectedShiftsForComparison);
}

function showComparisonView(month, shiftIds) {
    console.log('Showing comparison for:', shiftIds, 'in month:', month);
    
    // Hide shift section, show comparison section
    document.getElementById('shiftSection').style.display = 'none';
    document.getElementById('comparisonSection').style.display = 'block';
    
    // Update title
    const shiftNames = shiftIds.map(id => shiftMetrics[id]?.name || id).join(' vs ');
    document.getElementById('comparisonTitle').textContent = `${month} - ${shiftNames}`;
    
    // Update breadcrumb
    updateBreadcrumb('view', month, `📊 Comparison: ${shiftNames}`);
    
    // Generate comparison content
    const comparisonHTML = generateComparisonHTML(month, shiftIds);
    document.getElementById('comparisonContainer').innerHTML = comparisonHTML;
    
    // Animate stats
    setTimeout(animateStatCards, 100);
}

function generateComparisonHTML(month, shiftIds) {
    const fiscalMonths = ['February', 'March', 'April', 'May', 'June', 'July', 
                         'August', 'September', 'October', 'November', 'December', 'January'];
    const fiscalIndex = fiscalMonths.indexOf(month);
    
    // Collect data for each shift
    const shiftsData = shiftIds.map(shiftId => {
        const shift = shiftMetrics[shiftId];
        const monthData = {};
        
        // Extract all metrics for this month
        if (shift && shift.categories) {
            Object.keys(shift.categories).forEach(category => {
                Object.keys(shift.categories[category]).forEach(subcategory => {
                    const metrics = shift.categories[category][subcategory];
                    const monthMetric = metrics.find(m => m.month === month);
                    if (monthMetric) {
                        monthData[subcategory] = monthMetric;
                    }
                });
            });
        }
        
        return {
            id: shiftId,
            name: shift?.name || shiftId,
            data: monthData
        };
    });
    
    // Get all unique metrics across shifts
    const allMetrics = new Set();
    shiftsData.forEach(shift => {
        Object.keys(shift.data).forEach(metric => allMetrics.add(metric));
    });
    
    // Calculate summary statistics
    const summaryStats = calculateComparisonSummary(shiftsData);
    
    // Generate HTML
    let html = `
        <!-- Summary Cards -->
        <div class="comparison-summary">
            ${generateSummaryCards(summaryStats)}
        </div>
        
        <!-- Winner/Loser Section -->
        ${generateWinnerSection(shiftsData, Array.from(allMetrics))}
        
        <!-- Metric-by-Metric Comparison -->
        <div class="metric-comparison-section">
            <h2>📊 Metric-by-Metric Comparison</h2>
            <div class="metric-comparison-grid">
                ${generateMetricComparisons(shiftsData, Array.from(allMetrics))}
            </div>
        </div>
    `;
    
    return html;
}

function calculateComparisonSummary(shiftsData) {
    const summary = {};
    
    shiftsData.forEach(shift => {
        let goalsMetCount = 0;
        let totalMetrics = 0;
        
        Object.values(shift.data).forEach(metric => {
            if (metric.status) {
                totalMetrics++;
                if (metric.status === 'green') goalsMetCount++;
            }
        });
        
        summary[shift.id] = {
            name: shift.name,
            goalsMetCount,
            totalMetrics,
            percentage: totalMetrics > 0 ? Math.round((goalsMetCount / totalMetrics) * 100) : 0
        };
    });
    
    return summary;
}

function generateSummaryCards(summaryStats) {
    const shifts = Object.values(summaryStats);
    
    // Find best performer
    const bestPerformer = shifts.reduce((best, current) => 
        current.percentage > best.percentage ? current : best
    );
    
    return shifts.map(shift => `
        <div class="comparison-summary-card ${shift.percentage === bestPerformer.percentage ? 'winner' : ''}">
            <h3>${shift.name}</h3>
            <div class="value">${shift.percentage}%</div>
            <div class="label">${shift.goalsMetCount}/${shift.totalMetrics} goals met</div>
            ${shift.percentage === bestPerformer.percentage ? '<div style="margin-top: 10px; font-size: 1.5em;">🏆</div>' : ''}
        </div>
    `).join('');
}

function generateWinnerSection(shiftsData, allMetrics) {
    const winners = {};
    
    allMetrics.forEach(metricName => {
        const metricValues = shiftsData.map(shift => ({
            name: shift.name,
            value: shift.data[metricName]?.value || 'N/A',
            numericValue: parseFloat((shift.data[metricName]?.value || '0').toString().replace(/[^0-9.-]/g, '')) || 0,
            status: shift.data[metricName]?.status || 'neutral'
        }));
        
        // Determine winner based on status (green wins)
        const greenShifts = metricValues.filter(m => m.status === 'green');
        if (greenShifts.length > 0) {
            winners[metricName] = greenShifts[0].name;
        }
    });
    
    const winnerEntries = Object.entries(winners);
    if (winnerEntries.length === 0) return '';
    
    // Count wins per shift
    const winCounts = {};
    Object.values(winners).forEach(shiftName => {
        winCounts[shiftName] = (winCounts[shiftName] || 0) + 1;
    });
    
    const topWinner = Object.entries(winCounts).reduce((a, b) => a[1] > b[1] ? a : b);
    
    return `
        <div class="comparison-winner-section">
            <h3>🏆 Overall Winner: ${topWinner[0]} (${topWinner[1]} metrics won)</h3>
            <div class="winner-list">
                ${winnerEntries.slice(0, 5).map(([metric, winner]) => `
                    <div class="winner-item">
                        <span class="metric-name">${metric}</span>
                        <span class="shift-name">${winner} ✓</span>
                    </div>
                `).join('')}
                ${winnerEntries.length > 5 ? `<p style="text-align: center; margin: 10px 0 0 0; color: #666;">... and ${winnerEntries.length - 5} more</p>` : ''}
            </div>
        </div>
    `;
}

function generateMetricComparisons(shiftsData, allMetrics) {
    const metricCategories = {
        '📊 Quality': ['DPM', 'Chase %'],
        '🛡️ Safety': ['Medical Incidents', 'Non-Medical Incidents'],
        '💰 Cost': ['Overtime', 'Turnover %', 'Receiving CPH', 'Shipping CPH'],
        '📈 Trending': ['Fill Rate %']
    };
    
    let html = '';
    
    Object.entries(metricCategories).forEach(([categoryName, metrics]) => {
        const categoryMetrics = metrics.filter(m => allMetrics.includes(m));
        if (categoryMetrics.length === 0) return;
        
        html += `<div class="metric-category" style="margin-top: 30px;">`;
        html += `<h3 style="color: #667eea; font-size: 1.2em; margin-bottom: 15px;">${categoryName}</h3>`;
        
        categoryMetrics.forEach(metricName => {
            html += generateMetricComparisonRow(metricName, shiftsData);
        });
        
        html += `</div>`;
    });
    
    return html;
}

function generateMetricComparisonRow(metricName, shiftsData) {
    const metricGoals = {
        'DPM': '< 1,500',
        'Medical Incidents': '= 0',
        'Non-Medical Incidents': '= 0',
        'Chase %': '< 3%',
        'Overtime': '= 0',
        'Turnover %': '< 10%',
        'Receiving CPH': '> 1,100',
        'Shipping CPH': '> 230',
        'Fill Rate %': '> 95%'
    };
    
    const goal = metricGoals[metricName] || '';
    
    // Get values for each shift
    const values = shiftsData.map(shift => {
        const metric = shift.data[metricName];
        return {
            name: shift.name,
            value: metric?.value || 'N/A',
            status: metric?.status || 'neutral',
            numericValue: parseFloat((metric?.value || '0').toString().replace(/[^0-9.-]/g, '')) || 0
        };
    });
    
    // Determine winner (most green, or best numeric value if all same status)
    let winner = null;
    const greenShifts = values.filter(v => v.status === 'green');
    if (greenShifts.length > 0 && greenShifts.length < values.length) {
        winner = greenShifts[0].name;
    }
    
    const valuesHTML = values.map(v => `
        <div class="shift-metric-value ${v.name === winner ? 'winner' : v.status === 'red' ? 'loser' : ''}">
            <div class="shift-metric-label">${v.name}</div>
            <div class="shift-metric-number">${v.value}</div>
            ${v.status === 'green' ? '<span class="shift-metric-badge goal-met">✅ Goal Met</span>' : ''}
            ${v.status === 'red' ? '<span class="shift-metric-badge goal-missed">❌ Missed</span>' : ''}
            ${v.name === winner ? '<span class="shift-metric-badge winner-badge">🏆 Winner</span>' : ''}
        </div>
    `).join('');
    
    return `
        <div class="metric-comparison-row">
            <div class="metric-comparison-row-header">
                <div class="metric-name">${metricName}</div>
                <div class="metric-goal">Goal: ${goal}</div>
            </div>
            <div class="metric-comparison-values">
                ${valuesHTML}
            </div>
        </div>
    `;
}

function backFromComparison() {
    document.getElementById('comparisonSection').style.display = 'none';
    document.getElementById('shiftSection').style.display = 'block';
    
    // Reset comparison mode
    disableComparisonMode();
    
    // Update breadcrumb
    updateBreadcrumb('month', currentMonth);
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Set up modal close handlers
document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.getElementById('closeModal');
    const modal = document.getElementById('trendModal');
    
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    
    // Close on outside click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });
});