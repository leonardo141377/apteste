import { useState, type FC } from 'react';
import { CustomModalLayout, Modal, Text } from '@wix/design-system';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const ConfirmDeleteModal: FC<Props> = ({ isOpen, title, message, onConfirm, onClose }) => {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose}>
      <CustomModalLayout
        theme="destructive"
        title={title}
        primaryButtonText={busy ? 'Excluindo…' : 'Excluir'}
        primaryButtonProps={{ disabled: busy }}
        primaryButtonOnClick={confirm}
        secondaryButtonText="Cancelar"
        secondaryButtonOnClick={onClose}
        onCloseButtonClick={onClose}
        content={<Text>{message}</Text>}
      />
    </Modal>
  );
};
