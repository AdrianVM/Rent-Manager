import React, { useState, useEffect, useRef } from 'react';
import apiService from '../../services/api';
import { renderAsync } from 'docx-preview';
import './ContractViewer.css';

function ContractViewer({ contract, onClose }) {
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState(null);
  const [renderingDocx, setRenderingDocx] = useState(false);
  const docxContainerRef = useRef(null);

  useEffect(() => {
    loadContractData();
  }, [contract.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (contractData && docxContainerRef.current) {
      renderDocxIfNeeded();
    }
  }, [contractData]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadContractData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getContract(contract.id);
      setContractData(data);
    } catch (err) {
      console.error('Error loading contract data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderDocxIfNeeded = async () => {
    if (!contractData || !contractData.fileContentBase64 || !docxContainerRef.current) {
      return;
    }

    const mimeType = contractData.mimeType || '';

    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword') || contractData.fileName.toLowerCase().endsWith('.docx') || contractData.fileName.toLowerCase().endsWith('.doc')) {
      setRenderingDocx(true);
      try {
        const arrayBuffer = Uint8Array.from(atob(contractData.fileContentBase64), c => c.charCodeAt(0)).buffer;

        await renderAsync(arrayBuffer, docxContainerRef.current, null, {
          className: 'docx-viewer',
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: false,
          useMathMLPolyfill: false,
          renderChanges: false,
          renderComments: false,
          renderFootnotes: true,
          renderHeaders: true,
          renderFooters: true
        });
      } catch (error) {
        console.error('Error rendering DOCX:', error);
        if (docxContainerRef.current) {
          docxContainerRef.current.innerHTML = `
            <div class="contract-viewer-error">
              <div class="contract-viewer-error-icon">⚠️</div>
              <p>Error loading Word document</p>
              <p>Please download the file to view its contents.</p>
            </div>
          `;
        }
      } finally {
        setRenderingDocx(false);
      }
    }
  };

  const renderContract = () => {
    if (!contractData || !contractData.fileContentBase64) {
      return <div>No contract content available</div>;
    }

    const mimeType = contractData.mimeType || '';

    if (mimeType.includes('pdf')) {
      const blob = new Blob([Uint8Array.from(atob(contractData.fileContentBase64), c => c.charCodeAt(0))], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      return (
        <iframe
          src={url}
          className="contract-viewer-iframe"
          title="Contract Viewer"
        />
      );
    } else if (mimeType.includes('wordprocessingml') || mimeType.includes('msword') || contractData.fileName.toLowerCase().endsWith('.docx') || contractData.fileName.toLowerCase().endsWith('.doc')) {
      // Handle Word documents
      return (
        <div className="contract-viewer-docx-container">
          {renderingDocx && (
            <div className="contract-viewer-docx-loading">
              Rendering Word document...
            </div>
          )}
          <div
            ref={docxContainerRef}
            className="contract-viewer-docx-content"
          />
        </div>
      );
    } else {
      return (
        <div className="contract-viewer-unsupported">
          <div className="contract-viewer-unsupported-icon">📄</div>
          <p>This file format cannot be previewed in the browser.</p>
          <p>File type: {mimeType}</p>
          <p>Please download the file to view its contents.</p>
        </div>
      );
    }
  };

  return (
    <div className="modal">
      <div className="modal-content contract-viewer-modal">
        <div className="modal-header">
          <h2>View Contract: {contract.fileName}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="contract-viewer-content">
          {loading ? (
            <div className="contract-viewer-loading">
              Loading contract...
            </div>
          ) : (
            renderContract()
          )}
        </div>
      </div>
    </div>
  );
}

export default ContractViewer;
