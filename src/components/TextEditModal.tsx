import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

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

interface Component {
  id: string;
  type: string;
  content: string;
  style: ComponentStyle;
}

interface TextEditModalProps {
  component: Component;
  onSave: (newContent: string) => void;
  onStyleChange: (newStyle: ComponentStyle) => void;
  onClose: () => void;
}

type ActivePopup = 'none' | 'font' | 'color' | 'size' | 'align' | 'spacing';

export default function TextEditModal({
  component,
  onSave,
  onStyleChange,
  onClose,
}: TextEditModalProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 툴바 상태
  const [activePopup, setActivePopup] = useState<ActivePopup>('none');
  const [selectedStyleId, setSelectedStyleId] = useState('classic');

  const currentColor = component.style.color || '#333333';
  const currentSize = parseInt(component.style.fontSize?.replace('px', '') || '14');
  const currentAlign = (component.style.textAlign as 'left' | 'center' | 'right') || 'center';
  const currentLetterSpacing = parseFloat(component.style.letterSpacing?.replace('px', '') || '0');
  const currentLineHeight = parseFloat(component.style.lineHeight || '1.6');

  // 모달이 열릴 때 초기 텍스트 설정
  useEffect(() => {
    const htmlText = component.content.replace(/\n/g, '<br>');
    setHtmlContent(htmlText);
    setIsInitialized(false);
  }, [component.content]);

  // editorRef가 준비된 후 HTML 설정
  useEffect(() => {
    if (!isInitialized && editorRef.current && htmlContent) {
      editorRef.current.innerHTML = htmlContent;
      editorRef.current.focus();
      setIsInitialized(true);

      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, [isInitialized, htmlContent]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleInput = () => {
    if (!editorRef.current) return;
    setHtmlContent(editorRef.current.innerHTML);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();

      const br = document.createElement('br');
      range.insertNode(br);

      range.setStartAfter(br);
      range.setEndAfter(br);
      selection.removeAllRanges();
      selection.addRange(range);

      if (editorRef.current) {
        setHtmlContent(editorRef.current.innerHTML);
      }
    }
  };

  const handleSave = () => {
    const currentHtml = editorRef.current?.innerHTML || htmlContent;

    let cleanedHtml = currentHtml;
    cleanedHtml = cleanedHtml.replace(/<div><br><\/div>/gi, '<br>');
    cleanedHtml = cleanedHtml.replace(/<div>(.*?)<\/div>/gi, '<br>$1');
    cleanedHtml = cleanedHtml.replace(/^<br>/i, '');

    const plainText = cleanedHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '');

    onSave(plainText);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleSave();
    }
  };

  // 스타일 변경 핸들러들
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

  const iconBtnStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const modalContent = (
    <>
      {/* Full Screen Background - 클릭하면 저장 후 닫기 */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          backgroundColor: 'rgba(128, 128, 128, 0.2)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header - 완료 버튼만 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '12px 20px',
          }}
        >
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <p
              style={{
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'Pretendard, -apple-system, sans-serif',
                color: '#ffffff',
                margin: 0,
                lineHeight: '1.5',
              }}
            >
              완료
            </p>
          </button>
        </div>

        {/* 중앙 편집 영역 - 인스타처럼 요소가 중앙에 위치 */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            suppressContentEditableWarning
            style={{
              fontSize: component.style.fontSize || '16px',
              fontFamily: component.style.fontFamily || "'NanumMyeongjo', serif",
              fontWeight: component.style.fontWeight || 400,
              lineHeight: component.style.lineHeight || '1.6',
              letterSpacing: component.style.letterSpacing || '0px',
              color: component.style.color || '#333333',
              textAlign: currentAlign,
              outline: 'none',
              minWidth: '100px',
              maxWidth: '90%',
              caretColor: '#60c0ba',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          />
        </div>

        {/* 하단 툴바 */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ width: '100%' }}
        >
          {/* 팝업 영역 */}
          {activePopup !== 'none' && (
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                padding: '12px 16px',
              }}
            >
              {/* 폰트 */}
              {activePopup === 'font' && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {FONT_STYLES.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleFontStyleChange(f.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        backgroundColor: selectedStyleId === f.id ? '#fff' : 'rgba(255,255,255,0.15)',
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{
                        fontSize: '14px',
                        fontFamily: f.fontFamily,
                        fontWeight: f.fontWeight,
                        color: selectedStyleId === f.id ? '#000' : '#fff'
                      }}>
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

          {/* 메인 툴바 아이콘 */}
          <div
            style={{
              backgroundColor: 'rgba(50, 50, 50, 0.95)',
              padding: '8px 16px',
              paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {/* Aa 폰트 (활성 표시용) */}
            <button
              onClick={() => togglePopup('font')}
              style={{
                ...iconBtnStyle,
                backgroundColor: activePopup === 'font' ? 'rgba(255,255,255,0.2)' : 'transparent',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>Aa</span>
            </button>

            {/* 색상 */}
            <button
              onClick={() => togglePopup('color')}
              style={{
                ...iconBtnStyle,
                backgroundColor: activePopup === 'color' ? 'rgba(255,255,255,0.2)' : 'transparent',
                borderRadius: '8px',
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                border: '2px solid #fff',
              }} />
            </button>

            {/* 크기 */}
            <button
              onClick={() => togglePopup('size')}
              style={{
                ...iconBtnStyle,
                backgroundColor: activePopup === 'size' ? 'rgba(255,255,255,0.2)' : 'transparent',
                borderRadius: '8px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <text x="2" y="18" fontSize="14" fill="#fff" fontWeight="600" fontStyle="italic">A</text>
                <text x="12" y="14" fontSize="10" fill="#fff" fontWeight="600" fontStyle="italic">A</text>
              </svg>
            </button>

            {/* 정렬 */}
            <button
              onClick={() => togglePopup('align')}
              style={{
                ...iconBtnStyle,
                backgroundColor: activePopup === 'align' ? 'rgba(255,255,255,0.2)' : 'transparent',
                borderRadius: '8px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="6" width="16" height="2" rx="1" fill="#fff"/>
                <rect x="4" y="11" width="10" height="2" rx="1" fill="#fff"/>
                <rect x="4" y="16" width="14" height="2" rx="1" fill="#fff"/>
              </svg>
            </button>

            {/* 간격 */}
            <button
              onClick={() => togglePopup('spacing')}
              style={{
                ...iconBtnStyle,
                backgroundColor: activePopup === 'spacing' ? 'rgba(255,255,255,0.2)' : 'transparent',
                borderRadius: '8px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 6v12M20 6v12M8 12h8M8 9l-3 3 3 3M16 9l3 3-3 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
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
    </>
  );

  return createPortal(modalContent, document.body);
}
