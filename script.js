// DOM Elements
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

// Global variables for data table
let originalData = [];
let filteredData = [];
let currentSortColumn = null;
let currentSortOrder = null;
let columnFilters = {};

// Reusable Chart.js instance 
window.currentChart = window.currentChart || null;

// Summary globals 
let tableHeaders = [];       
let tableRowsCurrent = [];  

// Navigation functionality
function initNavigation() {
    // Hamburger menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    });

    // Close mobile menu when clicking on nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all nav links
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Get page name from data attribute
            const pageName = link.getAttribute('data-page');
            
            // Show corresponding page
            showPage(pageName);
            
            // Close mobile menu
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Close mobile menu on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
}

// Page navigation
function showPage(pageName) {
    // Hide all pages
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');

        // Update navigation active state
        navLinks.forEach(link => link.classList.remove('active'));
        const targetLink = document.querySelector(`[data-page="${pageName}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
        
        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Update page title
        updatePageTitle(pageName);

        // โหลด Power BI เมื่อเข้าหน้า Dashboard
        if (pageName === 'dashboard') setPbiSrcOnce();
    }
}

// Update page title
function updatePageTitle(pageName) {
    const titles = {
        'home': 'SleepSense - Home',
        'dashboard': 'SleepSense - Dashboard',
        'data-explorer': 'SleepSense - Data Explorer',
        'charts': 'SleepSense - Charts & Analysis',
        'download': 'SleepSense - Download'
    };
    
    document.title = titles[pageName] || 'SleepSense - Data Analysis';
}

// Load and display CSV data
async function loadCSVData() {
    const dataDisplay = document.querySelector('.data-display');
    
    if (!dataDisplay) return;
    
    // Show loading state
    dataDisplay.innerHTML = '<div class="loading-message">Loading data...</div>';
    
    try {
        // Fetch CSV file
        const response = await fetch('data/sleep.csv');
        
        if (!response.ok) {
            throw new Error('Failed to load CSV file');
        }
        
        const csvText = await response.text();
        
        // Parse CSV
        const rows = parseCSV(csvText);
        
        if (rows.length === 0) {
            dataDisplay.innerHTML = '<div class="loading-message">No data found</div>';
            return;
        }
        
        // Store original data
        originalData = rows;
        filteredData = [...rows];
        
        // Reset filters
        columnFilters = {};
        currentSortColumn = null;
        currentSortOrder = null;
        
        // Create table HTML
        renderTable();
        
        console.log('CSV data loaded successfully:', rows.length - 1, 'rows');
        
    } catch (error) {
        console.error('Error loading CSV:', error);
        dataDisplay.innerHTML = `
            <div class="loading-message">
                Error loading data. Please make sure sleep.csv is in the data folder.
            </div>
        `;
    }
}

// Data Explorer functionality
function initDataExplorer() {
    const statButtons = document.querySelectorAll('.statistics-grid .btn-blue');
    const resetButton = document.querySelector('#data-explorer .reset-button-container .btn-white');
    
    // Load/Render table 
    initDataExplorer_buildTable();
    ensureSummaryUI(); // เผื่อกรณีโหลดเร็ว/ช้าไม่เท่ากัน

    // ทำให้ปุ่มสีน้ำเงิน (หัวข้อ Summary) เป็น non-interactive เฉพาะหน้า Data Explorer
    document.querySelectorAll('#data-explorer .statistics-grid .btn-blue').forEach(btn => {
        btn.setAttribute('aria-disabled', 'true'); // บอก screen reader ว่ากดไม่ได้
        btn.setAttribute('tabindex', '-1');       // ไม่รับโฟกัสคีย์บอร์ด
        // กันการคลิกที่อาจหลุดมาจาก handler อื่น ๆ (ถ้ามี)
        btn.addEventListener('click', (e) => e.preventDefault(), { capture: true, passive: false });
    });

    // Reset functionality
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            statButtons.forEach(btn => btn.classList.remove('active'));
            updateStatValues('0');
            
            // Reset table: rebuild fresh
            initDataExplorer_buildTable();
        });
    }
}

// Simulate data processing
function simulateDataProcessing(statType) {
    const statValues = document.querySelectorAll('.stat-value');
    
    // Animate values
    statValues.forEach((value, index) => {
        const originalValue = parseInt(value.textContent);
        const newValue = originalValue + Math.floor(Math.random() * 20) - 10;
        
        // Animate the value change
        animateValue(value, originalValue, newValue, 500);
    });
}

// Animate numeric value
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.round(start + (end - start) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Update all stat values
function updateStatValues(value) {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(element => {
        element.textContent = value;
    });
}

// Charts functionality
function initCharts() {
    const chartModeButtons = document.querySelectorAll('.chart-buttons .btn');
    const visualizeControls = document.getElementById('visualize-controls');
    const correlationControls = document.getElementById('correlation-controls');
    const generateBtnsVisual = document.querySelectorAll('#visualize-controls .generate-btn');
    const resetBtn = document.querySelector('#charts .btn-white');
    
    // Mode switching buttons
    chartModeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.getAttribute('data-mode');
            
            // Hide all control sections
            visualizeControls.classList.remove('active');
            correlationControls.classList.remove('active');
            
            // Show selected control section
            if (mode === 'visualize') {
                visualizeControls.classList.add('active');
            } else if (mode === 'correlation') {
                correlationControls.classList.add('active');
            }
        });
    });
    
    // Generate buttons
    generateBtnsVisual.forEach(btn => {
        btn.addEventListener('click', () => {
            const chartType = visualizeControls.querySelectorAll('.chart-select')[0]?.value;
            const column = visualizeControls.querySelectorAll('.chart-select')[1]?.value;
            generateChart(chartType, { chartType, column });
        });
    });


    // === Correlation: wire button ===
    const corrRoot = document.getElementById('correlation-controls');
    if (corrRoot) {
        const selects = corrRoot.querySelectorAll('.chart-select'); // [X, Y]
        const corrButton = corrRoot.querySelector('.generate-btn'); // ปุ่มสีม่วง
        if (selects.length >= 2 && corrButton) {
            corrButton.addEventListener('click', () => {
                const xLabel = selects[0].value;
                const yLabel = selects[1].value;
                buildCorrelationChart(xLabel, yLabel);
                populateCorrelationSelects(); 
            });
        }
    }
    
    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetCharts();
        });
    }
}

// Generate chart
async function generateChart(type, options = {}) {
  const chartDisplay = document.querySelector('.chart-display');
  if (!chartDisplay) return;

  // โหลดข้อมูลจาก CSV
  const { headers, rows } = await loadCSVForCharts();

  // อ่านค่าจาก options (มาจากปุ่ม Visualize)
  const chartType = options.chartType;  // "Bar Chart" | "Pie Chart" | "Line Chart" | "Scatter Chart"
  const displayName = options.column;   // ชื่อที่เลือกจาก dropdown
  const headerName = findHeaderForDisplayName(displayName, headers);

  // หา index ของคอลัมน์จริง
  const colIndex = headers.indexOf(headerName);
  if (colIndex === -1) {
    chartDisplay.innerHTML = `<div class="loading-message">Column not found: ${displayName}</div>`;
    return;
  }

  // ดึงค่าคอลัมน์นั้นทั้งหมด
  const rawValues = rows.map(r => r[colIndex]).filter(v => v !== undefined && String(v).trim() !== '');
  const mostlyNumeric = isMostlyNumeric(rawValues);

  // เตรียม canvas
  chartDisplay.innerHTML = `<canvas id="chartCanvas"></canvas>`;
  const ctx = document.getElementById('chartCanvas').getContext('2d');
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  // เตรียม data + options สำหรับ Chart.js
  let chartJsType = 'bar';
  let data = {};
  let optionsChart = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#ffffff' } },
      title: {
        display: true,
        text: `${chartType} of ${headerName}`,
        color: '#FDECFB',
        font: { size: 18 }
      },
        tooltip: {
            enabled: true,
            backgroundColor: '#1F0044',   // สีพื้นหลัง tooltip
            titleColor: '#F5ECFF',        // สีตัวอักษรหัวเรื่อง
            bodyColor: '#FFFFFF',         // สีตัวอักษรเนื้อหา
            borderWidth: 1.5,
            displayColors: true,         // แสดงกล่องสีเล็ก ๆ ใน tooltip
            padding: 10,
            cornerRadius: 8
      }
    },
    scales: {
      x: { ticks: { color: '#E5CDFF' }, grid: { color: 'rgba(255,255,255,0.12)' } },
      y: { ticks: { color: '#E5CDFF' }, grid: { color: 'rgba(255,255,255,0.12)' } }
    }
  };

  // กำหนดชนิดกราฟ
  if (chartType === 'Pie Chart') chartJsType = 'pie';
  else if (chartType === 'Bar Chart') chartJsType = 'bar';
  else if (chartType === 'Line Chart') chartJsType = 'line';
  else if (chartType === 'Scatter Chart') chartJsType = 'scatter';

  // สร้าง dataset ตามชนิดกราฟ
  if (chartJsType === 'bar' || chartJsType === 'pie') {
    // Categorical → นับจำนวนแต่ละหมวด
    const kv = countBy(rawValues);        // Map(label → count)
    const labels = Array.from(kv.keys());
    const counts = Array.from(kv.values());

    data = {
      labels,
      datasets: [{
        label: headerName,
        data: counts,
        backgroundColor: chartJsType === 'pie'
          ? labels.map((_, i) => `hsl(${(i*47)%360}, 80%, 60%)`)
          : '#B672FE'
      }]
    };

    // pie ไม่มีแกน x/y
    if (chartJsType === 'pie') optionsChart.scales = {};

  } else if (chartJsType === 'line') {
    if (!mostlyNumeric) {
      chartDisplay.innerHTML = `<div class="loading-message">Line chart requires numeric column.</div>`;
      return;
    }
    const series = rawValues.map(v => parseFloat(String(v).replace(/,/g,'')));
    data = {
      labels: series.map((_, i) => i + 1),
      datasets: [{
        label: headerName,
        data: series,
        borderColor: '#EC45D8',
        fill: false,
        tension: 0.2,
        pointRadius: 2
      }]
    };

  } else if (chartJsType === 'scatter') {
    if (!mostlyNumeric) {
      chartDisplay.innerHTML = `<div class="loading-message">Scatter chart requires numeric column.</div>`;
      return;
    }
    const pts = rawValues.map((v, i) => ({ x: i + 1, y: parseFloat(String(v).replace(/,/g,'')) }));
    data = {
      datasets: [{
        label: headerName,
        data: pts,
        backgroundColor: '#0BBEE7'
      }]
    };
  }

  // สร้างกราฟ
  chartInstance = new Chart(ctx, {
    type: chartJsType,
    data,
    options: optionsChart
  });
}


// Reset charts
function resetCharts() {
    const chartDisplay = document.querySelector('.chart-display');
    const chartSelects = document.querySelectorAll('#charts .chart-select');
    const modeButtons = document.querySelectorAll('.chart-buttons .btn');
    
    if (chartDisplay) {
        chartDisplay.innerHTML = '<p>Chart will be displayed here</p>';
    }
    
    // Reset select values
    chartSelects.forEach(select => {
        select.selectedIndex = 0;
    });
    
    // Show visualize controls
    document.getElementById('visualize-controls').classList.add('active');
    document.getElementById('correlation-controls').classList.remove('active');
}

// Update chart preview
function updateChartPreview() {
    const chartSelects = document.querySelectorAll('#charts .chart-select');
    const chartType = chartSelects[0]?.value;
    const column = chartSelects[1]?.value;
    
    if (chartType && column) {
        console.log(`Chart preview: ${chartType} for ${column}`);
    }
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Add loading states and animations
function initAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.column-card, .stat-item, .control-group').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Keyboard navigation
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // ESC key closes mobile menu
        if (e.key === 'Escape') {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        // Number keys for quick navigation (1-5)
        if (e.key >= '1' && e.key <= '5') {
            const pageNames = ['home', 'dashboard', 'data-explorer', 'charts', 'download'];
            const pageIndex = parseInt(e.key) - 1;
            
            if (pageNames[pageIndex]) {
                showPage(pageNames[pageIndex]);
                
                // Update navigation
                navLinks.forEach(link => link.classList.remove('active'));
                const targetLink = document.querySelector(`[data-page="${pageNames[pageIndex]}"]`);
                if (targetLink) {
                    targetLink.classList.add('active');
                }
            }
        }
    });
}

// Performance optimization
function initPerformanceOptimizations() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Debounce resize events
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Handle resize events here
            console.log('Window resized');
        }, 250);
    });
}

// Error handling
function initErrorHandling() {
    window.addEventListener('error', (e) => {
        console.error('JavaScript error:', e.error);
        // Could send error to analytics service
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        // Could send error to analytics service
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        initNavigation();
        initDataExplorer();
        initCharts();
        initSmoothScrolling();
        initAnimations();
        initKeyboardNavigation();
        initPerformanceOptimizations();
        initErrorHandling();
        
        console.log('SleepSense application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showPage,
        generateChart,
        resetCharts,
        animateValue
    };
}

/* ===== Utility: CSV Parser (รองรับ , และ "…","…") ===== */
function parseCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim().length);
  if (!lines.length) return { headers: [], rows: [] };

  const headers = splitCSVLine(lines[0]);
  const rows = lines.slice(1).map(splitCSVLine);
  return { headers, rows };
}

function splitCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { // escaped quote
        cur += '"'; i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function escapeHTML(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function populateCorrelationSelects() {
  const root = document.getElementById('correlation-controls');
  if (!root) return;
  const selects = root.querySelectorAll('.chart-select');
  if (selects.length < 2) return;

  // ถ้าเคยมี options แล้ว ไม่ต้องเติมซ้ำ
  if (selects[0].options.length > 1 && selects[1].options.length > 1) return;

  // ดึง headers จาก originalData (โหลดแล้วในหน้า Data Explorer) หรือจาก cache ของ Charts
  let headers = [];
  if (Array.isArray(window.originalData) && window.originalData.length) {
    headers = window.originalData[0];
  } else if (window.chartDataCache && window.chartDataCache.headers) {
    headers = window.chartDataCache.headers;
  }

  if (!headers || !headers.length) return;

  const fill = (sel) => {
    // เก็บ option แรกไว้ถ้าเป็น placeholder
    const first = sel.options.length ? sel.options[0] : null;
    sel.innerHTML = '';
    if (first) sel.appendChild(first);
    headers.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = h;
      sel.appendChild(opt);
    });
  };

  fill(selects[0]);
  fill(selects[1]);
}

/* ========= Correlation helpers ========= */
async function ensureDataAvailableForCharts() {
  if (Array.isArray(window.originalData) && window.originalData.length > 1) return;

  const { headers, rows } = await loadCSVForCharts();
  window.originalData = [headers, ...rows];
}

function getHeadersAndRowsFromOriginal() {
  if (Array.isArray(window.originalData) && window.originalData.length) {
    return { headers: window.originalData[0], rows: window.originalData.slice(1) };
  }
  if (window.chartDataCache) {
    return {
      headers: window.chartDataCache.headers || [],
      rows: window.chartDataCache.rows || []
    };
  }
  return { headers: [], rows: [] };
}


function resolveColumnLabel(label, headers) {
  if (!label) return null;
  const exact = headers.find(h => h.trim().toLowerCase() === label.trim().toLowerCase());
  if (exact) return exact;
  const simplified = headers.find(
    h => h.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase() === label.trim().toLowerCase()
  );
  if (simplified) return simplified;
  const fuzzy = headers.find(h => h.toLowerCase().includes(label.trim().toLowerCase()));
  return fuzzy || null;
}

function getColumnValues(headers, rows, colNameResolved) {
  const idx = headers.indexOf(colNameResolved);
  if (idx === -1) return [];
  return rows.map(r => r[idx]);
}

function alignNumericPairs(xVals, yVals) {
  const out = [];
  const len = Math.min(xVals.length, yVals.length);
  for (let i = 0; i < len; i++) {
    const xv = parseFloat(String(xVals[i]).replace(/,/g, ''));
    const yv = parseFloat(String(yVals[i]).replace(/,/g, ''));
    if (!isNaN(xv) && !isNaN(yv)) out.push({ x: xv, y: yv });
  }
  return out;
}

function pearsonR(xs, ys) {
  const n = xs.length;
  if (n === 0) return NaN;
  let sx = 0, sy = 0, sxy = 0, sx2 = 0, sy2 = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i], y = ys[i];
    sx += x; sy += y; sxy += x * y; sx2 += x * x; sy2 += y * y;
  }
  const num = n * sxy - sx * sy;
  const den = Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy));
  return den === 0 ? NaN : num / den;
}

/* ========= Build Correlation Chart ========= */
async function buildCorrelationChart(xLabelFromUI, yLabelFromUI) {
  const chartDisplay = document.querySelector('.chart-display');
  chartDisplay.style.minHeight = '320px';
  if (!chartDisplay) return;

  // clear area + add canvas
  chartDisplay.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.id = 'correlation-canvas';
  chartDisplay.appendChild(canvas);

  // destroy old chart (ใช้ตัวกลางเดียว)
  if (window.currentChart) {
    window.currentChart.destroy();
    window.currentChart = null;
  }

  await ensureDataAvailableForCharts();
  const { headers, rows } = getHeadersAndRowsFromOriginal();

  const xHeader = resolveColumnLabel(xLabelFromUI, headers);
  const yHeader = resolveColumnLabel(yLabelFromUI, headers);
  if (!xHeader || !yHeader) {
    chartDisplay.innerHTML = `<p>Column not found. Please check selected columns.</p>`;
    return;
  }

  const xRaw = getColumnValues(headers, rows, xHeader);
  const yRaw = getColumnValues(headers, rows, yHeader);
  const points = alignNumericPairs(xRaw, yRaw);
  if (points.length === 0) {
    chartDisplay.innerHTML = `<p>Selected columns are not numeric or no overlapping numeric rows.</p>`;
    return;
  }

  const r = pearsonR(points.map(p => p.x), points.map(p => p.y));
  const ctx = canvas.getContext('2d');

  window.currentChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: `${xHeader} vs ${yHeader}`,
        data: points,
        pointRadius: 3,
        backgroundColor: 'rgba(182,114,254,0.85)',
        borderColor: 'rgba(182,114,254,1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#FDECFB' } },
        title: {
          display: true,
          text: `Correlation: ${xHeader} vs ${yHeader}  (r = ${isNaN(r) ? 'N/A' : r.toFixed(3)})`,
          color: '#FDECFB',
          font: { size: 16, weight: '600' }
        },
        tooltip: {
          backgroundColor: '#1F0044',
          titleColor: '#FDECFB',
          bodyColor: '#FDECFB',
          callbacks: {
            label: (ctx) => ` (x: ${ctx.raw.x}, y: ${ctx.raw.y})`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: xHeader, color: '#FDECFB' },
          ticks: { color: '#FDECFB' },
          grid: { color: 'rgba(255,255,255,0.08)' }
        },
        y: {
          title: { display: true, text: yHeader, color: '#FDECFB' },
          ticks: { color: '#FDECFB' },
          grid: { color: 'rgba(255,255,255,0.08)' }
        }
      }
    }
  });
}

/* ===== Charts: shared CSV cache & helpers ===== */
let chartDataCache = null;
let chartInstance = null; // เก็บกราฟปัจจุบันไว้ทำ destroy

async function loadCSVForCharts() {
  if (chartDataCache) return chartDataCache;
  const res = await fetch('data/sleep.csv', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load CSV for charts');
  const text = await res.text();
  const parsed = parseCSV(text);
  const headers = parsed.headers || parsed[0];
  const rows = parsed.rows || parsed.slice(1);
  chartDataCache = { headers, rows };
  return chartDataCache;
}

// ลดรูปข้อความเพื่อจับคู่ชื่อคอลัมน์ (ตัดวงเล็บ/สัญลักษณ์/ช่องว่าง, แปลงเป็นตัวพิมพ์เล็ก)
function normalizeLabel(s) {
  return String(s)
    .toLowerCase()
    .replace(/\(.*?\)/g, '')     // ตัดข้อความในวงเล็บ
    .replace(/[^a-z0-9]+/g, ' ') // เก็บเฉพาะตัวอักษร/ตัวเลข
    .replace(/\s+/g, ' ')        // ช่องว่างซ้ำ
    .trim();
}

// หา header จริงจาก CSV ให้ตรงกับชื่อที่ผู้ใช้เลือกใน dropdown
function findHeaderForDisplayName(displayName, headers) {
  const target = normalizeLabel(displayName);
  // 1) ตรงตัวก่อน
  let idx = headers.indexOf(displayName);
  if (idx !== -1) return headers[idx];

  // 2) เทียบแบบ normalize
  const pairs = headers.map(h => [h, normalizeLabel(h)]);
  const found = pairs.find(([orig, norm]) => norm === target);
  if (found) return found[0];

  // 3) fallback: partial match
  const partial = pairs.find(([orig, norm]) => norm.includes(target) || target.includes(norm));
  return partial ? partial[0] : displayName; // ถ้าไม่เจอจริง ๆ ก็คืนชื่อเดิม
}

// ตัวช่วย: ค่าในชุดนี้เป็นตัวเลข “ส่วนใหญ่” หรือไม่
function isMostlyNumeric(values) {
  let numericCount = 0, sample = 0;
  for (const v of values) {
    const n = parseFloat(String(v).replace(/,/g,''));
    if (!isNaN(n)) numericCount++;
    sample++;
    if (sample >= 30) break; // ตัวอย่างพอประมาณ
  }
  return numericCount >= Math.max(1, Math.floor(sample * 0.6));
}

// รวมกลุ่ม: {ค่า → จำนวน}
function countBy(values) {
  const map = new Map();
  for (const v of values) {
    const k = String(v ?? '').trim();
    if (!k) continue;
    map.set(k, (map.get(k) || 0) + 1);
  }
  return map;
}

/* ===================== Data Explorer: build table + sort/filter ===================== */
async function initDataExplorer_buildTable() {
  const dataDisplay = document.querySelector('#data-explorer .data-display');
  if (!dataDisplay) return;

  dataDisplay.innerHTML = `<div class="loading-message">Loading data…</div>`;

  try {
    const res = await fetch('data/sleep.csv', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csvText = await res.text();

    // รองรับทั้ง parseCSV ที่คืน {headers,rows} หรือ array 2D
    const parsed = parseCSV(csvText);
    const headers = Array.isArray(parsed) ? parsed[0] : parsed.headers;
    const rows    = Array.isArray(parsed) ? parsed.slice(1) : parsed.rows;

    tableHeaders = headers.slice();
    tableRowsCurrent = rows.slice();

    // สร้างโครงตาราง
    const container = document.createElement('div');
    container.className = 'data-table-container';

    const table = document.createElement('table');
    table.className = 'data-table';

    // ---------- thead (หัวคอลัมน์ + ปุ่ม sort + filter) ----------
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');

    headers.forEach((h, colIdx) => {
      const th = document.createElement('th');
      th.innerHTML = `
        <div class="table-header">
          <div class="header-content">
            <span class="header-title">${escapeHTML(h)}</span>
            <div class="sort-buttons">
              <button class="sort-btn" data-col="${colIdx}" data-dir="asc" title="Sort Ascending">▲</button>
              <button class="sort-btn" data-col="${colIdx}" data-dir="desc" title="Sort Descending">▼</button>
            </div>
          </div>
          <div class="filter-container">
            <select class="filter-select" data-col="${colIdx}">
              <option value="">All</option>
            </select>
          </div>
        </div>
      `;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // ---------- tbody (ข้อมูล) ----------
    const tbody = document.createElement('tbody');
    rows.forEach(row => {
      const tr = document.createElement('tr');
      headers.forEach((_, i) => {
        const td = document.createElement('td');
        td.textContent = row[i] ?? '';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    container.appendChild(table);

    dataDisplay.innerHTML = '';
    dataDisplay.appendChild(container);

    // ใส่ filter/sort events + render ใหม่เมื่อเปลี่ยน
    wireSortFilter(thead, tbody, headers, rows);
    ensureSummaryUI();          // สร้าง UI summary ถ้ายังไม่มี
    refreshSummaryColumnOptions(); // เติมชื่อคอลัมน์ลง select

  } catch (err) {
    console.error(err);
    dataDisplay.innerHTML = `<div class="loading-message" style="color:#EC45D8">
      Error loading data. Please make sure sleep.csv is in the data folder.
    </div>`;
  }
}

// สร้าง UI (ถ้ายังไม่มี) และเติม options คอลัมน์
function ensureSummaryUI() {
  const summary = document.querySelector('#data-explorer .summary-section');
  if (!summary) return;

  // มีแล้วไม่สร้างซ้ำ
  if (!summary.querySelector('.summary-controls')) {
    const wrap = document.createElement('div');
    wrap.className = 'summary-controls';

    const sel = document.createElement('select');
    sel.className = 'summary-select';
    sel.setAttribute('aria-label', 'Select column for summary');

    const btn = document.createElement('button');
    btn.className = 'btn btn-purple';
    btn.textContent = 'Calculate';

    // เมื่อกด จะคำนวณตามคอลัมน์ที่เลือก บนข้อมูลที่กำลังแสดง
    btn.addEventListener('click', () => {
      const idx = sel.selectedIndex >= 0 ? sel.selectedIndex : 0;
      calculateAndShowSummary(idx);
    });

    wrap.appendChild(sel);
    wrap.appendChild(btn);
    // แทรกด้านบนของ statistics-grid
    const grid = summary.querySelector('.statistics-grid');
    summary.insertBefore(wrap, grid);
  }

  refreshSummaryColumnOptions();
}

// เติมรายชื่อคอลัมน์ลงใน select
function refreshSummaryColumnOptions() {
  const sel = document.querySelector('#data-explorer .summary-section .summary-select');
  if (!sel || !tableHeaders || !tableHeaders.length) return;

  sel.innerHTML = '';
  tableHeaders.forEach(h => {
    const opt = document.createElement('option');
    opt.textContent = h;
    sel.appendChild(opt);
  });

  // เลือกคอลัมน์ตัวเลขแรกเป็นค่าเริ่มต้น (ถ้ามี)
  const firstNumeric = tableHeaders.findIndex((_, i) => isMostlyNumeric(tableRowsCurrent.map(r => r[i])));
  if (firstNumeric >= 0) sel.selectedIndex = firstNumeric; else sel.selectedIndex = 0;
}

function calculateAndShowSummary(colIndex) {
  // ดึงค่าจากข้อมูลที่กำลังแสดง
  const valuesRaw = tableRowsCurrent.map(r => r[colIndex]);
  const nums = valuesRaw
    .map(v => parseFloat(String(v).replace(/,/g,'')))
    .filter(v => !isNaN(v));

  const isNumeric = nums.length > 0 && nums.length >= Math.floor(valuesRaw.length * 0.5);

  // เตรียมผลลัพธ์
  let mean='—', median='—', mode='—', range='—', min='—', max='—', sum='—', count=valuesRaw.length;

  if (isNumeric) {
    // SUM
    const s = nums.reduce((a,b)=>a+b,0);
    // MEAN
    const m = s / nums.length;
    // SORT เพื่อทำ median/min/max
    const sorted = [...nums].sort((a,b)=>a-b);
    const mid = Math.floor(sorted.length/2);
    const md = sorted.length % 2 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2;
    // MIN/MAX/RANGE
    const mn = sorted[0];
    const mx = sorted[sorted.length-1];

    sum   = formatNum(s);
    mean  = formatNum(m);
    median= formatNum(md);
    min   = formatNum(mn);
    max   = formatNum(mx);
    range = formatNum(mx - mn);
    mode  = formatMode(valuesRaw); // โหมดแบบถ้วน ๆ (รองรับค่าซ้ำ)
  } else {
    // ถ้าไม่ใช่ตัวเลข แสดง Count + Mode (ค่าที่พบบ่อยสุด)
    mode = formatMode(valuesRaw);
  }

  // ใส่ค่าไปที่กล่องทางขวาตามลำดับปุ่ม: Mean, Median, Mode, Range, Minimum, Maximum, Sum, Count
  const boxes = document.querySelectorAll('#data-explorer .statistics-grid .stat-value');
  if (boxes.length >= 8) {
    boxes[0].textContent = mean;
    boxes[1].textContent = median;
    boxes[2].textContent = mode;
    boxes[3].textContent = range;
    boxes[4].textContent = min;
    boxes[5].textContent = max;
    boxes[6].textContent = sum;
    boxes[7].textContent = count;
  }
}

function formatNum(n) {
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function formatMode(arr) {
  const freq = new Map();
  for (const v of arr) {
    const k = String(v);
    if (!k) continue;
    freq.set(k, (freq.get(k) || 0) + 1);
  }
  let best = '—', bestC = 0;
  for (const [k,c] of freq.entries()) {
    if (c > bestC) { best = k; bestC = c; }
  }
  return best;
}

function isMostlyNumeric(values) {
  let numericCount = 0, sample = 0;
  for (const v of values) {
    const n = parseFloat(v);
    if (!isNaN(n)) numericCount++;
    sample++;
    if (sample >= 20) break;
  }
  return numericCount >= Math.max(1, Math.floor(sample * 0.6));
}

// === ใส่/จัดการ Filter + Sort ===
function wireSortFilter(thead, tbody, headers, rows) {
  let originalRows = rows;
  let currentRows  = [...rows];
  let activeSort   = { col: null, dir: null };
  let activeFilters = {};

  // เติม option ให้ select ของแต่ละคอลัมน์ + event
  headers.forEach((_, colIdx) => {
    const sel = thead.querySelector(`.filter-select[data-col="${colIdx}"]`);
    if (!sel) return;
    // ดึงค่าดิบของคอลัมน์
    const rawVals = originalRows
    .map(r => r[colIdx])
    .filter(v => v !== undefined && String(v).trim() !== '');

    // unique + ตัดช่องว่าง
    const uniq = Array.from(new Set(rawVals.map(v => String(v).trim())));

    // ตรวจว่าเป็นตัวเลขส่วนใหญ่ไหม (หรือบังคับถ้าชื่อคอลัมน์เป็น Person ID)
    const headerName = headers[colIdx] ? String(headers[colIdx]).toLowerCase() : '';
    const forceNumericByName = /person\s*id/.test(headerName);
    const numeric = forceNumericByName || isMostlyNumeric(uniq);

    // เรียง
    uniq.sort((a, b) => {
    if (numeric) {
        const na = parseFloat(a), nb = parseFloat(b);
        if (isNaN(na) && isNaN(nb)) return 0;
        if (isNaN(na)) return -1;
        if (isNaN(nb)) return 1;
        return na - nb;
    }
    return a.localeCompare(b, undefined, { numeric: false, sensitivity: 'base' });
    });

    // เติม option
    uniq.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    sel.appendChild(opt);
    });

    sel.addEventListener('change', () => {
      const val = sel.value || '';
      if (val) activeFilters[colIdx] = val; else delete activeFilters[colIdx];
      applyFilterAndSort();
      renderTbody(tbody, headers, currentRows);
    });
  });

  // ปุ่ม sort
  thead.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const col = Number(btn.dataset.col);
      const dir = btn.dataset.dir; // 'asc' | 'desc'
      activeSort = { col, dir };
      thead.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilterAndSort();
      renderTbody(tbody, headers, currentRows);
    });
  });

  // render ครั้งแรก
  renderTbody(tbody, headers, currentRows);

  function applyFilterAndSort() {
    // filter (AND)
    let filtered = originalRows.filter(r =>
      Object.entries(activeFilters).every(([c, v]) => String(r[Number(c)] ?? '') === v)
    );

    // sort
    if (activeSort.col != null) {
      const c = activeSort.col;
      const d = activeSort.dir === 'desc' ? -1 : 1;
      const numeric = isNumericColumn(filtered, c);
      filtered.sort((a, b) => {
        const A = a[c] ?? '', B = b[c] ?? '';
        if (numeric) {
          const aN = parseFloat(A), bN = parseFloat(B);
          if (isNaN(aN) && isNaN(bN)) return 0;
          if (isNaN(aN)) return -1 * d;
          if (isNaN(bN)) return  1 * d;
          return (aN - bN) * d;
        }
        return String(A).localeCompare(String(B)) * d;
      });
    }
    currentRows = filtered;
    tableRowsCurrent = currentRows.slice();
  }
}

function renderTbody(tbodyEl, headers, rows) {
  tbodyEl.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    headers.forEach((_, i) => {
      const td = document.createElement('td');
      td.textContent = r[i] ?? '';
      tr.appendChild(td);
    });
    tbodyEl.appendChild(tr);
  });
}

function isNumericColumn(rows, colIdx) {
  let numericCount = 0, sample = 0;
  for (const r of rows) {
    const v = r[colIdx];
    if (v !== undefined && String(v).trim() !== '') {
      sample++;
      if (!isNaN(parseFloat(v))) numericCount++;
    }
    if (sample >= 12) break;
  }
  return numericCount >= Math.max(1, Math.floor(sample * 0.6));
}

function isMostlyNumeric(values) {
  let numericCount = 0, sample = 0;
  for (const v of values) {
    const n = parseFloat(v);
    if (!isNaN(n)) numericCount++;
    sample++;
    if (sample >= 20) break; 
  }
  // อย่างน้อย 60% เป็นตัวเลข ถือว่าเป็นคอลัมน์ตัวเลข
  return numericCount >= Math.max(1, Math.floor(sample * 0.6));
}

// === Download CSV (global) ===
async function downloadCSV() {
  try {
    const res = await fetch('data/sleep.csv', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const csvText = await res.text();
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'sleep.csv'; // ชื่อไฟล์ตอนเซฟ
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download failed:', err);
    alert('Failed to download CSV file. Please try again.');
  }
}

// ให้ inline onclick มองเห็นฟังก์ชันนี้
window.downloadCSV = downloadCSV;

// ===== Power BI lazy embed =====
function setPbiSrcOnce() {
  // วาง URL จากขั้นตอนที่ 1 ตรงนี้
  const PBI_EMBED_URL = "https://app.powerbi.com/view?r=eyJrIjoiMTNkN2UyNjEtZjRmMS00NDhlLTg5NWYtOWM0NmZlZDYyYmQ5IiwidCI6ImZkMjA2NzE1LTc1MDktNGFlNS05Yjk2LTc2YmI5Nzg4NmE4NCIsImMiOjEwfQ%3D%3D";

  const frame = document.getElementById("pbi-report");
  if (!frame) return;

  // ใส่ src แค่ครั้งแรกเท่านั้น
  if (!frame.getAttribute("src")) {
    frame.setAttribute("src", PBI_EMBED_URL);
  }
}