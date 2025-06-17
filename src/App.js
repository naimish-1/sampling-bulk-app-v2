import React, { useState } from 'react';

export default function App() {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwA5tEDjwD8XBub1kZLZSG_KsYjPH5FR4zqvRY4Y7DbYOKZ7dUvfhes_ifI6IoOul_ozQ/exec';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [soNumber, setSoNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [fabricQuality, setFabricQuality] = useState('');
  const [fabricQuantity, setFabricQuantity] = useState('');
  const [image, setImage] = useState(null);
  const [remark, setRemark] = useState('');
  const [inhouseDate, setInhouseDate] = useState('');

  const [sourcingRemarks, setSourcingRemarks] = useState({});
  const [vendorNames, setVendorNames] = useState({});
  const [invoiceFiles, setInvoiceFiles] = useState({});
  const [amounts, setAmounts] = useState({});

  const handleEmailLogin = async () => {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getRole&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.role === 'creator' || data.role === 'sourcing') {
        setUserType(data.role);
        setIsAuthenticated(true);
        fetchTickets(data.role);
      } else {
        setError('Access denied');
      }
    } catch {
      setError('Login failed');
    }
  };

  const fetchTickets = async (role) => {
    const action = role === 'creator' ? 'getCreatorTickets' : 'getSourcingTickets';
    const res = await fetch(`${SCRIPT_URL}?action=${action}&email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setTickets(data.reverse());
    fetchStatuses(data.map(t => t['Unique Ticket ID']));
  };

  const fetchStatuses = async (ids) => {
    const map = {};
    for (const id of ids) {
      const res = await fetch(`${SCRIPT_URL}?action=getLogsAndStatus&ticketId=${id}`);
      const data = await res.json();
      map[id] = data.status || {};
    }
    setStatusMap(map);
  };

  const handleSamplingSubmit = async (e) => {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append('action', 'submitTicket');
    formData.append('email', email);
    formData.append('soNumber', soNumber);
    formData.append('brand', brand);
    formData.append('fabricQuality', fabricQuality);
    formData.append('fabricQuantity', fabricQuantity);
    formData.append('remark', remark);
    formData.append('inhouseDate', inhouseDate);
    formData.append('imageName', image ? image.name : '');
    formData.append('imageType', image ? image.type : '');

    if (image) {
      const reader = new FileReader();
      reader.onloadend = () => {
        formData.append('image', reader.result.split(',')[1]);
        submitToScript(formData);
      };
      reader.readAsDataURL(image);
    } else {
      formData.append('image', 'null');
      submitToScript(formData);
    }
  };

  const submitToScript = async (formData) => {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    alert('Submitted!');
    fetchTickets(userType);

    
setSoNumber('');
setBrand('');
setFabricQuality('');
setFabricQuantity('');
setImage(null);
setRemark('');
setInhouseDate('');


  };

  const handleSourcingLog = async (ticketId) => {
    const formData = new URLSearchParams();
    formData.append('action', 'logSourcing');
    formData.append('ticketId', ticketId);
    formData.append('remark', sourcingRemarks[ticketId] || '');
    formData.append('vendorName', vendorNames[ticketId] || '');
    formData.append('amount', amounts[ticketId] || '');

    const file = invoiceFiles[ticketId];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        formData.append('invoiceName', file.name);
        formData.append('invoiceType', file.type);
        formData.append('invoiceBase64', reader.result.split(',')[1]);
        await sendSourcingForm(formData);
      };
      reader.readAsDataURL(file);
    } else {
      formData.append('invoiceBase64', 'null');
      await sendSourcingForm(formData);
    }
  };

  const sendSourcingForm = async (formData) => {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    alert('Sourcing log added.');
    fetchTickets(userType);
  };

  const requestClosure = async (ticketId) => {
    const formData = new URLSearchParams();
    formData.append('action', 'requestClosure');
    formData.append('ticketId', ticketId);
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    alert('Closure requested.');
    fetchTickets(userType);
  };

  const handleClosureResponse = async (ticketId, decision) => {
    const formData = new URLSearchParams();
    formData.append('action', 'respondClosure');
    formData.append('ticketId', ticketId);
    formData.append('response', decision);
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    alert(`Closure ${decision}d`);
    fetchTickets(userType);
  };

if (!isAuthenticated) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
        <input
          className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleEmailLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Login
        </button>
        {error && <p className="text-red-600 text-sm text-center mt-3">{error}</p>}
      </div>
    </div>
  );
}


  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome, {userType}</h2>

      {userType === 'creator' && (
        <>
<form onSubmit={handleSamplingSubmit} className="bg-white shadow-md rounded-lg p-6 w-full max-w-xl mx-auto my-6">
  <h3 className="text-xl font-semibold mb-4">Submit Sampling Ticket</h3>

  <input
    className="w-full p-2 border rounded mb-3"
    placeholder="SO Number"
    value={soNumber}
    onChange={(e) => setSoNumber(e.target.value)}
  />

  <input
    className="w-full p-2 border rounded mb-3"
    placeholder="Brand"
    value={brand}
    onChange={(e) => setBrand(e.target.value)}
  />

  <input
    className="w-full p-2 border rounded mb-3"
    placeholder="Fabric Quality"
    value={fabricQuality}
    onChange={(e) => setFabricQuality(e.target.value)}
  />

  <input
    className="w-full p-2 border rounded mb-3"
    placeholder="Fabric Quantity"
    value={fabricQuantity}
    onChange={(e) => setFabricQuantity(e.target.value)}
  />

  <input
    type="file"
    className="w-full mb-3"
    onChange={(e) => setImage(e.target.files[0])}
  />

  <textarea
    className="w-full p-2 border rounded mb-3"
    placeholder="Remark"
    value={remark}
    onChange={(e) => setRemark(e.target.value)}
  />

  <input
    type="date"
    className="w-full p-2 border rounded mb-4"
    value={inhouseDate}
    onChange={(e) => setInhouseDate(e.target.value)}
  />

  <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
    Submit Ticket
  </button>
</form>


          <h3>My Tickets</h3>
          {tickets.map((t, i) => {
            const id = t['Unique Ticket ID'] || 'N/A';
            const status = statusMap[id] || {};
            const statusText = status.approved ? '✅ Complete' : '🟢 Active';

            return (
              <div key={i} style={ticketStyle}>
                <strong>{t['SO Number']}</strong> - {t.Brand}<br />
                <b>ID:</b> {id}<br />
                <b>Status:</b> {statusText}<br />
                {!status.approved && (
                  <>
                    <button onClick={() => handleClosureResponse(id, 'approve')} style={buttonStyle}>Approve</button>
                    <button onClick={() => handleClosureResponse(id, 'reject')} style={buttonStyle}>Reject</button>
                  </>
                )}
              </div>
            );
          })}
        </>
      )}

      {userType === 'sourcing' && (
        <>
          <h3>Assigned Tickets</h3>
          {tickets.map((t, i) => {
            const id = t['Unique Ticket ID'] || 'N/A';
            const status = statusMap[id] || {};
            const isClosed = status.approved;
            const statusText = isClosed ? '✅ Complete' : '🟢 Active';

            return (
              <div key={i} style={ticketStyle}>
                <strong>{t['SO Number']}</strong> - {t.Brand}<br />
                <b>ID:</b> {id}<br />
                <b>Status:</b> {statusText}<br />
                <b>Quality:</b> {t['Fabric Quality']} | <b>Qty:</b> {t['Fabric Quantity']}<br />
                <b>Remark:</b> {t.Remark}<br />
                <b>Inhouse:</b> {t['Inhouse Date']}<br />

                {!isClosed && (
                  <>
                    <textarea
                      placeholder="Remark"
                      onChange={(e) => setSourcingRemarks({ ...sourcingRemarks, [id]: e.target.value })}
                      style={inputStyle}
                    />
                    <input
                      placeholder="Vendor"
                      onChange={(e) => setVendorNames({ ...vendorNames, [id]: e.target.value })}
                      style={inputStyle}
                    />
                    <input
                      placeholder="Amount"
                      onChange={(e) => setAmounts({ ...amounts, [id]: e.target.value })}
                      style={inputStyle}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setInvoiceFiles({ ...invoiceFiles, [id]: e.target.files[0] })}
                      style={inputStyle}
                    />
                    <button onClick={() => handleSourcingLog(id)} style={buttonStyle}>Add Log</button>
                    <button onClick={() => requestClosure(id)} style={buttonStyle}>Request Closure</button>
                  </>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// Styles
const inputStyle = { width: '100%', margin: '6px 0', padding: '10px', boxSizing: 'border-box' };
const buttonStyle = { padding: '10px', margin: '6px 6px 10px 0', cursor: 'pointer' };
const centeredContainer = { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const cardStyle = { width: 400, padding: 20, border: '1px solid #ccc', borderRadius: 8 };
const ticketStyle = { border: '1px solid #ccc', padding: 10, marginBottom: 15 };