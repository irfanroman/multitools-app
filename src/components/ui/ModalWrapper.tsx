'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClass =
    size === 'sm' ? 'modal-panel-sm' :
    size === 'lg' ? 'modal-panel-lg' : 'modal-panel-md';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-panel ${sizeClass}`}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="modal-header-icon">{icon}</span>
            <h3 className="heading-sm">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="modal-close">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
