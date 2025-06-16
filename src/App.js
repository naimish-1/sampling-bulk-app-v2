import React, { useState } from 'react';

export default function App() {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwA5tEDjwD8XBub1kZLZSG_KsYjPH5FR4zqvRY4Y7DbYOKZ7dUvfhes_ifI6IoOul_ozQ/exec';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [activeTab, setActiveTab] = useState('sampling');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [bulkOrders, setBulkOrders] = useState([]);
  const [bulkRemarks, setBulkRemarks] = useState({});
  const [bulkImages, setBulkImages] = useState({});

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
        if (data.role === 'sourcing') fetchBulkOrders(email);
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

  const fetchBulkOrders = async (email) => {
    const res = await fetch(`${SCRIPT_URL}?action=getBulkOrders&email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setBulkOrders(data);
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

  const handleBulkSubmit = async (uniqueId) => {
  const formData = new URLSearchParams();
  formData.append('action', 'bulkUpdate');
  formData.append('uniqueId', uniqueId);
  formData.append('remark', bulkRemarks[uniqueId] || '');

  const file = bulkImages[uniqueId];

  const resetFields = () => {
    setBulkRemarks(prev => ({ ...prev, [uniqueId]: '' }));
    setBulkImages(prev => ({ ...prev, [uniqueId]: null }));
  };

  if (file) {
    const reader = new FileReader();
    reader.onloadend = async () => {
      formData.append('imageBase64', reader.result.split(',')[1]);
      formData.append('imageType', file.type);
      formData.append('imageName', file.name || 'upload.png');
      await sendBulkForm(formData);
      resetFields();
    };
    reader.readAsDataURL(file);
  } else {
    formData.append('imageBase64', 'null');
    await sendBulkForm(formData);
    resetFields();
  }
};


  const submitBulk = async (formData) => {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    alert('Bulk remark submitted!');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
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
    <div className="p-6">
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 ${activeTab === 'sampling' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('sampling')}
        >
          Sampling
        </button>
        {userType === 'sourcing' && (
          <button
            className={`px-4 py-2 ${activeTab === 'bulk' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('bulk')}
          >
            Bulk
          </button>
        )}
      </div>

      {activeTab === 'sampling' && userType === 'creator' && (
        <div>✅ Creator UI here (already added)</div>
      )}

      {activeTab === 'sampling' && userType === 'sourcing' && (
        <div>✅ Sourcing UI here (already added)</div>
      )}

      {activeTab === 'bulk' && userType === 'sourcing' && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Active Fabric Orders</h3>
{bulkOrders.map((order, i) => {
  const id = order['Unique ID'];
  return (
    <div key={i} className="bg-white shadow rounded p-4 mb-4">
<p><b>ID:</b> {id}</p>
<p><b>Brand:</b> {order['Brand Name']}</p>
<p><b>Vendor:</b> {order['Vendor Name']}</p>
<p><b>Fabric Detail:</b> {order['Fabric Quality']} | {order['Fabric Composition']}</p>
<p><b>Order:</b> {order['Order Quantity']} @ {order['Rate']}</p>
<p><b>Inhouse Date:</b> {order['Inhouse Date']}</p>
<p><b>History:</b> {order['Last Remark']} | {order['Last Updated']}</p>

      <textarea
        placeholder="Add remark"
        className="w-full border p-2 rounded mb-2"
        value={bulkRemarks[id] || ''}
        onChange={(e) => setBulkRemarks({ ...bulkRemarks, [id]: e.target.value })}
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="mb-2"
        onChange={(e) => setBulkImages({ ...bulkImages, [id]: e.target.files[0] })}
      />
      <button
        onClick={() => handleBulkSubmit(id)}
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
        Submit Remark
      </button>
    </div>
  );
})}

        </div>
      )}
    </div>
  );
}
