import { useState } from 'react';

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    description: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
  });

  const confirm = ({
    title,
    description,
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
  }) => {
    setConfig({ title, description, onConfirm, confirmText, cancelText, variant });
    setIsOpen(true);
  };

  const handleConfirm = () => {
    config.onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    config,
    confirm,
    handleConfirm,
    handleCancel,
    setIsOpen,
  };
};
