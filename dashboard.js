// Medical Dashboard JavaScript
// This file loads data from JSON files and populates the dashboard

// Tab switching function
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-pane');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => button.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Mark button as active
    event.target.classList.add('active');
}

// Load all data when page loads
async function loadDashboardData() {
    try {
        // Load all JSON files
        const [currentData, labData, o2Data, timelineData, neuroData, medicationsData] = await Promise.all([
            fetch('data/current_status.json').then(r => r.json()),
            fetch('data/labs.json').then(r => r.json()),
            fetch('data/o2_summary.json').then(r => r.json()),
            fetch('data/timeline.json').then(r => r.json()),
            fetch('data/neuro_events.json').then(r => r.json()),
            fetch('data/medications.json').then(r => r.json())
        ]);
        
        // Update last updated time
        document.getElementById('last-updated').textContent = `Last Updated: ${currentData.lastUpdated}`;
        
        // Update critical alerts
        updateAlerts(currentData, o2Data);
        
        // Update each section
        updateOverview(currentData, medicationsData);
        updateLabs(labData);
        updateOxygenAnalysis(o2Data);
        updateTimeline(timelineData);
        updateNeuroEvents(neuroData);
        
        // Create charts
        createANAChart(labData.anaProgression);
        createAutonomicChart(o2Data.autonomicResponse);
        createSeverityChart(o2Data.severityProgression);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showErrorMessage();
    }
}

// Update alert box
function updateAlerts(currentData, o2Data) {
    document.getElementById('ana-current').textContent = currentData.currentANA;
    document.getElementById('lowest-spo2').textContent = o2Data.lowestSpO2 + '%';
}

// Update overview tab
function updateOverview(currentData, medicationsData) {
    // Current status
    const statusHtml = `
        <p><strong>Primary Diagnosis:</strong> ${currentData.primaryDiagnosis}</p>
        <p><strong>Disease Duration:</strong> ${currentData.diseaseDuration}</p>
        <p><strong>Functional Status:</strong> ${currentData.functionalStatus}</p>
        <p><strong>Current Management:</strong> ${currentData.currentManagement}</p>
    `;
    document.getElementById('current-status').innerHTML = statusHtml;
    
    // Medications
    const medsHtml = medicationsData.current.map(med => 
        `<div class="med-item">
            <strong>${med.name}</strong> - ${med.dose}
            <small>(Since ${med.since})</small>
        </div>`
    ).join('');
    document.getElementById('medications-list').innerHTML = medsHtml;
    
    // Recent events
    const eventsHtml = currentData.recentEvents.map(event => 
        `<div class="event-item">
            <strong>${event.date}</strong>: ${event.description}
        </div>`
    ).join('');
    document.getElementById('recent-events').innerHTML = eventsHtml;
}

// Update laboratory values
function updateLabs(labData) {
    const tbody = document.getElementById('lab-values');
    const rows = labData.current.map(lab => {
        const trendSymbol = lab.trend === 'up' ? '↑' : lab.trend === 'down' ? '↓' : '→';
        const trendColor = lab.trend === 'up' ? 'red' : lab.trend === 'down' ? 'green' : 'gray';
        
        return `
            <tr>
                <td>${lab.name}</td>
                <td><strong>${lab.value}</strong></td>
                <td>${lab.reference}</td>
                <td>${lab.date}</td>
                <td style="color: ${trendColor}">${trendSymbol}</td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = rows;
}

// Update oxygen analysis
function updateOxygenAnalysis(o2Data) {
    const summaryHtml = `
        <div class="o2-stats">
            <p><strong>Monitoring Period:</strong> ${o2Data.monitoringPeriod}</p>
            <p><strong>Total Sessions:</strong> ${o2Data.totalSessions}</p>
            <p><strong>Sessions < 90%:</strong> ${o2Data.sessionsBelow90} (${o2Data.percentBelow90})</p>
            <p><strong>Sessions < 80%:</strong> ${o2Data.sessionsBelow80} (${o2Data.percentBelow80})</p>
            <p><strong>Sessions < 70%:</strong> ${o2Data.sessionsBelow70} (${o2Data.percentBelow70})</p>
            <p><strong>Maximum Instability:</strong> ${o2Data.maxInstability} drops/hour</p>
        </div>
    `;
    document.getElementById('o2-summary').innerHTML = summaryHtml;
}

// Update timeline
function updateTimeline(timelineData) {
    // Disease timeline
    const diseaseTimelineHtml = timelineData.disease.map(item => 
        `<div class="timeline-item">
            <div class="date">${item.date}</div>
            <div class="description">${item.event}</div>
        </div>`
    ).join('');
    document.getElementById('disease-timeline').innerHTML = diseaseTimelineHtml;
    
    // Recent timeline
    const recentTimelineHtml = timelineData.recent.map(item => 
        `<div class="timeline-item">
            <div class="date">${item.date}</div>
            <div class="description">${item.event}</div>
        </div>`
    ).join('');
    document.getElementById('recent-timeline').innerHTML = recentTimelineHtml;
}

// Update neurological events
function updateNeuroEvents(neuroData) {
    const tbody = document.getElementById('neuro-events');
    const rows = neuroData.events.map(event => 
        `<tr>
            <td>${event.datetime}</td>
            <td>${event.type}</td>
            <td>${event.duration}</td>
            <td>${event.description}</td>
        </tr>`
    ).join('');
    
    tbody.innerHTML = rows;
}

// Chart creation functions
function createANAChart(anaData) {
    const ctx = document.getElementById('ana-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: anaData.dates,
            datasets: [{
                label: 'ANA Titer',
                data: anaData.values,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createAutonomicChart(autonomicData) {
    const ctx = document.getElementById('autonomic-chart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['No Response', 'Normal Response', 'Paradoxical Response'],
            datasets: [{
                data: [autonomicData.noResponse, autonomicData.normal, autonomicData.paradoxical],
                backgroundColor: ['#ffc107', '#28a745', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createSeverityChart(severityData) {
    const ctx = document.getElementById('severity-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: severityData.weeks,
            datasets: [{
                label: 'Lowest SpO2',
                data: severityData.lowestSpO2,
                backgroundColor: '#dc3545'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 20,
                    max: 100
                }
            }
        }
    });
}

// Error handling
function showErrorMessage() {
    const container = document.querySelector('.tab-content');
    container.innerHTML = `
        <div class="error-message">
            <h3>Unable to Load Dashboard Data</h3>
            <p>Please ensure all data files are present in the /data directory.</p>
        </div>
    `;
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', loadDashboardData);