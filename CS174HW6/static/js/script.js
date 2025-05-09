document.getElementById("searchBtn").addEventListener("click", searchStock);
document.getElementById("clearBtn").addEventListener("click", clearForm);

function showTab(id) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function clearForm() {
    document.getElementById("tickerInput").value = "";
    document.getElementById("outlook").innerHTML = "";
    document.getElementById("summary").innerHTML = "";
    document.getElementById("errorMsg").textContent = "";
}

function searchStock() {
    const ticker = document.getElementById("tickerInput").value.trim();
    if (!ticker) {
        document.getElementById("errorMsg").textContent = "Please fill out this field";
        return;
    }

    fetch(`/search?ticker=${ticker}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                document.getElementById("errorMsg").textContent = "Incorrect Stock Ticker";
                return;
            }

            document.getElementById("errorMsg").textContent = "";
            showTab('outlook');

            document.getElementById("outlook").innerHTML =
                `
                <h3>Company Outlook</h3>
                <table>
                    <tr><td>Company Name</td><td>${data.company.name}</td></tr>
                    <tr><td>Stock Ticker Symbol</td><td>${data.company.ticker}</td></tr>
                    <tr><td>Exchange Code</td><td>${data.company.exchangeCode}</td></tr>
                    <tr><td>Company Start Date</td><td>${data.company.startDate}</td></tr>
                    <tr><td>Description</td><td>${data.company.description.slice(0, 300)}...</td></tr>
                </table>
                `;

            change = (data.stock.tngoLast - data.stock.prevClose).toFixed(2);
            changePct = ((change / data.stock.prevClose) * 100).toFixed(2);
            const arrowImage = change >= 0
                ? '<img src="../static/images/GreenArrowUp.png" alt="Up" height="20">'
                : '<img src="../static/images/RedArrowDown.png" alt="Down" height="20">';

            const changeColor = change >= 0 ? 'green' : 'red';

            document.getElementById("summary").innerHTML =
                `
                <h3>Stock Summary</h3>
                ${data.served_from_cache ? `<p style="color: green;">Served from cache</p>` : ""}
                <table>
                    <tr><td>Stock Ticker Symbol</td><td>${data.stock.ticker}</td></tr>
                    <tr><td>Trading Day</td><td>${data.stock.timestamp}</td></tr>
                    <tr><td>Previous Closing Price</td><td>${data.stock.prevClose}</td></tr>
                    <tr><td>Opening Price</td><td>${data.stock.open}</td></tr>
                    <tr><td>High Price</td><td>${data.stock.high}</td></tr>
                    <tr><td>Low Price</td><td>${data.stock.low}</td></tr>
                    <tr><td>Last Price</td><td>${data.stock.tngoLast}</td></tr>
                    <tr><td>Change</td><td style="color:${changeColor}">${change} ${arrowImage}</td></tr>
                    <tr><td>Change Percent</td><td style="color:${changeColor}">${changePct}%</td></tr>
                    <tr><td>Shares Traded</td><td>${data.stock.volume}</td></tr>
                </table>
                `;
        });
}

function loadHistory() {
    showTab('history');
    fetch('/history')
        .then(res => res.json())
        .then(data => {
            const rows = data.map(r => `<tr><td>${r.ticker}</td><td>${r.timestamp}</td></tr>`).join("");
            document.getElementById("history").innerHTML =
                `
                <h3>Search History</h3>
                <table>
                    <tr><th>Ticker</th><th>Timestamp</th></tr>
                    ${rows}
                </table>
                `;
        });
}
