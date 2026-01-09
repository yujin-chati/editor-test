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
  initialContent?: string;
  initialStyle?: ComponentStyle;
  onSave: (newContent: string) => void;
  onStyleChange: (newStyle: ComponentStyle) => void;
  onClose: () => void;
}

type ActivePopup = 'none' | 'font' | 'color' | 'size' | 'align' | 'spacing';

export default function TextEditModal({
  component,
  initialContent,
  initialStyle,
  onSave,
  onStyleChange,
  onClose,
}: TextEditModalProps) {
  const baseViewportHeightRef = useRef<number>(
    typeof window !== 'undefined'
      ? window.innerHeight || document.documentElement.clientHeight
      : 0
  );
  const [htmlContent, setHtmlContent] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 툴바 상태
  const [activePopup, setActivePopup] = useState<ActivePopup>('none');
  const [selectedStyleId, setSelectedStyleId] = useState('classic');

  // 소프트 키보드가 올라왔을 때 툴바를 바로 위에 붙이기 위한 bottom 오프셋
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  // iOS Safari에서 키보드로 인해 스크롤된 양 (헤더 위치 보정용)
  const [scrollOffset, setScrollOffset] = useState(0);
  const keyboardWatcherRef = useRef<number | null>(null);

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

  // 키보드 높이 감지 - iOS Safari 대응
  useEffect(() => {
    const viewport = window.visualViewport;

    const updateKeyboardOffset = () => {
      if (!viewport) {
        setKeyboardOffset(0);
        setScrollOffset(0);
        return;
      }

      // layout viewport bottom과 visual viewport bottom 차이를 키보드 높이로 간주
      const layoutHeight =
        baseViewportHeightRef.current ||
        window.innerHeight ||
        document.documentElement.clientHeight;
      // iOS Safari: offsetTop은 keyboard 위로 밀린 만큼을 포함
      const visibleBottom = viewport.offsetTop + viewport.height;
      const offset = Math.max(0, Math.round(layoutHeight - visibleBottom));

      // iOS Safari에서 키보드로 인해 스크롤된 양 (헤더 보정용)
      const scrollY = Math.round(viewport.offsetTop);
      setScrollOffset(scrollY);
      setKeyboardOffset(offset);
    };

    // focusin 이벤트로 키보드 감지 (iOS에서 더 안정적)
    const handleFocusIn = () => {
      // 키보드가 올라오는 시간을 기다림
      setTimeout(updateKeyboardOffset, 100);
      setTimeout(updateKeyboardOffset, 200);
      setTimeout(updateKeyboardOffset, 300);
      setTimeout(updateKeyboardOffset, 400);
      setTimeout(updateKeyboardOffset, 500);

      // iOS에서 visualViewport 이벤트가 늦게 오는 경우 폴링으로 보정
      if (keyboardWatcherRef.current) {
        window.clearInterval(keyboardWatcherRef.current);
      }
      keyboardWatcherRef.current = window.setInterval(updateKeyboardOffset, 120);
      setTimeout(() => {
        if (keyboardWatcherRef.current) {
          window.clearInterval(keyboardWatcherRef.current);
          keyboardWatcherRef.current = null;
        }
      }, 1200);
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        setKeyboardOffset(0);
        setScrollOffset(0);
      }, 100);
      if (keyboardWatcherRef.current) {
        window.clearInterval(keyboardWatcherRef.current);
        keyboardWatcherRef.current = null;
      }
    };

    if (viewport) {
      viewport.addEventListener('resize', updateKeyboardOffset);
      viewport.addEventListener('scroll', updateKeyboardOffset);
    }

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // 초기 체크
    updateKeyboardOffset();

    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', updateKeyboardOffset);
        viewport.removeEventListener('scroll', updateKeyboardOffset);
      }
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      if (keyboardWatcherRef.current) {
        window.clearInterval(keyboardWatcherRef.current);
        keyboardWatcherRef.current = null;
      }
    };
  }, []);

  // 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    const baseHeight = baseViewportHeightRef.current || window.innerHeight || 0;
    const originalBodyStyle = document.body.style.cssText;
    const originalHtmlStyle = document.documentElement.style.cssText;
    const rootEl = document.getElementById('root');
    const originalRootStyle = rootEl?.style.cssText;

    // 화면 높이를 픽셀로 고정해 visualViewport 축소 시에도 캔버스가 이동하지 않도록 고정
    document.documentElement.style.cssText = `
      height: ${baseHeight}px;
      max-height: ${baseHeight}px;
      width: 100%;
      overflow: hidden;
      position: fixed;
      inset: 0;
    `;
    document.body.style.cssText = `
      overflow: hidden;
      position: fixed;
      width: 100%;
      height: ${baseHeight}px;
      max-height: ${baseHeight}px;
      top: 0;
      left: 0;
      touch-action: none;
    `;
    if (rootEl) {
      rootEl.style.cssText = `
        width: 100%;
        height: ${baseHeight}px;
        max-height: ${baseHeight}px;
      `;
    }

    return () => {
      document.body.style.cssText = originalBodyStyle;
      document.documentElement.style.cssText = originalHtmlStyle;
      if (rootEl && originalRootStyle !== undefined) {
        rootEl.style.cssText = originalRootStyle;
      }
    };
  }, []);

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

  // 초기화 핸들러
  const handleReset = useCallback(() => {
    // 텍스트 초기화
    if (initialContent !== undefined && editorRef.current) {
      const htmlText = initialContent.replace(/\n/g, '<br>');
      editorRef.current.innerHTML = htmlText;
      setHtmlContent(htmlText);
    }
    // 스타일 초기화
    if (initialStyle) {
      onStyleChange(initialStyle);
    }
  }, [initialContent, initialStyle, onStyleChange]);

  const togglePopup = (popup: ActivePopup) => {
    setActivePopup(prev => prev === popup ? 'none' : popup);
  };

  const iconBtnStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // 터치 이벤트 전파 방지
  const preventTouchPropagation = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const modalContent = (
    <>
      {/* Full Screen Background - 클릭하면 저장 후 닫기 */}
      <div
        onClick={handleBackdropClick}
        onTouchStart={preventTouchPropagation}
        onTouchMove={preventTouchPropagation}
        onTouchEnd={preventTouchPropagation}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: baseViewportHeightRef.current ? `${baseViewportHeightRef.current}px` : '100vh',
          backgroundColor: 'rgba(128, 128, 128, 0.2)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        {/* Header - 초기화 & 완료 버튼 (fixed at top, 스크롤 보정) */}
        <div
          style={{
            position: 'fixed',
            top: `${scrollOffset}px`,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            paddingTop: 'max(12px, env(safe-area-inset-top))',
            zIndex: 10001,
          }}
        >
          {/* 초기화 버튼 */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              opacity: (initialContent !== undefined || initialStyle) ? 1 : 0.5,
            }}
            disabled={!initialContent && !initialStyle}
          >
            <p
              style={{
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: 'Pretendard, -apple-system, sans-serif',
                color: '#ffffff',
                margin: 0,
                lineHeight: '1.5',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
            >
              초기화
            </p>
          </button>

          {/* 완료 버튼 */}
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
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: 'Pretendard, -apple-system, sans-serif',
                color: '#ffffff',
                margin: 0,
                lineHeight: '1.5',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
            >
              완료
            </p>
          </button>
        </div>

        {/* 중앙 편집 영역 - 헤더와 툴바/키보드 사이에 중앙 정렬 */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${56 + scrollOffset}px`, // 헤더 높이 + 스크롤 보정
            left: 0,
            right: 0,
            bottom: `${80 + keyboardOffset}px`, // 툴바 + 키보드 높이
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            transition: 'top 0.1s ease-out, bottom 0.15s ease-out',
            overflow: 'auto',
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
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: `${keyboardOffset}px`,
            zIndex: 10000,
          }}
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
              // 키보드가 올라오면 bottom에 붙도록 padding 최소화
              paddingBottom: keyboardOffset > 0 ? '8px' : 'max(8px, env(safe-area-inset-bottom))',
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
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="5" width="20" height="2.5" rx="1" fill="#fff"/>
                <rect x="4" y="12.5" width="12" height="2.5" rx="1" fill="#fff"/>
                <rect x="4" y="20" width="17" height="2.5" rx="1" fill="#fff"/>
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
