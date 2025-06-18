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
   if (e) e.preventDefault();


   const formData = new URLSearchParams();
   formData.append('email', email);
   formData.append('action', 'submitTicket');


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
       const base64 = reader.result.split(',')[1];
       formData.append('image', base64);
       submitToScript(formData);
     };
     reader.readAsDataURL(image);
   } else {
     formData.append('image', 'null');
     submitToScript(formData);
   }
 };


 const submitToScript = async (formData) => {
   try {
     await fetch(
       'https://script.google.com/macros/s/AKfycbwA5tEDjwD8XBub1kZLZSG_KsYjPH5FR4zqvRY4Y7DbYOKZ7dUvfhes_ifI6IoOul_ozQ/exec',
       {
         method: 'POST',
         mode: 'no-cors',
         headers: {
           'Content-Type': 'application/x-www-form-urlencoded'
         },
         body: formData
       }
     );


     alert('Sampling Ticket submitted!');
     setSoNumber('');
     setBrand('');
     setFabricQuality('');
     setFabricQuantity('');
     setImage(null);
     setRemark('');
     setInhouseDate('');
   } catch (error) {
     console.error(error);
     alert('Submission failed.');
   }
 };


const inputStyle = { width: '100%', margin: '6px 0', padding: '10px', boxSizing: 'border-box' };
const buttonStyle = { padding: '10px', margin: '6px 6px 10px 0', cursor: 'pointer' };
const centeredContainer = { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const cardStyle = { width: 400, padding: 20, border: '1px solid #ccc', borderRadius: 8 };
const ticketStyle = { border: '1px solid #ccc', padding: 10, marginBottom: 15 };


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
 <>
   <form onSubmit={handleSamplingSubmit} className="bg-white shadow-md rounded-lg p-6 w-full max-w-xl mx-auto my-6">
     <h3 className="text-xl font-semibold mb-4">Submit Sampling Ticket</h3>


     <input className="w-full p-2 border rounded mb-3" placeholder="SO Number" value={soNumber} onChange={(e) => setSoNumber(e.target.value)} />
     <input className="w-full p-2 border rounded mb-3" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
     <input className="w-full p-2 border rounded mb-3" placeholder="Fabric Quality" value={fabricQuality} onChange={(e) => setFabricQuality(e.target.value)} />
     <input className="w-full p-2 border rounded mb-3" placeholder="Fabric Quantity" value={fabricQuantity} onChange={(e) => setFabricQuantity(e.target.value)} />
     <input type="file" className="w-full mb-3" onChange={(e) => setImage(e.target.files[0])} />
     <textarea className="w-full p-2 border rounded mb-3" placeholder="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} />
     <label className="block mb-1 font-medium">Inhouse Expectation:</label>
     <input type="date" className="w-full p-2 border rounded mb-4" value={inhouseDate} onChange={(e) => setInhouseDate(e.target.value)} />


     <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
       Submit Ticket
     </button>
   </form>
 </>
)}


{activeTab === 'sampling' && userType === 'sourcing' && (
 <>
   <h3 className="text-xl font-semibold mb-4">Assigned Tickets</h3>
   {tickets.map((t, i) => {
     const id = t['Unique Ticket ID'] || 'N/A';
     const status = statusMap[id] || {};
     const isClosed = status.approved;
     const statusText = isClosed ? '✅ Complete' : '🟢 Active';


     return (
       <div key={i} className="bg-white shadow rounded p-4 mb-4">
         <p><b>ID:</b> {id}</p>
         <p><b>SO Number:</b> {t['SO Number']}</p>
         <p><b>Brand:</b> {t['Brand']}</p>
         <p><b>Fabric:</b> {t['Fabric Quality']} | {t['Fabric Quantity']}</p>
         <p><b>Remark:</b> {t['Remark']}</p>
         <p><b>Inhouse:</b> {t['Inhouse Date']}</p>
         <p><b>Status:</b> {statusText}</p>


         {!isClosed && (
           <>
             <textarea
               placeholder="Add remark"
               className="w-full border p-2 rounded mb-2"
               value={sourcingRemarks[id] || ''}
               onChange={(e) =>
                 setSourcingRemarks({ ...sourcingRemarks, [id]: e.target.value })
               }
             />
             <input
               placeholder="Vendor Name"
               className="w-full border p-2 rounded mb-2"
               onChange={(e) =>
                 setVendorNames({ ...vendorNames, [id]: e.target.value })
               }
             />
             <input
               placeholder="Amount"
               className="w-full border p-2 rounded mb-2"
               onChange={(e) =>
                 setAmounts({ ...amounts, [id]: e.target.value })
               }
             />
             <input
               type="file"
               accept="image/*"
               capture="environment"
               className="mb-2"
               onChange={(e) =>
                 setInvoiceFiles({ ...invoiceFiles, [id]: e.target.files[0] })
               }
             />
             <button
               onClick={() => handleSourcingLog(id)}
               className="bg-blue-600 text-white px-3 py-1 rounded mr-2"
             >
               Add Log
             </button>
             <button
               onClick={() => requestClosure(id)}
               className="bg-yellow-500 text-white px-3 py-1 rounded"
             >
               Request Closure
             </button>
           </>
         )}
       </div>
     );
   })}
 </>
)}
return (
   <div style={{ padding: 20 }}>
     <div style={headerStyle}>
       <h1>Textile Workflow Dashboard</h1>
       <div>
         <span>Logged in as: {userType}</span>{' '}
         <button onClick={() => { setIsAuthenticated(false); setEmail(''); }}>Logout</button>
       </div>
     </div>


     <div style={{ marginTop: 20 }}>
       <button onClick={() => setActiveTab('sampling')} style={buttonStyle}>Sampling</button>
       <button onClick={() => setActiveTab('bulk')} style={buttonStyle}>Bulk</button>
     </div>


     <div style={{ marginTop: 20 }}>
       {activeTab === 'sampling' && userType === 'creator' && (
         <form onSubmit={handleSamplingSubmit} style={{ maxWidth: 600 }}>
           <h2>Sampling Ticket</h2>
           <input placeholder="SO Number" value={soNumber} onChange={(e) => setSoNumber(e.target.value)} style={inputStyle} />
           <input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} style={inputStyle} />
           <input placeholder="Fabric Quality" value={fabricQuality} onChange={(e) => setFabricQuality(e.target.value)} style={inputStyle} />
           <input placeholder="Fabric Quantity" value={fabricQuantity} onChange={(e) => setFabricQuantity(e.target.value)} style={inputStyle} />
           <input type="file" onChange={(e) => setImage(e.target.files[0])} style={{ margin: '10px 0' }} />
           <textarea placeholder="Remark (optional)" value={remark} onChange={(e) => setRemark(e.target.value)} style={inputStyle} />
           <label>Inhouse Expectation Date:</label>
           <input type="date" value={inhouseDate} onChange={(e) => setInhouseDate(e.target.value)} style={inputStyle} />
           <button type="submit" style={{ padding: 10, marginTop: 10 }}>Submit Sampling Ticket</button>
         </form>
       )}
     </div>
   </div>
 );
</div>
 );
}