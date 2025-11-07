import React from 'react';

interface AppLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

/**
 * アプリケーションロゴコンポーネント
 * ガントチャートをモチーフにしたMicrosoft風デザイン
 */
export const AppLogo: React.FC<AppLogoProps> = ({ 
  size = 40, 
  showText = true,
  className = '' 
}) => {
  // ユニークなIDを生成（複数のロゴインスタンスでのID衝突を防ぐ）
  const uniqueId = React.useId();
  const bgGradientId = `bgGradient-${uniqueId}`;
  const barGradient1Id = `barGradient1-${uniqueId}`;
  const barGradient2Id = `barGradient2-${uniqueId}`;
  const barGradient3Id = `barGradient3-${uniqueId}`;
  const shadowId = `shadow-${uniqueId}`;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Gantt Chart Project Manager Logo"
      >
        <defs>
          <linearGradient id={bgGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#0078D4', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#106EBE', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={barGradient1Id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#50E6FF', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#0078D4', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={barGradient2Id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#96D726', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#00B294', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={barGradient3Id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#FFB900', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#F7630C', stopOpacity: 1 }} />
          </linearGradient>
          <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        <circle cx="60" cy="60" r="58" fill={`url(#${bgGradientId})`} filter={`url(#${shadowId})`}/>
        <circle cx="60" cy="60" r="50" fill="white" opacity="0.95"/>
        
        <rect x="25" y="30" width="45" height="8" rx="4" fill={`url(#${barGradient1Id})`} opacity="0.9"/>
        <circle cx="28" cy="34" r="3" fill="#0078D4"/>
        
        <rect x="25" y="48" width="60" height="8" rx="4" fill={`url(#${barGradient2Id})`} opacity="0.9"/>
        <circle cx="28" cy="52" r="3" fill="#00B294"/>
        
        <rect x="25" y="66" width="35" height="8" rx="4" fill={`url(#${barGradient3Id})`} opacity="0.9"/>
        <circle cx="28" cy="70" r="3" fill="#F7630C"/>
        
        <line x1="42" y1="26" x2="42" y2="78" stroke="#D1D1D1" strokeWidth="1" opacity="0.5"/>
        <line x1="60" y1="26" x2="60" y2="78" stroke="#D1D1D1" strokeWidth="1" opacity="0.5"/>
        <line x1="78" y1="26" x2="78" y2="78" stroke="#D1D1D1" strokeWidth="1" opacity="0.5"/>
        
        <g transform="translate(72, 78)">
          <rect x="0" y="0" width="18" height="18" rx="2" fill="#0078D4" opacity="0.9"/>
          <rect x="2" y="6" width="14" height="10" rx="1" fill="white"/>
          <line x1="5" y1="9" x2="13" y2="9" stroke="#0078D4" strokeWidth="1.5"/>
          <line x1="5" y1="12" x2="10" y2="12" stroke="#0078D4" strokeWidth="1.5"/>
        </g>
        
        <circle cx="70" cy="34" r="2" fill="#50E6FF" opacity="0.6"/>
        <circle cx="85" cy="52" r="2" fill="#96D726" opacity="0.6"/>
        <circle cx="62" cy="70" r="2" fill="#FFB900" opacity="0.6"/>
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-gray-900 leading-tight">
            Gantt Chart
          </span>
          <span className="text-xs text-gray-600 leading-tight">
            Project Manager
          </span>
        </div>
      )}
    </div>
  );
};
