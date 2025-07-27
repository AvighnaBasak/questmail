import React from 'react';

const MAX_USER_STORAGE = 100 * 1024 * 1024; // 100MB

const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

const UploadBar = ({ usage }: { usage: number }) => {
  const percent = Math.min(100, (usage / MAX_USER_STORAGE) * 100);
  return (
    <div className="w-full">
      <div className="bg-white/10 rounded h-4 mt-2 mb-1">
        <div className="bg-white h-4 rounded" style={{ width: `${percent}%` }} />
      </div>
      <div className="text-xs text-white/60 text-right">{formatMB(usage)}MB / 100.00MB used</div>
    </div>
  );
};

export default UploadBar;
