import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [records, setRecords] = useState([]);
  const [account, setAccount] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'records'

  useEffect(() => {
    loadWeb3();
    fetchRecords();
  }, []);

  // ... (keeping all the existing functions: loadWeb3, onFileChange, onUpload, fetchRecords)
  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        setError("User denied account access");
      }
    } else {
      setError('Please install MetaMask!');
    }
  };

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadProgress(0);
  };

  const onUpload = async (e) => {
    e.preventDefault();
    if (!file || !name || !email) {
      setError("Please provide all details and a file.");
      return;
    }
    
    setIsUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:3001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      console.log("Upload success:", res.data);
      fetchRecords();
      setFile(null);
      setName('');
      setEmail('');
      e.target.reset();
      setActiveTab('records'); // Switch to records tab after successful upload
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const fetchRecords = async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get('http://localhost:3001/records');
      setRecords(res.data.records);
    } catch (err) {
      setError('Failed to fetch records');
    } finally {
      setIsRefreshing(false);
    }
  };

  const spinnerStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <style>{spinnerStyle}</style>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          color: '#333',
          marginBottom: '1rem',
          fontSize: '24px'
        }}>eKYC Application</h1>
        
        {account && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '5px',
            marginBottom: '2rem',
          }}>
            <p style={{ margin: 0, color: '#666' }}>
              Connected account: {`${account.slice(0, 6)}...${account.slice(-4)}`}
            </p>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '5px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          {['upload', 'records'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: 'none',
                borderBottom: `2px solid ${activeTab === tab ? '#3b82f6' : 'transparent'}`,
                color: activeTab === tab ? '#3b82f6' : '#666',
                fontWeight: activeTab === tab ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'upload' ? 'Upload KYC' : 'View Records'}
            </button>
          ))}
        </div>

        {/* Upload Form Tab */}
        {activeTab === 'upload' && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '2rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <form onSubmit={onUpload}>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    fontSize: '16px'
                  }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    fontSize: '16px'
                  }}
                />
                <input
                  type="file"
                  onChange={onFileChange}
                  required
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem',
                    marginBottom: '1rem'
                  }}
                />
                <button
                  type="submit"
                  disabled={!file || isUploading}
                  style={{
                    backgroundColor: !file || isUploading ? '#ccc' : '#3b82f6',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: !file || isUploading ? 'not-allowed' : 'pointer',
                    width: '100%',
                    fontSize: '16px'
                  }}
                >
                  {isUploading ? 'Uploading...' : 'Upload & Submit KYC'}
                </button>
              </div>

              {isUploading && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <p style={{ textAlign: 'center', color: '#666', marginTop: '0.5rem' }}>
                    {uploadProgress}% uploaded
                  </p>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '1rem'
            }}>
              <button
                onClick={fetchRecords}
                disabled={isRefreshing}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #3b82f6',
                  color: '#3b82f6',
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  cursor: isRefreshing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isRefreshing && (
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #3b82f6',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                )}
                {isRefreshing ? 'Refreshing...' : 'Refresh Records'}
              </button>
            </div>

            {records.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '2rem 0' }}>
                No KYC records submitted yet
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {records.map((record, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#f8f9fa',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <p style={{ color: '#666', margin: '0 0 0.25rem 0' }}>Name</p>
                        <p style={{ margin: 0, fontWeight: '500' }}>{record[1]}</p>
                      </div>
                      <div>
                        <p style={{ color: '#666', margin: '0 0 0.25rem 0' }}>Email</p>
                        <p style={{ margin: 0, fontWeight: '500' }}>{record[2]}</p>
                      </div>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <p style={{ color: '#666', margin: '0 0 0.25rem 0' }}>IPFS Link</p>
                      <a
                        href={record[3]}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#3b82f6',
                          textDecoration: 'none',
                          wordBreak: 'break-all'
                        }}
                      >
                        {record[3]}
                      </a>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#666',
                      fontSize: '0.875rem',
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <span>Uploaded by: {`${record[0].slice(0, 6)}...${record[0].slice(-4)}`}</span>
                      <span>{new Date(record[4] * 1000).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;