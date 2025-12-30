import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './GameModal.css';

/**
 * GameModal - Reusable modal component for notifications and confirmations
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {string} title - Modal title
 * @param {string} message - Modal message content
 * @param {string} type - Modal type: 'info', 'error', 'success', 'warning', 'confirm'
 * @param {array} buttons - Array of button objects: [{ text, onClick, variant: 'primary'|'secondary'|'danger' }]
 */
const GameModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttons = []
}) => {
  if (!isOpen) return null;

  // Default buttons if none provided
  const modalButtons = buttons.length > 0 ? buttons : [
    { text: 'OK', onClick: onClose, variant: 'primary' }
  ];

  // Icon based on type
  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'success':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'confirm':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 11l3 3L22 4" />
          </svg>
        );
      default: // info
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="game-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`game-modal game-modal-${type}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="game-modal-icon">
            {getIcon()}
          </div>

          <h2 className="game-modal-title">{title}</h2>

          <p className="game-modal-message">{message}</p>

          <div className="game-modal-buttons">
            {modalButtons.map((button, index) => (
              <button
                key={index}
                className={`game-modal-btn ${button.variant || 'primary'}`}
                onClick={button.onClick}
              >
                {button.text}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default GameModal;
