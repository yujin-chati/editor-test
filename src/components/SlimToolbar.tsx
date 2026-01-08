import { useState, useCallback, useEffect } from 'react';

// 폰트 스타일 프리셋
const FONT_STYLES = [
  { id: 'modern', name: 'Modern', fontFamily: 'Pretendard, sans-serif', fontWeight: 400 },
  { id: 'classic', name: 'Classic', fontFamily: "'NanumMyeongjo', serif", fontWeight: 400 },
  { id: 'signature', name: 'Signature', fontFamily: "'Gowun Batang', serif", fontWeight: 400 },
  { id: 'bold', name: 'Bold', fontFamily: 'Pretendard, sans-serif', fontWeight: 700 },
  { id: 'serif', name: 'Serif', fontFamily: "'Noto Serif KR', serif", fontWeight: 600 },
];

// 색상 팔레트
const COLORS = [
  '#FFFFFF', '#000000', '#333333', '#666666', '#999999',
  '#674206', '#8B4513', '#A52A2A', '#CD5C5C',
  '#000080', '#4169E1', '#006400', '#32CD32',
];

interface ComponentStyle {
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  textAlign?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
}

interface SlimToolbarProps {
  style: ComponentStyle;
  onStyleChange: (newStyle: ComponentStyle) => void;
  onClose: () => void;
}

type ActivePopup = 'none' | 'font' | 'color' | 'size' | 'align' | 'spacing';

