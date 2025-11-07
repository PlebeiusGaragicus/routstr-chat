'use client';

import React from 'react';
import { Drawer } from 'vaul';
import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  isMobile?: boolean;
  nested?: boolean;
  maxWidthClassName?: string; // allow overriding max width for desktop container
  title?: string; // optional title for accessibility
}

const SettingsDialog = ({ open, onOpenChange, children, isMobile: propIsMobile, nested, maxWidthClassName, title = "Dialog" }: SettingsDialogProps) => {
  const isMobile = propIsMobile ?? useMediaQuery('(max-width: 640px)');

  if (isMobile) {
    const Root: any = nested ? Drawer.NestedRoot : Drawer.Root;
    return (
      <Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
          <Drawer.Content className="bg-[#181818] flex flex-col rounded-t-[10px] mt-24 h-[80%] lg:h-fit max-h-[96%] fixed bottom-0 left-0 right-0 outline-none z-[60]">
            <div className="pt-4 pb-4 bg-[#181818] rounded-t-[10px] flex-1 overflow-y-auto">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 mb-8" aria-hidden />
              <div className="max-w-2xl mx-auto flex flex-col h-full">
                <DialogTitle className="sr-only">{title}</DialogTitle>
                {children}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Root>
    );
  }

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => onOpenChange(false)}>
        <DialogContent 
          className={`bg-[#181818] rounded-lg p-6 w-full border border-white/10 shadow-lg ${maxWidthClassName || 'max-w-md'}`}
          onClick={e => e.stopPropagation()}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {children}
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default SettingsDialog;