export default function SlimToolbar({
  style,
  onStyleChange,
  onClose,
}: SlimToolbarProps) {
  const [activePopup, setActivePopup] = useState<ActivePopup>('none');
  const [selectedStyleId, setSelectedStyleId] = useState('classic');
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const currentColor = style.color || '#333333';
  const currentSize = parseInt(style.fontSize?.replace('px', '') || '14');
  const currentAlign = (style.textAlign as 'left' | 'center' | 'right') || 'center';
  const currentLetterSpacing = parseFloat(style.letterSpacing?.replace('px', '') || '0');
  const currentLineHeight = parseFloat(style.lineHeight || '1.6');

  const handleFontStyleChange = useCallback((styleId: string) => {
    setSelectedStyleId(styleId);
    const fontStyle = FONT_STYLES.find(f => f.id === styleId);
    if (fontStyle) {
      onStyleChange({ fontFamily: fontStyle.fontFamily, fontWeight: fontStyle.fontWeight });
    }
  }, [onStyleChange]);

  const handleColorChange = useCallback((color: string) => {
    onStyleChange({ color });
  }, [onStyleChange]);

  const handleSizeChange = useCallback((size: number) => {
    onStyleChange({ fontSize: `${size}px` });
  }, [onStyleChange]);

  const handleAlignChange = useCallback((align: 'left' | 'center' | 'right') => {
    onStyleChange({ textAlign: align });
  }, [onStyleChange]);

  const handleSpacingChange = useCallback((letterSpacing: number, lineHeight: number) => {
    onStyleChange({ letterSpacing: `${letterSpacing}px`, lineHeight: `${lineHeight}` });
  }, [onStyleChange]);

  const togglePopup = (popup: ActivePopup) => {
    setActivePopup(prev => prev === popup ? 'none' : popup);
  };

  // 키보드가 올라올 때 바텀시트를 위로 올리기
  useEffect(() => {
    const viewport = window.visualViewport;

    const updateOffset = () => {
      if (!viewport) {
        setKeyboardOffset(0);
        return;
      }
      const layoutHeight = window.innerHeight || document.documentElement.clientHeight;
      const visibleBottom = viewport.offsetTop + viewport.height;
      const offset = Math.max(0, Math.round(layoutHeight - visibleBottom));
      setKeyboardOffset(offset);
    };

    const handleFocusIn = () => {
      setTimeout(updateOffset, 100);
      setTimeout(updateOffset, 200);
      setTimeout(updateOffset, 300);
      setTimeout(updateOffset, 400);
      setTimeout(updateOffset, 500);
    };
    const handleFocusOut = () => {
      setTimeout(() => setKeyboardOffset(0), 100);
    };

    viewport?.addEventListener('resize', updateOffset);
    viewport?.addEventListener('scroll', updateOffset);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    updateOffset();

    return () => {
      viewport?.removeEventListener('resize', updateOffset);
      viewport?.removeEventListener('scroll', updateOffset);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', left: 0, bottom: 0, width: '100%', zIndex: 50 }}>
      {/* 팝업 영역 */}
      {activePopup !== 'none' && (
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            padding: '12px 16px',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            marginBottom: `${keyboardOffset}px`,
          }}
        >
          {/* 폰트 */}
          {activePopup === 'font' && (
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {FONT_STYLES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFontStyleChange(f.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '16px',
                    backgroundColor: selectedStyleId === f.id ? '#fff' : 'rgba(255,255,255,0.15)',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '13px', fontFamily: f.fontFamily, color: selectedStyleId === f.id ? '#000' : '#fff' }}>
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 색상 */}
          {activePopup === 'color' && (
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: currentColor === color ? '2px solid #60c0ba' : color === '#FFFFFF' ? '1px solid #555' : 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}

          {/* 크기 */}
          {activePopup === 'size' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
              <span style={{ color: '#888', fontSize: '11px' }}>A</span>
              <input
                type="range"
                min="10"
                max="40"
                value={currentSize}
                onChange={(e) => handleSizeChange(Number(e.target.value))}
                style={{
                  flex: 1, height: '3px', borderRadius: '2px', outline: 'none',
                  WebkitAppearance: 'none', appearance: 'none',
                  background: `linear-gradient(to right, #60c0ba ${((currentSize - 10) / 30) * 100}%, #444 ${((currentSize - 10) / 30) * 100}%)`,
                }}
              />
              <span style={{ color: '#888', fontSize: '15px' }}>A</span>
              <span style={{ color: '#fff', fontSize: '13px', width: '28px', textAlign: 'right' }}>{currentSize}</span>
            </div>
          )}

          {/* 정렬 */}
          {activePopup === 'align' && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => handleAlignChange(align)}
                  style={{
                    width: '44px', height: '44px', borderRadius: '8px',
                    backgroundColor: currentAlign === align ? 'rgba(96, 192, 186, 0.25)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    {align === 'left' && <path d="M3 4h14M3 8h8M3 12h14M3 16h8" stroke={currentAlign === align ? '#60c0ba' : '#fff'} strokeWidth="1.5" strokeLinecap="round" />}
                    {align === 'center' && <path d="M3 4h14M6 8h8M3 12h14M6 16h8" stroke={currentAlign === align ? '#60c0ba' : '#fff'} strokeWidth="1.5" strokeLinecap="round" />}
                    {align === 'right' && <path d="M3 4h14M9 8h8M3 12h14M9 16h8" stroke={currentAlign === align ? '#60c0ba' : '#fff'} strokeWidth="1.5" strokeLinecap="round" />}
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* 간격 */}
          {activePopup === 'spacing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#888', fontSize: '12px', width: '36px' }}>자간</span>
                <input
                  type="range" min="-2" max="5" step="0.5" value={currentLetterSpacing}
                  onChange={(e) => handleSpacingChange(Number(e.target.value), currentLineHeight)}
                  style={{
                    flex: 1, height: '3px', borderRadius: '2px', outline: 'none',
                    WebkitAppearance: 'none', appearance: 'none',
                    background: `linear-gradient(to right, #60c0ba ${((currentLetterSpacing + 2) / 7) * 100}%, #444 ${((currentLetterSpacing + 2) / 7) * 100}%)`,
                  }}
                />
                <span style={{ color: '#fff', fontSize: '12px', width: '36px', textAlign: 'right' }}>{currentLetterSpacing}px</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#888', fontSize: '12px', width: '36px' }}>행간</span>
                <input
                  type="range" min="1" max="2.5" step="0.1" value={currentLineHeight}
                  onChange={(e) => handleSpacingChange(currentLetterSpacing, Number(e.target.value))}
                  style={{
                    flex: 1, height: '3px', borderRadius: '2px', outline: 'none',
                    WebkitAppearance: 'none', appearance: 'none',
                    background: `linear-gradient(to right, #60c0ba ${((currentLineHeight - 1) / 1.5) * 100}%, #444 ${((currentLineHeight - 1) / 1.5) * 100}%)`,
                  }}
                />
                <span style={{ color: '#fff', fontSize: '12px', width: '36px', textAlign: 'right' }}>{currentLineHeight.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 메인 툴바 - 아이콘만 한 줄 */}
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          padding: '10px 16px',
          paddingBottom: keyboardOffset > 0 ? '10px' : 'max(10px, env(safe-area-inset-bottom))',
          marginBottom: `${keyboardOffset}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '4px',
        }}
      >
        {/* Aa 폰트 */}
        <button onClick={() => togglePopup('font')} style={iconBtnStyle}>
          <span style={{ fontSize: '22px', fontFamily: 'serif', fontWeight: 600, color: activePopup === 'font' ? '#60c0ba' : '#fff' }}>Aa</span>
        </button>

        {/* 색상 */}
        <button onClick={() => togglePopup('color')} style={iconBtnStyle}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', backgroundColor: currentColor,
            border: currentColor === '#FFFFFF' ? '2px solid #555' : activePopup === 'color' ? '2px solid #60c0ba' : '2px solid transparent',
          }} />
        </button>

        {/* 크기 */}
        <button onClick={() => togglePopup('size')} style={iconBtnStyle}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <text x="1" y="22" fontSize="18" fill={activePopup === 'size' ? '#60c0ba' : '#fff'} fontWeight="600">A</text>
            <text x="15" y="17" fontSize="11" fill={activePopup === 'size' ? '#60c0ba' : '#fff'} fontWeight="600">A</text>
          </svg>
        </button>

        {/* 정렬 */}
        <button onClick={() => togglePopup('align')} style={iconBtnStyle}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="5" width="20" height="2.5" rx="1" fill={activePopup === 'align' ? '#60c0ba' : '#fff'}/>
            <rect x="4" y="12.5" width="12" height="2.5" rx="1" fill={activePopup === 'align' ? '#60c0ba' : '#fff'}/>
            <rect x="4" y="20" width="17" height="2.5" rx="1" fill={activePopup === 'align' ? '#60c0ba' : '#fff'}/>
          </svg>
        </button>

        {/* 간격 */}
        <button onClick={() => togglePopup('spacing')} style={iconBtnStyle}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M4 7v14M24 7v14M9 14h10M9 10l-4 4 4 4M19 10l4 4-4 4" stroke={activePopup === 'spacing' ? '#60c0ba' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* 완료 */}
        <button onClick={onClose} style={{ backgroundColor: '#60c0ba', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>완료</span>
        </button>
      </div>

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
          background: #fff; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        input[type='range']::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%; background: #fff;
          cursor: pointer; border: none; box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
